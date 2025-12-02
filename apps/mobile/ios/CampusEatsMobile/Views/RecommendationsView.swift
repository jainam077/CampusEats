// Recommendations View - For You Tab

import SwiftUI

struct RecommendationsView: View {
    @State private var recommendations: [Recommendation] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var isPersonalized = false
    @State private var fallbackUsed = false
    
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
                                Image(systemName: isPersonalized ? "person.fill.checkmark" : "chart.bar.fill")
                                    .font(.title3)
                                    .foregroundStyle(.purple)
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(isPersonalized ? "Personalized for you" : (fallbackUsed ? "Popular picks" : "Top rated"))
                                        .font(.headline)
                                    Text(isPersonalized ? "Based on your preferences" : "Loved by other students")
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
        do {
            let response = try await APIService.shared.getRecommendations(limit: 15)
            recommendations = response.recommendations
            isPersonalized = response.isPersonalized
            fallbackUsed = response.fallbackUsed
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

struct RecommendationCard: View {
    let recommendation: Recommendation
    
    var body: some View {
        HStack(spacing: 14) {
            // Food image
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(LinearGradient(colors: [.purple, .pink], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 70, height: 70)
                
                FoodImageView(category: recommendation.dish.category ?? "General", size: 70)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            
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
