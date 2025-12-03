// Recommendations View - For You Tab

import SwiftUI

struct RecommendationsView: View {
    @State private var recommendations: [Recommendation] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var isPersonalized = false
    @State private var fallbackUsed = false
    @State private var usingDemoData = false
    
    // Demo recommendations for fallback
    private let demoRecommendations: [Recommendation] = [
        Recommendation(
            dish: Dish(dishId: 1, name: "Grilled Chicken Bowl", description: "Tender grilled chicken with quinoa and roasted vegetables", category: "Main", dietaryTags: ["high-protein", "gluten-free"], allergens: nil, nutrition: Nutrition(calories: 450, gProtein: 42, gCarbs: 35, gFat: 12, gFiber: 6, gSugar: 4, mgSodium: 520), ingredients: nil),
            score: 0.95, reason: "High protein, highly rated", avgRating: 4.8, reviewCount: 127
        ),
        Recommendation(
            dish: Dish(dishId: 4, name: "Grilled Salmon", description: "Atlantic salmon with lemon dill sauce", category: "Main", dietaryTags: ["omega-3", "high-protein", "gluten-free"], allergens: ["fish"], nutrition: Nutrition(calories: 420, gProtein: 44, gCarbs: 8, gFat: 24, gFiber: 1, gSugar: 2, mgSodium: 380), ingredients: nil),
            score: 0.92, reason: "Brain-boosting omega-3s", avgRating: 4.7, reviewCount: 89
        ),
        Recommendation(
            dish: Dish(dishId: 5, name: "Buddha Bowl", description: "Quinoa, roasted chickpeas, avocado, and tahini", category: "Main", dietaryTags: ["vegan", "gluten-free", "high-fiber"], allergens: ["sesame"], nutrition: Nutrition(calories: 520, gProtein: 18, gCarbs: 62, gFat: 24, gFiber: 14, gSugar: 6, mgSodium: 420), ingredients: nil),
            score: 0.90, reason: "Popular vegan choice", avgRating: 4.6, reviewCount: 156
        ),
        Recommendation(
            dish: Dish(dishId: 2, name: "Buffalo Wings", description: "Crispy wings with spicy buffalo sauce", category: "Appetizer", dietaryTags: ["spicy", "high-protein"], allergens: ["dairy"], nutrition: Nutrition(calories: 680, gProtein: 38, gCarbs: 15, gFat: 52, gFiber: 1, gSugar: 2, mgSodium: 1200), ingredients: nil),
            score: 0.88, reason: "🔥 Trending this week", avgRating: 4.5, reviewCount: 234
        ),
        Recommendation(
            dish: Dish(dishId: 3, name: "Korean BBQ Bowl", description: "Marinated beef with gochujang sauce and kimchi", category: "Main", dietaryTags: ["spicy", "high-protein"], allergens: ["soy", "sesame"], nutrition: Nutrition(calories: 620, gProtein: 35, gCarbs: 55, gFat: 28, gFiber: 4, gSugar: 12, mgSodium: 890), ingredients: nil),
            score: 0.87, reason: "Students love it!", avgRating: 4.7, reviewCount: 198
        ),
        Recommendation(
            dish: Dish(dishId: 10, name: "Garden Salad", description: "Fresh mixed greens with light vinaigrette", category: "Salad", dietaryTags: ["vegan", "low-calorie", "gluten-free"], allergens: nil, nutrition: Nutrition(calories: 180, gProtein: 4, gCarbs: 12, gFat: 8, gFiber: 4, gSugar: 4, mgSodium: 180), ingredients: nil),
            score: 0.85, reason: "Light & healthy", avgRating: 4.3, reviewCount: 67
        ),
        Recommendation(
            dish: Dish(dishId: 7, name: "Keto Plate", description: "Grilled steak, avocado, cheese, and greens", category: "Main", dietaryTags: ["keto", "low-carb", "high-protein"], allergens: ["dairy"], nutrition: Nutrition(calories: 650, gProtein: 45, gCarbs: 8, gFat: 52, gFiber: 4, gSugar: 2, mgSodium: 680), ingredients: nil),
            score: 0.84, reason: "Perfect for keto diet", avgRating: 4.4, reviewCount: 78
        ),
        Recommendation(
            dish: Dish(dishId: 8, name: "Tuna Poke Bowl", description: "Fresh ahi tuna with rice and seaweed", category: "Main", dietaryTags: ["omega-3", "high-protein"], allergens: ["fish", "soy", "sesame"], nutrition: Nutrition(calories: 480, gProtein: 36, gCarbs: 48, gFat: 16, gFiber: 3, gSugar: 8, mgSodium: 720), ingredients: nil),
            score: 0.83, reason: "Fresh & flavorful", avgRating: 4.6, reviewCount: 112
        ),
    ]
    
    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    VStack(spacing: 16) {
                        ProgressView()
                            .scaleEffect(1.2)
                        Text("Finding recommendations...")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                } else if let error = errorMessage {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundStyle(.orange)
                        Text(error)
                            .multilineTextAlignment(.center)
                        Button("Retry") {
                            Task { await loadRecommendations() }
                        }
                        .buttonStyle(.bordered)
                    }
                    .padding()
                } else if recommendations.isEmpty {
                    ContentUnavailableView(
                        "No Recommendations",
                        systemImage: "sparkles",
                        description: Text("Check back later for personalized picks")
                    )
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 16) {
                            // Status banner
                            HStack(spacing: 10) {
                                Image(systemName: isPersonalized ? "person.fill.checkmark" : (usingDemoData ? "sparkles" : "chart.bar.fill"))
                                    .font(.title3)
                                    .foregroundStyle(.purple)
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(isPersonalized ? "Personalized for you" : (usingDemoData ? "Top Picks" : (fallbackUsed ? "Popular picks" : "Top rated")))
                                        .font(.headline)
                                    Text(isPersonalized ? "Based on your preferences" : (usingDemoData ? "Curated recommendations" : "Loved by other students"))
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                
                                Spacer()
                            }
                            .padding()
                            .background(LinearGradient(colors: [.purple.opacity(0.1), .pink.opacity(0.1)], startPoint: .leading, endPoint: .trailing))
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .padding(.horizontal)
                            
                            // Recommendations list
                            LazyVStack(spacing: 12) {
                                ForEach(recommendations) { rec in
                                    NavigationLink(value: rec.dish) {
                                        RecommendationCard(recommendation: rec)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.horizontal)
                        }
                        .padding(.vertical)
                    }
                }
            }
            .navigationTitle("For You")
            .navigationDestination(for: Dish.self) { dish in
                DishDetailView(dish: dish)
            }
            .refreshable {
                await loadRecommendations()
            }
        }
        .task {
            await loadRecommendations()
        }
    }
    
    private func loadRecommendations() async {
        isLoading = true
        errorMessage = nil
        usingDemoData = false
        
        do {
            let response = try await APIService.shared.getRecommendations(limit: 15)
            recommendations = response.recommendations
            isPersonalized = response.isPersonalized
            fallbackUsed = response.fallbackUsed
        } catch {
            // Use demo data as fallback
            print("API Error: \(error.localizedDescription) - Using demo data")
            recommendations = demoRecommendations
            isPersonalized = false
            fallbackUsed = true
            usingDemoData = true
        }
        isLoading = false
    }
}

struct RecommendationCard: View {
    let recommendation: Recommendation
    
    var body: some View {
        HStack(spacing: 14) {
            // Food image with dish name for better icon matching
            FoodImageView(category: recommendation.dish.category ?? "General", size: 70, dishName: recommendation.dish.name)
            
            VStack(alignment: .leading, spacing: 6) {
                Text(recommendation.dish.name)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                
                // Reason badge
                HStack(spacing: 4) {
                    Image(systemName: "sparkle")
                        .font(.caption2)
                    Text(recommendation.reason)
                        .font(.caption)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.purple.opacity(0.1))
                .foregroundStyle(.purple)
                .clipShape(Capsule())
                
                HStack(spacing: 12) {
                    if let calories = recommendation.dish.calories {
                        HStack(spacing: 2) {
                            Image(systemName: "flame.fill")
                                .font(.caption2)
                                .foregroundStyle(.orange)
                            Text("\(calories) cal")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    
                    if let rating = recommendation.avgRating {
                        HStack(spacing: 2) {
                            Image(systemName: "star.fill")
                                .font(.caption2)
                                .foregroundStyle(.yellow)
                            Text(String(format: "%.1f", rating))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    
                    if let count = recommendation.reviewCount, count > 0 {
                        Text("(\(count))")
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                }
                
                // Dietary tags
                if let tags = recommendation.dish.dietaryTags?.filter({ $0 != "general" }), !tags.isEmpty {
                    HStack(spacing: 4) {
                        ForEach(tags.prefix(3), id: \.self) { tag in
                            DietaryTagView(tag: tag, size: .small)
                        }
                    }
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(14)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.06), radius: 8, y: 4)
    }
}

#Preview {
    RecommendationsView()
}
