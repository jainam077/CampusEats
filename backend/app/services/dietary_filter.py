"""Dietary filtering utilities for dish recommendations."""

from typing import List, Dict, Any
import re


# Dietary tag mappings
DIETARY_KEYWORDS = {
    "vegetarian": ["vegetarian", "veggie", "meatless", "no meat", "plant-based", "plant based"],
    "vegan": ["vegan", "plant-based", "plant based"],
    "gluten-free": ["gluten-free", "gluten free", "gf", "no gluten", "celiac"],
    "halal": ["halal"],
    "kosher": ["kosher"],
    "dairy-free": ["dairy-free", "dairy free", "no dairy", "lactose-free", "vegan"],
    "nut-free": ["nut-free", "nut free", "no nuts", "peanut-free"],
}

# Vegan/vegetarian prefixes that negate meat ingredients
VEGAN_VEGGIE_PREFIXES = [
    "vegan", "veggie", "vegetarian", "meatless", "plant-based", "plant based",
    "impossible", "beyond", "gardein", "tofurky", "morningstar", "boca",
    "lightlife", "field roast", "quorn", "soy", "tofu", "seitan", "tempeh",
    "faux", "mock", "fauxtein", "meatfree", "meat-free", "turkey"  # turkey bacon isn't pork!
]

# Words that when preceding meat terms make them NOT meat
MEAT_NEGATING_MODIFIERS = [
    "vegan", "veggie", "vegetarian", "plant", "impossible", "beyond", 
    "meatless", "soy", "tofu", "seitan", "mock", "faux", "turkey",  # turkey negates pork
    "chicken",  # chicken bacon/sausage isn't pork
]

# Common meat ingredients - but need context checking
MEAT_TERMS = {
    "pork": ["pork", "ham", "prosciutto"],
    "bacon": ["bacon"],  # Could be turkey bacon, vegan bacon
    "sausage": ["sausage", "bratwurst", "kielbasa"],  # Could be vegan/turkey
    "burger": ["burger", "patty"],  # Could be veggie burger
    "chicken": ["chicken"],
    "beef": ["beef", "steak", "brisket"],
    "fish": ["fish", "salmon", "tuna", "cod", "tilapia"],
    "seafood": ["shrimp", "crab", "lobster", "scallop", "clam", "mussel", "oyster"],
    "other_meat": ["lamb", "duck", "turkey", "pepperoni", "anchovy", "meat"],
}

# Always non-vegetarian (no vegan version exists commonly)
ALWAYS_MEAT = [
    "prosciutto", "anchovy", "anchovies", "fish", "salmon", "tuna", "cod",
    "tilapia", "shrimp", "crab", "lobster", "scallop", "clam", "mussel", 
    "oyster", "lamb", "duck", "brisket"
]

# Common non-vegan ingredients  
NON_VEGAN_INGREDIENTS = [
    "cheese", "milk", "cream", "butter", "egg", "eggs", "yogurt", "honey",
    "whey", "casein", "gelatin", "mayo", "mayonnaise", "ranch", "parmesan",
    "mozzarella", "cheddar", "feta", "ricotta", "sour cream", "ice cream"
]

# Common gluten ingredients
GLUTEN_INGREDIENTS = [
    "wheat", "bread", "flour", "pasta", "noodle", "tortilla", "pita",
    "croissant", "bagel", "bun", "roll", "crouton", "breaded", "panko",
    "couscous", "barley", "rye", "seitan"
]


def _has_negating_prefix(text: str, meat_term: str) -> bool:
    """
    Check if a meat term is preceded by a negating modifier.
    e.g., "turkey bacon" - turkey negates pork classification
    e.g., "vegan sausage" - vegan negates meat classification
    """
    text_lower = text.lower()
    
    # Find all occurrences of the meat term
    pattern = r'\b(\w+[\s-]*)?' + re.escape(meat_term) + r'\b'
    matches = re.finditer(pattern, text_lower)
    
    for match in matches:
        # Get context around the match (10 words before)
        start = max(0, match.start() - 50)
        context_before = text_lower[start:match.start()]
        
        # Check if any negating modifier appears before the meat term
        for modifier in MEAT_NEGATING_MODIFIERS:
            if modifier in context_before:
                return True
            # Also check compound words like "veggie-burger"
            if f"{modifier} {meat_term}" in text_lower or f"{modifier}-{meat_term}" in text_lower:
                return True
    
    return False


def _contains_real_meat(text: str) -> bool:
    """
    Check if text contains actual meat (not vegan/veggie alternatives).
    """
    text_lower = text.lower()
    
    # Check for always-meat ingredients first
    for meat in ALWAYS_MEAT:
        if meat in text_lower:
            return True
    
    # Check contextual meat terms
    contextual_meats = ["bacon", "sausage", "burger", "patty", "chicken", "beef", "pork", "ham", "turkey", "meat"]
    
    for meat in contextual_meats:
        if meat in text_lower:
            # Check if it's negated by a vegan/veggie prefix
            if not _has_negating_prefix(text_lower, meat):
                # Special case: "turkey bacon" - bacon is negated, but turkey is still meat
                if meat == "turkey":
                    # Only count turkey as meat if it's the main protein, not as modifier
                    if "turkey bacon" in text_lower or "turkey sausage" in text_lower:
                        continue  # Skip - turkey is just a modifier here
                return True
    
    return False


def _contains_non_vegan(text: str) -> bool:
    """Check if text contains non-vegan ingredients."""
    text_lower = text.lower()
    
    # First check if explicitly vegan
    if any(kw in text_lower for kw in ["vegan", "plant-based", "plant based", "dairy-free"]):
        # Explicit vegan marking - trust it
        return False
    
    # Check for meat
    if _contains_real_meat(text_lower):
        return True
    
    # Check for dairy/eggs
    for ingredient in NON_VEGAN_INGREDIENTS:
        if ingredient in text_lower:
            return True
    
    return False


def filter_dishes_by_dietary(dishes: List[Dict[Any, Any]], dietary_filters: List[str]) -> List[Dict[Any, Any]]:
    """
    Filter dishes based on dietary preferences.
    
    Args:
        dishes: List of dish dictionaries
        dietary_filters: List of dietary preferences (vegetarian, vegan, gluten-free, etc.)
    
    Returns:
        Filtered list of dishes matching dietary requirements
    """
    if not dietary_filters:
        return dishes
    
    filtered = []
    
    for dish in dishes:
        dish_name = (dish.get("name") or "").lower()
        dish_desc = (dish.get("description") or "").lower()
        dish_text = f"{dish_name} {dish_desc}"
        
        # Check dietary tags on the dish itself
        dish_dietary = dish.get("dietary_tags") or []
        if isinstance(dish_dietary, str):
            dish_dietary = [d.strip().lower() for d in dish_dietary.split(",")]
        else:
            dish_dietary = [d.lower() for d in dish_dietary]
        
        matches_all = True
        
        for filter_type in dietary_filters:
            filter_type = filter_type.lower().strip()
            
            # Check if dish has the dietary tag
            if filter_type in dish_dietary:
                continue
            
            # Check keywords in name/description
            keywords = DIETARY_KEYWORDS.get(filter_type, [])
            has_keyword = any(kw in dish_text for kw in keywords)
            
            if has_keyword:
                continue
            
            # For vegetarian/vegan, use smart detection that handles modifiers
            if filter_type == "vegetarian":
                if _contains_real_meat(dish_text):
                    matches_all = False
                    break
            elif filter_type == "vegan":
                if _contains_non_vegan(dish_text):
                    matches_all = False
                    break
            elif filter_type == "gluten-free":
                has_gluten = any(ing in dish_text for ing in GLUTEN_INGREDIENTS)
                if has_gluten:
                    matches_all = False
                    break
            else:
                # For other filters without explicit tags, include the dish
                # (better to show than hide when uncertain)
                continue
        
        if matches_all:
            filtered.append(dish)
    
    return filtered


def get_dietary_matches(dish: Dict[Any, Any], dietary_filters: List[str]) -> List[str]:
    """
    Get list of dietary preferences that a dish matches.
    
    Args:
        dish: Dish dictionary
        dietary_filters: List of dietary preferences to check
    
    Returns:
        List of matched dietary preferences
    """
    matches = []
    
    dish_name = (dish.get("name") or "").lower()
    dish_desc = (dish.get("description") or "").lower()
    dish_text = f"{dish_name} {dish_desc}"
    
    # Check dietary tags on the dish
    dish_dietary = dish.get("dietary_tags") or []
    if isinstance(dish_dietary, str):
        dish_dietary = [d.strip().lower() for d in dish_dietary.split(",")]
    else:
        dish_dietary = [d.lower() for d in dish_dietary]
    
    for filter_type in dietary_filters:
        filter_type = filter_type.lower().strip()
        
        # Direct tag match
        if filter_type in dish_dietary:
            matches.append(filter_type)
            continue
        
        # Keyword match
        keywords = DIETARY_KEYWORDS.get(filter_type, [])
        if any(kw in dish_text for kw in keywords):
            matches.append(filter_type)
            continue
        
        # Exclusion-based match for vegetarian/vegan using smart detection
        if filter_type == "vegetarian":
            if not _contains_real_meat(dish_text):
                matches.append(filter_type)
        elif filter_type == "vegan":
            if not _contains_non_vegan(dish_text):
                matches.append(filter_type)
        elif filter_type == "gluten-free":
            if not any(ing in dish_text for ing in GLUTEN_INGREDIENTS):
                matches.append(filter_type)
    
    return matches
