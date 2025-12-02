// Dishes View - Menu Browser

import SwiftUI

struct DishesView: View {
    @EnvironmentObject var favoritesManager: FavoritesManager
    @State private var dishes: [Dish] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var searchText = ""
    @State private var selectedFilters: Set<String> = []
    
    let dietaryFilters = ["vegan", "dairy", "eggs", "fish", "pork"]
    
    // Demo dishes for fallback
    private let demoDishes: [Dish] = [
        Dish(dishId: 1, name: "Grilled Chicken Bowl", description: "Tender grilled chicken with quinoa and roasted vegetables", category: "Main", dietaryTags: ["high-protein", "gluten-free"], allergens: nil, nutrition: Nutrition(calories: 450, gProtein: 42, gCarbs: 35, gFat: 12, gFiber: 6, gSugar: 4, mgSodium: 520), ingredients: nil),
        Dish(dishId: 2, name: "Buffalo Wings", description: "Crispy wings with spicy buffalo sauce", category: "Appetizer", dietaryTags: ["spicy"], allergens: ["dairy"], nutrition: Nutrition(calories: 680, gProtein: 38, gCarbs: 15, gFat: 52, gFiber: 1, gSugar: 2, mgSodium: 1200), ingredients: nil),
        Dish(dishId: 3, name: "Buddha Bowl", description: "Quinoa, roasted chickpeas, avocado, and tahini", category: "Main", dietaryTags: ["vegan", "gluten-free"], allergens: ["sesame"], nutrition: Nutrition(calories: 520, gProtein: 18, gCarbs: 62, gFat: 24, gFiber: 14, gSugar: 6, mgSodium: 420), ingredients: nil),
        Dish(dishId: 4, name: "Pepperoni Pizza", description: "Classic pepperoni with mozzarella", category: "Pizza", dietaryTags: nil, allergens: ["dairy", "gluten"], nutrition: Nutrition(calories: 320, gProtein: 14, gCarbs: 36, gFat: 14, gFiber: 2, gSugar: 4, mgSodium: 780), ingredients: nil),
        Dish(dishId: 5, name: "Caesar Salad", description: "Crisp romaine, parmesan, croutons", category: "Salad", dietaryTags: ["vegetarian"], allergens: ["dairy", "gluten", "eggs"], nutrition: Nutrition(calories: 280, gProtein: 12, gCarbs: 18, gFat: 20, gFiber: 4, gSugar: 3, mgSodium: 480), ingredients: nil),
        Dish(dishId: 6, name: "Grilled Salmon", description: "Atlantic salmon with lemon dill sauce", category: "Main", dietaryTags: ["fish", "high-protein", "gluten-free"], allergens: ["fish"], nutrition: Nutrition(calories: 420, gProtein: 44, gCarbs: 8, gFat: 24, gFiber: 1, gSugar: 2, mgSodium: 380), ingredients: nil),
        Dish(dishId: 7, name: "Korean BBQ Bowl", description: "Marinated beef with gochujang sauce and kimchi", category: "Main", dietaryTags: ["spicy"], allergens: ["soy", "sesame"], nutrition: Nutrition(calories: 620, gProtein: 35, gCarbs: 55, gFat: 28, gFiber: 4, gSugar: 12, mgSodium: 890), ingredients: nil),
        Dish(dishId: 8, name: "Veggie Wrap", description: "Hummus, falafel, fresh vegetables in a spinach wrap", category: "Sandwich", dietaryTags: ["vegan"], allergens: ["gluten", "sesame"], nutrition: Nutrition(calories: 420, gProtein: 14, gCarbs: 52, gFat: 18, gFiber: 8, gSugar: 6, mgSodium: 680), ingredients: nil),
    ]
    
    var filteredDishes: [Dish] {
        var result = dishes
        
        if !searchText.isEmpty {
            result = result.filter { $0.name.localizedCaseInsensitiveContains(searchText) ||
                ($0.description?.localizedCaseInsensitiveContains(searchText) ?? false) }
        }
        
        if !selectedFilters.isEmpty {
            result = result.filter { dish in
                guard let tags = dish.dietaryTags else { return false }
                return selectedFilters.allSatisfy { tags.contains($0) }
            }
        }
        
        return result
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Filter chips
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(dietaryFilters, id: \.self) { filter in
                            FilterChip(
                                title: filter.capitalized,
                                icon: DietaryTagView.iconFor(tag: filter),
                                isSelected: selectedFilters.contains(filter)
                            ) {
                                withAnimation(.spring(response: 0.3)) {
                                    if selectedFilters.contains(filter) {
                                        selectedFilters.remove(filter)
                                    } else {
                                        selectedFilters.insert(filter)
                                    }
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 10)
                }
                .background(Color(.systemGray6))
                
                Group {
                    if isLoading {
                        VStack(spacing: 16) {
                            ProgressView()
                                .scaleEffect(1.2)
                            Text("Loading menu...")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else if let error = errorMessage {
                        VStack(spacing: 16) {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.largeTitle)
                                .foregroundStyle(.orange)
                            Text(error)
                                .multilineTextAlignment(.center)
                            Button("Retry") {
                                Task { await loadDishes() }
                            }
                            .buttonStyle(.bordered)
                        }
                        .padding()
                    } else if filteredDishes.isEmpty {
                        if searchText.isEmpty && selectedFilters.isEmpty {
                            ContentUnavailableView(
                                "No Dishes",
                                systemImage: "fork.knife",
                                description: Text("No dishes found in the database")
                            )
                        } else {
                            ContentUnavailableView.search(text: searchText)
                        }
                    } else {
                        ScrollView {
                            LazyVStack(spacing: 12) {
                                ForEach(filteredDishes) { dish in
                                    NavigationLink(value: dish) {
                                        DishRow(dish: dish)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding()
                        }
                    }
                }
            }
            .navigationTitle("Menu")
            .searchable(text: $searchText, prompt: "Search dishes")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    VoiceSearchButton(searchText: $searchText)
                }
            }
            .navigationDestination(for: Dish.self) { dish in
                DishDetailView(dish: dish)
            }
        }
        .task {
            await loadDishes()
        }
    }
    
    private func loadDishes() async {
        isLoading = true
        errorMessage = nil
        do {
            dishes = try await APIService.shared.getDishes(limit: 200)
        } catch {
            // Use demo data as fallback
            dishes = demoDishes
            errorMessage = nil
        }
        isLoading = false
    }
}

struct DishRow: View {
    let dish: Dish
    @EnvironmentObject var favoritesManager: FavoritesManager
    
    var body: some View {
        HStack(spacing: 14) {
            // Food image based on category and name
            FoodImageView(category: dish.category ?? "General", size: 65, dishName: dish.name)
            
            VStack(alignment: .leading, spacing: 6) {
                Text(dish.name)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                
                HStack(spacing: 10) {
                    if let category = dish.category {
                        Text(category)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    
                    if let calories = dish.calories {
                        HStack(spacing: 2) {
                            Image(systemName: "flame.fill")
                                .font(.caption2)
                                .foregroundStyle(.orange)
                            Text("\(calories) cal")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                
                // Dietary tags - show proper icons
                if let tags = dish.dietaryTags?.filter({ $0 != "general" }), !tags.isEmpty {
                    HStack(spacing: 4) {
                        ForEach(tags.prefix(4), id: \.self) { tag in
                            DietaryTagView(tag: tag, size: .small)
                        }
                        if tags.count > 4 {
                            Text("+\(tags.count - 4)")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            
            Spacer()
            
            // Favorite button
            Button {
                withAnimation(.spring(response: 0.3)) {
                    favoritesManager.toggleFavorite(dish.dishId)
                }
            } label: {
                Image(systemName: favoritesManager.isFavorite(dish.dishId) ? "heart.fill" : "heart")
                    .foregroundColor(favoritesManager.isFavorite(dish.dishId) ? .red : .gray)
                    .font(.title3)
            }
            .buttonStyle(.plain)
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(14)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.06), radius: 6, y: 3)
    }
}

#Preview {
    DishesView()
}
