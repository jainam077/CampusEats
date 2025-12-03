// AI Chat Assistant View
// Campus Eats iOS

import SwiftUI

struct ChatMessage: Identifiable {
    let id = UUID()
    let content: String
    let isUser: Bool
    let dishes: [Dish]?
    let timestamp: Date = Date()
}

struct AIChatView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var messages: [ChatMessage] = []
    @State private var inputText = ""
    @State private var isTyping = false
    @State private var allDishes: [Dish] = []
    
    // Demo dishes for recommendations
    private let demoDishes: [Dish] = [
        // Low calorie options (under 400)
        Dish(dishId: 10, name: "Garden Salad", description: "Fresh mixed greens with light vinaigrette", category: "Salad", dietaryTags: ["vegan", "low-calorie", "gluten-free"], allergens: nil, nutrition: Nutrition(calories: 180, gProtein: 4, gCarbs: 12, gFat: 8, gFiber: 4, gSugar: 4, mgSodium: 180), ingredients: nil),
        Dish(dishId: 11, name: "Grilled Chicken Breast", description: "Lean grilled chicken with steamed vegetables", category: "Main", dietaryTags: ["high-protein", "low-calorie", "gluten-free"], allergens: nil, nutrition: Nutrition(calories: 280, gProtein: 38, gCarbs: 8, gFat: 10, gFiber: 3, gSugar: 2, mgSodium: 320), ingredients: nil),
        Dish(dishId: 12, name: "Veggie Soup", description: "Hearty vegetable soup with herbs", category: "Soup", dietaryTags: ["vegan", "low-calorie"], allergens: nil, nutrition: Nutrition(calories: 150, gProtein: 5, gCarbs: 22, gFat: 4, gFiber: 6, gSugar: 6, mgSodium: 480), ingredients: nil),
        Dish(dishId: 13, name: "Shrimp Cocktail", description: "Chilled shrimp with cocktail sauce", category: "Appetizer", dietaryTags: ["high-protein", "low-calorie", "gluten-free"], allergens: ["shellfish"], nutrition: Nutrition(calories: 220, gProtein: 28, gCarbs: 8, gFat: 4, gFiber: 0, gSugar: 4, mgSodium: 520), ingredients: nil),
        Dish(dishId: 14, name: "Greek Yogurt Parfait", description: "Greek yogurt with berries and granola", category: "Breakfast", dietaryTags: ["high-protein", "low-calorie"], allergens: ["dairy", "gluten"], nutrition: Nutrition(calories: 320, gProtein: 18, gCarbs: 42, gFat: 8, gFiber: 4, gSugar: 24, mgSodium: 120), ingredients: nil),
        Dish(dishId: 15, name: "Turkey Lettuce Wraps", description: "Lean turkey in crisp lettuce cups", category: "Main", dietaryTags: ["high-protein", "low-calorie", "low-carb", "gluten-free"], allergens: nil, nutrition: Nutrition(calories: 240, gProtein: 32, gCarbs: 6, gFat: 10, gFiber: 2, gSugar: 2, mgSodium: 380), ingredients: nil),
        
        // Medium calorie options (400-500)
        Dish(dishId: 1, name: "Grilled Chicken Bowl", description: "Tender grilled chicken with quinoa and roasted vegetables", category: "Main", dietaryTags: ["high-protein", "gluten-free"], allergens: nil, nutrition: Nutrition(calories: 450, gProtein: 42, gCarbs: 35, gFat: 12, gFiber: 6, gSugar: 4, mgSodium: 520), ingredients: nil),
        Dish(dishId: 4, name: "Grilled Salmon", description: "Atlantic salmon with lemon dill sauce", category: "Main", dietaryTags: ["omega-3", "high-protein", "gluten-free"], allergens: ["fish"], nutrition: Nutrition(calories: 420, gProtein: 44, gCarbs: 8, gFat: 24, gFiber: 1, gSugar: 2, mgSodium: 380), ingredients: nil),
        Dish(dishId: 8, name: "Tuna Poke Bowl", description: "Fresh ahi tuna with rice and seaweed", category: "Main", dietaryTags: ["omega-3", "high-protein"], allergens: ["fish", "soy", "sesame"], nutrition: Nutrition(calories: 480, gProtein: 36, gCarbs: 48, gFat: 16, gFiber: 3, gSugar: 8, mgSodium: 720), ingredients: nil),
        
        // Higher calorie options (500+)
        Dish(dishId: 2, name: "Buffalo Wings", description: "Crispy wings with spicy buffalo sauce", category: "Appetizer", dietaryTags: ["spicy", "high-protein"], allergens: ["dairy"], nutrition: Nutrition(calories: 680, gProtein: 38, gCarbs: 15, gFat: 52, gFiber: 1, gSugar: 2, mgSodium: 1200), ingredients: nil),
        Dish(dishId: 3, name: "Korean BBQ Bowl", description: "Marinated beef with gochujang sauce and kimchi", category: "Main", dietaryTags: ["spicy", "high-protein"], allergens: ["soy", "sesame"], nutrition: Nutrition(calories: 620, gProtein: 35, gCarbs: 55, gFat: 28, gFiber: 4, gSugar: 12, mgSodium: 890), ingredients: nil),
        Dish(dishId: 5, name: "Buddha Bowl", description: "Quinoa, roasted chickpeas, avocado, and tahini", category: "Main", dietaryTags: ["vegan", "gluten-free", "high-fiber"], allergens: ["sesame"], nutrition: Nutrition(calories: 520, gProtein: 18, gCarbs: 62, gFat: 24, gFiber: 14, gSugar: 6, mgSodium: 420), ingredients: nil),
        Dish(dishId: 6, name: "Bodybuilder Breakfast", description: "6 eggs, turkey bacon, oatmeal with protein", category: "Breakfast", dietaryTags: ["high-protein", "bodybuilder"], allergens: ["eggs", "dairy"], nutrition: Nutrition(calories: 780, gProtein: 52, gCarbs: 45, gFat: 42, gFiber: 8, gSugar: 8, mgSodium: 920), ingredients: nil),
        Dish(dishId: 7, name: "Keto Plate", description: "Grilled steak, avocado, cheese, and greens", category: "Main", dietaryTags: ["keto", "low-carb", "high-protein"], allergens: ["dairy"], nutrition: Nutrition(calories: 650, gProtein: 45, gCarbs: 8, gFat: 52, gFiber: 4, gSugar: 2, mgSodium: 680), ingredients: nil),
    ]
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Chat messages
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            // Welcome message
                            if messages.isEmpty {
                                WelcomeCard()
                                    .padding(.top, 20)
                            }
                            
                            ForEach(messages) { message in
                                ChatBubble(message: message)
                            }
                            
                            if isTyping {
                                TypingIndicator()
                            }
                        }
                        .padding()
                    }
                    .onChange(of: messages.count) { _, _ in
                        if let last = messages.last {
                            withAnimation {
                                proxy.scrollTo(last.id, anchor: .bottom)
                            }
                        }
                    }
                }
                
                // Quick suggestions
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        QuickSuggestionButton(text: "🔥 Something spicy") {
                            sendMessage("I want something spicy")
                        }
                        QuickSuggestionButton(text: "💪 High protein") {
                            sendMessage("High protein meals for muscle building")
                        }
                        QuickSuggestionButton(text: "🐟 Omega-3 rich") {
                            sendMessage("Foods high in omega-3")
                        }
                        QuickSuggestionButton(text: "🥗 Vegan options") {
                            sendMessage("Show me vegan dishes")
                        }
                        QuickSuggestionButton(text: "🥩 Keto friendly") {
                            sendMessage("Low carb keto options")
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }
                .background(Color(.systemGray6))
                
                // Input field
                HStack(spacing: 12) {
                    TextField("Ask about food...", text: $inputText)
                        .textFieldStyle(.plain)
                        .padding(12)
                        .background(Color(.systemGray6))
                        .cornerRadius(20)
                    
                    Button {
                        sendMessage(inputText)
                        inputText = ""
                    } label: {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 36))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: inputText.isEmpty ? [.gray, .gray] : [.orange, .pink],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                    }
                    .disabled(inputText.isEmpty)
                }
                .padding()
                .background(.ultraThinMaterial)
            }
            .navigationTitle("AI Assistant")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func sendMessage(_ text: String) {
        guard !text.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        
        // Add user message
        messages.append(ChatMessage(content: text, isUser: true, dishes: nil))
        
        // Show typing indicator
        isTyping = true
        
        // Process and respond
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            isTyping = false
            let response = generateResponse(for: text)
            messages.append(response)
        }
    }
    
    private func generateResponse(for query: String) -> ChatMessage {
        let lowercased = query.lowercased()
        
        // Calorie-based filtering (check first - highest priority)
        if let calorieMatch = extractCalorieLimit(from: lowercased) {
            let calorieDishes = demoDishes.filter { dish in
                (dish.nutrition?.calories ?? 9999) <= Double(calorieMatch)
            }.sorted { ($0.nutrition?.calories ?? 0) < ($1.nutrition?.calories ?? 0) }
            
            if calorieDishes.isEmpty {
                return ChatMessage(
                    content: "😅 I couldn't find any dishes under \(calorieMatch) calories. The lowest I have is \(Int(demoDishes.compactMap { $0.nutrition?.calories }.min() ?? 0)) cal.",
                    isUser: false,
                    dishes: Array(demoDishes.sorted { ($0.nutrition?.calories ?? 0) < ($1.nutrition?.calories ?? 0) }.prefix(3))
                )
            }
            
            return ChatMessage(
                content: "🎯 Found \(calorieDishes.count) dishes under \(calorieMatch) calories! Here are your options:",
                isUser: false,
                dishes: calorieDishes
            )
        }
        
        // Spicy food detection
        if lowercased.contains("spicy") || lowercased.contains("hot") || lowercased.contains("heat") {
            let spicyDishes = demoDishes.filter { dish in
                dish.dietaryTags?.contains(where: { $0.lowercased().contains("spicy") }) ?? false
            }
            return ChatMessage(
                content: "🔥 I found some spicy dishes that will bring the heat! Here are my top picks:",
                isUser: false,
                dishes: spicyDishes.isEmpty ? nil : spicyDishes
            )
        }
        
        // Omega-3 / Fish detection
        if lowercased.contains("omega") || lowercased.contains("fish") || lowercased.contains("salmon") || lowercased.contains("tuna") {
            let fishDishes = demoDishes.filter { dish in
                dish.dietaryTags?.contains(where: { $0.lowercased().contains("omega") }) ?? false ||
                dish.name.lowercased().contains("salmon") ||
                dish.name.lowercased().contains("tuna") ||
                dish.name.lowercased().contains("fish")
            }
            return ChatMessage(
                content: "🐟 Great choice for brain health! Here are omega-3 rich options:",
                isUser: false,
                dishes: fishDishes.isEmpty ? nil : fishDishes
            )
        }
        
        // High protein / bodybuilder detection
        if lowercased.contains("protein") || lowercased.contains("muscle") || lowercased.contains("bodybuilder") || lowercased.contains("bulk") || lowercased.contains("gains") {
            let proteinDishes = demoDishes.filter { dish in
                (dish.nutrition?.gProtein ?? 0) >= 35 ||
                dish.dietaryTags?.contains(where: { $0.lowercased().contains("protein") || $0.lowercased().contains("bodybuilder") }) ?? false
            }.sorted { ($0.nutrition?.gProtein ?? 0) > ($1.nutrition?.gProtein ?? 0) }
            return ChatMessage(
                content: "💪 Time to fuel those gains! Here are high-protein options (25g+ protein):",
                isUser: false,
                dishes: proteinDishes.isEmpty ? nil : proteinDishes
            )
        }
        
        // Keto / Low carb detection
        if lowercased.contains("keto") || lowercased.contains("low carb") || lowercased.contains("low-carb") || lowercased.contains("no carb") {
            let ketoDishes = demoDishes.filter { dish in
                (dish.nutrition?.gCarbs ?? 100) < 20 ||
                dish.dietaryTags?.contains(where: { $0.lowercased().contains("keto") || $0.lowercased().contains("low-carb") }) ?? false
            }
            return ChatMessage(
                content: "🥩 Staying in ketosis? Here are low-carb options under 20g carbs:",
                isUser: false,
                dishes: ketoDishes.isEmpty ? nil : ketoDishes
            )
        }
        
        // Vegan detection
        if lowercased.contains("vegan") || lowercased.contains("plant-based") || lowercased.contains("plant based") {
            let veganDishes = demoDishes.filter { dish in
                dish.dietaryTags?.contains(where: { $0.lowercased().contains("vegan") }) ?? false
            }
            return ChatMessage(
                content: "🌱 Here are delicious vegan options for you:",
                isUser: false,
                dishes: veganDishes.isEmpty ? nil : veganDishes
            )
        }
        
        // Default response with top recommendations
        return ChatMessage(
            content: "Here are some great dishes I'd recommend based on ratings and nutrition:",
            isUser: false,
            dishes: Array(demoDishes.prefix(4))
        )
    }
    
    // Extract calorie limit from query like "under 400 calories" or "less than 500 cal"
    private func extractCalorieLimit(from query: String) -> Int? {
        let patterns = [
            "under (\\d+)",
            "below (\\d+)",
            "less than (\\d+)",
            "fewer than (\\d+)",
            "(\\d+) calories or less",
            "(\\d+) cal or less",
            "max (\\d+)",
            "maximum (\\d+)"
        ]
        
        for pattern in patterns {
            if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive),
               let match = regex.firstMatch(in: query, options: [], range: NSRange(query.startIndex..., in: query)),
               let range = Range(match.range(at: 1), in: query) {
                return Int(query[range])
            }
        }
        
        return nil
    }
}

// MARK: - Components

struct WelcomeCard: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "sparkles")
                .font(.system(size: 50))
                .foregroundStyle(
                    LinearGradient(colors: [.orange, .pink], startPoint: .topLeading, endPoint: .bottomTrailing)
                )
            
            Text("Hi! I'm your AI Food Assistant")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("Ask me about meals, nutrition, dietary preferences, or what's trending on campus!")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            VStack(alignment: .leading, spacing: 8) {
                Label("\"What's good for protein?\"", systemImage: "quote.bubble")
                Label("\"I want something spicy\"", systemImage: "quote.bubble")
                Label("\"Show me vegan options\"", systemImage: "quote.bubble")
            }
            .font(.caption)
            .foregroundColor(.secondary)
        }
        .padding(24)
        .background(Color(.systemGray6))
        .cornerRadius(20)
    }
}

struct ChatBubble: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if message.isUser { Spacer() }
            
            VStack(alignment: message.isUser ? .trailing : .leading, spacing: 8) {
                Text(message.content)
                    .padding(12)
                    .background(message.isUser ? Color.orange : Color(.systemGray5))
                    .foregroundColor(message.isUser ? .white : .primary)
                    .cornerRadius(16)
                
                // Show recommended dishes
                if let dishes = message.dishes {
                    VStack(spacing: 8) {
                        ForEach(dishes, id: \.dishId) { dish in
                            DishRecommendationCard(dish: dish)
                        }
                    }
                }
            }
            
            if !message.isUser { Spacer() }
        }
    }
}

struct DishRecommendationCard: View {
    let dish: Dish
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(dish.name)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                    if let description = dish.description {
                        Text(description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                }
                
                Spacer()
                
                if let calories = dish.calories {
                    VStack {
                        Text("\(calories)")
                            .font(.headline)
                            .foregroundColor(.orange)
                        Text("cal")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            // Nutrition badges
            HStack(spacing: 8) {
                if let protein = dish.protein {
                    NutrientBadge(value: protein, unit: "g", label: "protein", color: .blue)
                }
                if let carbs = dish.carbs {
                    NutrientBadge(value: carbs, unit: "g", label: "carbs", color: .green)
                }
                if let fat = dish.fat {
                    NutrientBadge(value: fat, unit: "g", label: "fat", color: .purple)
                }
            }
            
            // Tags
            if let tags = dish.dietaryTags, !tags.isEmpty {
                HStack {
                    ForEach(tags.prefix(3), id: \.self) { tag in
                        Text(tag)
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.orange.opacity(0.2))
                            .foregroundColor(.orange)
                            .cornerRadius(4)
                    }
                }
            }
        }
        .padding(12)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

struct NutrientBadge: View {
    let value: Int
    let unit: String
    let label: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 2) {
            Text("\(value)\(unit)")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(color)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 3)
        .background(color.opacity(0.1))
        .cornerRadius(6)
    }
}

struct QuickSuggestionButton: View {
    let text: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(text)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
        }
        .buttonStyle(.plain)
    }
}

struct TypingIndicator: View {
    @State private var dotOffset: CGFloat = 0
    
    var body: some View {
        HStack {
            HStack(spacing: 4) {
                ForEach(0..<3, id: \.self) { i in
                    Circle()
                        .fill(Color.gray)
                        .frame(width: 8, height: 8)
                        .offset(y: i == Int(dotOffset) ? -5 : 0)
                }
            }
            .padding(12)
            .background(Color(.systemGray5))
            .cornerRadius(16)
            
            Spacer()
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.4).repeatForever()) {
                dotOffset = 2
            }
        }
    }
}

#Preview {
    AIChatView()
}
