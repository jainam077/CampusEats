"""OpenAI integration for AI-powered features."""

import json
from typing import List, Dict, Any, Optional
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import get_settings

settings = get_settings()


def get_openai_client() -> Optional[OpenAI]:
    """Get OpenAI client if configured."""
    if not settings.LLM_ENABLED or not settings.OPENAI_API_KEY:
        return None
    return OpenAI(api_key=settings.OPENAI_API_KEY)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def generate_recommendation_explanation(
    dish: Dict[str, Any],
    user_preferences: Optional[Dict[str, Any]] = None,
    context: Optional[str] = None
) -> str:
    """
    Generate a personalized explanation for why a dish is recommended.
    
    Args:
        dish: Dish data including name, description, nutrition, dietary tags
        user_preferences: User's dietary preferences, allergens, goals
        context: Additional context (time of day, previous orders, etc.)
    
    Returns:
        Personalized explanation string
    """
    client = get_openai_client()
    if not client:
        # Fallback to simple heuristic explanation
        return _generate_fallback_explanation(dish, user_preferences)
    
    # Build prompt
    dish_info = f"""
Dish: {dish.get('name', 'Unknown')}
Description: {dish.get('description', 'No description')}
Calories: {dish.get('calories', 'N/A')}
Protein: {dish.get('protein', 'N/A')}g
Dietary Tags: {', '.join(dish.get('dietary_tags', []) or ['None'])}
"""
    
    user_info = ""
    if user_preferences:
        user_info = f"""
User Preferences:
- Dietary: {', '.join(user_preferences.get('dietary_preferences', []) or ['None'])}
- Allergens to avoid: {', '.join(user_preferences.get('allergens', []) or ['None'])}
- Calorie goal: {user_preferences.get('calorie_goal', 'Not set')}
- Protein goal: {user_preferences.get('protein_goal', 'Not set')}g
"""
    
    prompt = f"""You are a helpful campus dining assistant. Generate a short, friendly 1-2 sentence explanation for why this dish is being recommended to a student.

{dish_info}
{user_info}
{f"Context: {context}" if context else ""}

Keep it casual and helpful. Focus on nutritional benefits, dietary match, or taste appeal. Don't use phrases like "I recommend" - just explain why it's a good choice."""

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful campus dining assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI error: {e}")
        return _generate_fallback_explanation(dish, user_preferences)


def _generate_fallback_explanation(dish: Dict, user_preferences: Optional[Dict] = None) -> str:
    """Generate a simple explanation without AI."""
    name = dish.get('name', 'This dish')
    calories = dish.get('calories')
    protein = dish.get('protein')
    tags = dish.get('dietary_tags') or []
    
    reasons = []
    
    if protein and protein >= 25:
        reasons.append("high in protein")
    if calories and calories <= 400:
        reasons.append("lighter option")
    if 'vegan' in tags:
        reasons.append("plant-based")
    if 'vegetarian' in tags:
        reasons.append("vegetarian-friendly")
    if 'gluten-free' in tags:
        reasons.append("gluten-free")
    
    if user_preferences:
        user_diet = user_preferences.get('dietary_preferences', [])
        for pref in user_diet:
            if pref.lower() in [t.lower() for t in tags]:
                reasons.append(f"matches your {pref} preference")
                break
    
    if reasons:
        return f"{name} is a great choice - {', '.join(reasons[:2])}!"
    return f"{name} is a popular choice among students!"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def natural_language_search(
    query: str,
    available_dishes: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Search for dishes using natural language query.
    
    Args:
        query: Natural language query like "something spicy and vegetarian"
        available_dishes: List of available dishes to search through
    
    Returns:
        Filtered and ranked list of matching dishes
    """
    client = get_openai_client()
    if not client:
        # Fallback to keyword search
        return _keyword_search(query, available_dishes)
    
    # Prepare dishes summary for the prompt
    dishes_summary = []
    for dish in available_dishes[:50]:  # Limit for token efficiency
        dishes_summary.append({
            "id": dish.get("dish_id"),
            "name": dish.get("name"),
            "description": dish.get("description", "")[:100],
            "tags": dish.get("dietary_tags", []),
            "calories": dish.get("calories")
        })
    
    prompt = f"""Given this user query about food: "{query}"

And these available dishes:
{json.dumps(dishes_summary, indent=2)}

Return a JSON array of dish IDs that best match the query, ordered by relevance.
Only include dishes that genuinely match the request.
Return format: {{"matching_ids": [1, 5, 3]}}

If no dishes match, return {{"matching_ids": []}}"""

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful food search assistant. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.3
        )
        
        result = json.loads(response.choices[0].message.content)
        matching_ids = result.get("matching_ids", [])
        
        # Return dishes in the order specified
        id_to_dish = {d.get("dish_id"): d for d in available_dishes}
        return [id_to_dish[id] for id in matching_ids if id in id_to_dish]
        
    except Exception as e:
        print(f"OpenAI search error: {e}")
        return _keyword_search(query, available_dishes)


def _keyword_search(query: str, dishes: List[Dict]) -> List[Dict]:
    """Simple keyword-based search fallback."""
    query_lower = query.lower()
    keywords = query_lower.split()
    
    scored_dishes = []
    for dish in dishes:
        score = 0
        dish_text = f"{dish.get('name', '')} {dish.get('description', '')}".lower()
        tags = [t.lower() for t in (dish.get('dietary_tags') or [])]
        
        for keyword in keywords:
            if keyword in dish_text:
                score += 2
            if keyword in tags:
                score += 3
        
        if score > 0:
            scored_dishes.append((score, dish))
    
    scored_dishes.sort(key=lambda x: x[0], reverse=True)
    return [dish for _, dish in scored_dishes[:20]]


def analyze_meal_nutrition(dishes: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyze combined nutrition of multiple dishes (meal planning).
    
    Args:
        dishes: List of dishes in a meal
    
    Returns:
        Nutritional summary and suggestions
    """
    totals = {
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0
    }
    
    for dish in dishes:
        totals["calories"] += dish.get("calories", 0) or 0
        totals["protein"] += dish.get("protein", 0) or 0
        totals["carbs"] += dish.get("carbs", 0) or 0
        totals["fat"] += dish.get("fat", 0) or 0
    
    suggestions = []
    
    if totals["calories"] > 800:
        suggestions.append("This meal is quite filling - consider splitting it into two portions")
    if totals["protein"] < 20:
        suggestions.append("Consider adding a protein-rich side like grilled chicken or eggs")
    if totals["protein"] >= 30:
        suggestions.append("Great protein content for muscle recovery!")
    
    return {
        "totals": totals,
        "suggestions": suggestions,
        "dish_count": len(dishes)
    }


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def get_dietary_analysis(
    dish: Dict[str, Any],
    user_goals: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Get AI-powered dietary analysis and suggestions for a dish.
    
    Args:
        dish: Dish data including nutrition info
        user_goals: Optional user dietary goals (calorie_goal, protein_goal, etc.)
    
    Returns:
        Dictionary with analysis, health_score, tips, and warnings
    """
    client = get_openai_client()
    
    # Calculate basic metrics
    calories = dish.get("calories", 0) or 0
    protein = dish.get("protein", 0) or 0
    carbs = dish.get("carbs", 0) or 0
    fat = dish.get("fat", 0) or 0
    dietary_tags = dish.get("dietary_tags") or []
    
    # Heuristic health score (0-100)
    health_score = 70  # Base score
    
    # Protein boost
    if protein >= 25:
        health_score += 15
    elif protein >= 15:
        health_score += 10
    
    # Calorie considerations
    if calories > 700:
        health_score -= 15
    elif calories < 400:
        health_score += 5
    
    # Dietary tag bonuses
    if "vegan" in dietary_tags:
        health_score += 5
    if "gluten-free" in dietary_tags:
        health_score += 3
    if "high-protein" in dietary_tags:
        health_score += 5
    
    health_score = max(0, min(100, health_score))
    
    # Generate fallback analysis
    tips = []
    warnings = []
    
    if calories > 600:
        warnings.append("High calorie content - consider portion control")
    if protein < 15:
        tips.append("Pair with a protein source for a more balanced meal")
    if protein >= 25:
        tips.append("Excellent protein content for muscle building")
    if "vegan" in dietary_tags:
        tips.append("Plant-based option - good for sustainability")
    if fat > 25:
        warnings.append("Higher fat content - balance with lighter options later")
    
    # Try AI analysis if available
    if client:
        try:
            prompt = f"""Analyze this dish nutritionally and provide brief, helpful advice for a college student:

Dish: {dish.get('name', 'Unknown')}
Calories: {calories}
Protein: {protein}g
Carbs: {carbs}g
Fat: {fat}g
Dietary Tags: {', '.join(dietary_tags) if dietary_tags else 'None'}
{f"User's calorie goal: {user_goals.get('calorie_goal')} cal/day" if user_goals and user_goals.get('calorie_goal') else ""}
{f"User's protein goal: {user_goals.get('protein_goal')}g/day" if user_goals and user_goals.get('protein_goal') else ""}

Return JSON with:
- "summary": One sentence nutritional summary
- "tips": Array of 1-2 helpful tips
- "warnings": Array of 0-1 warnings (only if needed)
- "pairings": Array of 1-2 suggested food pairings

Be concise and practical for busy students."""

            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a helpful campus nutrition advisor. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            ai_analysis = json.loads(response.choices[0].message.content)
            return {
                "health_score": health_score,
                "summary": ai_analysis.get("summary", f"{dish.get('name')} provides {calories} calories and {protein}g protein."),
                "tips": ai_analysis.get("tips", tips),
                "warnings": ai_analysis.get("warnings", warnings),
                "pairings": ai_analysis.get("pairings", []),
                "ai_powered": True
            }
        except Exception as e:
            print(f"AI dietary analysis error: {e}")
    
    # Fallback response
    return {
        "health_score": health_score,
        "summary": f"{dish.get('name', 'This dish')} provides {calories} calories with {protein}g of protein.",
        "tips": tips if tips else ["Enjoy as part of a balanced diet"],
        "warnings": warnings,
        "pairings": [],
        "ai_powered": False
    }


def get_daily_meal_plan_advice(
    meals: List[Dict[str, Any]],
    user_goals: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Analyze a day's worth of meals and provide advice.
    
    Args:
        meals: List of dishes consumed/planned for the day
        user_goals: User's dietary goals
    
    Returns:
        Daily summary and recommendations
    """
    # Calculate daily totals
    totals = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
    for meal in meals:
        totals["calories"] += meal.get("calories", 0) or 0
        totals["protein"] += meal.get("protein", 0) or 0
        totals["carbs"] += meal.get("carbs", 0) or 0
        totals["fat"] += meal.get("fat", 0) or 0
    
    # Default goals for college students
    calorie_goal = 2000
    protein_goal = 50
    
    if user_goals:
        calorie_goal = user_goals.get("calorie_goal", calorie_goal)
        protein_goal = user_goals.get("protein_goal", protein_goal)
    
    # Calculate remaining
    remaining = {
        "calories": calorie_goal - totals["calories"],
        "protein": protein_goal - totals["protein"]
    }
    
    recommendations = []
    
    if remaining["calories"] > 600:
        recommendations.append("You have room for a substantial dinner!")
    elif remaining["calories"] < 200:
        recommendations.append("Consider a light dinner or healthy snack")
    
    if remaining["protein"] > 20:
        recommendations.append(f"Try to get {remaining['protein']}g more protein today")
    elif remaining["protein"] <= 0:
        recommendations.append("Great job hitting your protein goal!")
    
    return {
        "totals": totals,
        "goals": {"calories": calorie_goal, "protein": protein_goal},
        "remaining": remaining,
        "meal_count": len(meals),
        "recommendations": recommendations,
        "on_track": remaining["calories"] >= 0 and remaining["calories"] <= 800
    }
