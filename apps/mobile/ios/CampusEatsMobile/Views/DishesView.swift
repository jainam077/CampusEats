// Dishes View - Menu Browser

import SwiftUI

struct DishesView: View {
    @State private var dishes: [Dish] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var searchText = ""
    @State private var selectedFilters: Set<String> = []
    
    let dietaryFilters = ["vegan", "dairy", "eggs", "fish", "pork"]
    
    var filteredDishes: [Dish] {
        var result = dishes
        
        if !searchText.isEmpty {
            result = result.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
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
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

struct DishRow: View {
    let dish: Dish
    
    var body: some View {
        HStack(spacing: 14) {
            // Food image based on category
            FoodImageView(category: dish.category ?? "General", size: 65)
            
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
