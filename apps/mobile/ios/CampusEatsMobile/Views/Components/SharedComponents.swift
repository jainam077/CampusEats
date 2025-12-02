// Shared UI Components

import SwiftUI

// MARK: - Filter Chip
struct FilterChip: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Text(icon)
                    .font(.caption)
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isSelected ? Color.orange : Color(.systemBackground))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(20)
            .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Dietary Tag View
struct DietaryTagView: View {
    let tag: String
    let size: TagSize
    
    enum TagSize {
        case small, medium, large
        
        var fontSize: Font {
            switch self {
            case .small: return .caption2
            case .medium: return .caption
            case .large: return .subheadline
            }
        }
        
        var padding: EdgeInsets {
            switch self {
            case .small: return EdgeInsets(top: 2, leading: 6, bottom: 2, trailing: 6)
            case .medium: return EdgeInsets(top: 4, leading: 8, bottom: 4, trailing: 8)
            case .large: return EdgeInsets(top: 6, leading: 10, bottom: 6, trailing: 10)
            }
        }
    }
    
    static func iconFor(tag: String) -> String {
        switch tag.lowercased() {
        case "vegan": return "🌱"
        case "vegetarian": return "🥬"
        case "gluten-free", "gluten free": return "🌾"
        case "dairy", "dairy-free": return "🥛"
        case "eggs": return "🥚"
        case "fish", "seafood": return "🐟"
        case "pork": return "🐷"
        case "nuts", "nut-free": return "🥜"
        case "spicy": return "🌶️"
        case "high-protein", "protein": return "💪"
        case "low-carb", "keto": return "🥩"
        case "halal": return "☪️"
        case "kosher": return "✡️"
        case "organic": return "🌿"
        default: return "🍽️"
        }
    }
    
    static func colorFor(tag: String) -> Color {
        switch tag.lowercased() {
        case "vegan", "vegetarian": return .green
        case "gluten-free", "gluten free": return .orange
        case "dairy", "dairy-free": return .blue
        case "spicy": return .red
        case "high-protein", "protein": return .purple
        case "low-carb", "keto": return .pink
        case "fish", "seafood": return .cyan
        default: return .gray
        }
    }
    
    var body: some View {
        HStack(spacing: 2) {
            Text(Self.iconFor(tag: tag))
            if size != .small {
                Text(tag.capitalized)
            }
        }
        .font(size.fontSize)
        .padding(size.padding)
        .background(Self.colorFor(tag: tag).opacity(0.15))
        .foregroundColor(Self.colorFor(tag: tag))
        .cornerRadius(size == .small ? 4 : 8)
    }
}

// MARK: - Food Image View
struct FoodImageView: View {
    let category: String
    let size: CGFloat
    var dishName: String? = nil
    
    // Match by dish name first, then category
    var foodIcon: (symbol: String, color: Color) {
        let name = (dishName ?? "").lowercased()
        let cat = category.lowercased()
        
        // Match by dish name keywords
        if name.contains("wing") || name.contains("buffalo") {
            return ("flame.fill", .orange)
        }
        if name.contains("chicken") && !name.contains("wing") {
            return ("bird.fill", .yellow)
        }
        if name.contains("salmon") || name.contains("fish") || name.contains("tuna") {
            return ("fish.fill", .cyan)
        }
        if name.contains("steak") || name.contains("beef") || name.contains("burger") {
            return ("flame.fill", .red)
        }
        if name.contains("pizza") {
            return ("circle.hexagongrid.fill", .red)
        }
        if name.contains("salad") || name.contains("buddha") || name.contains("veggie") {
            return ("leaf.fill", .green)
        }
        if name.contains("taco") || name.contains("burrito") || name.contains("mexican") {
            return ("takeoutbag.and.cup.and.straw.fill", .orange)
        }
        if name.contains("pasta") || name.contains("spaghetti") {
            return ("fork.knife", .yellow)
        }
        if name.contains("soup") || name.contains("bowl") || name.contains("ramen") || name.contains("korean") || name.contains("bbq") {
            return ("bowl.fill", .orange)
        }
        if name.contains("wrap") || name.contains("sandwich") {
            return ("takeoutbag.and.cup.and.straw.fill", .green)
        }
        if name.contains("breakfast") || name.contains("egg") || name.contains("omelette") {
            return ("sun.horizon.fill", .yellow)
        }
        if name.contains("dessert") || name.contains("cake") || name.contains("cookie") {
            return ("birthday.cake.fill", .pink)
        }
        if name.contains("coffee") || name.contains("latte") {
            return ("cup.and.saucer.fill", .brown)
        }
        if name.contains("smoothie") || name.contains("juice") || name.contains("drink") {
            return ("waterbottle.fill", .purple)
        }
        
        // Fall back to category matching
        switch cat {
        case "pizza": return ("circle.hexagongrid.fill", .red)
        case "burger", "burgers": return ("flame.fill", .orange)
        case "salad", "salads": return ("leaf.fill", .green)
        case "sandwich", "sandwiches": return ("takeoutbag.and.cup.and.straw.fill", .brown)
        case "main", "entree", "entrees": return ("fork.knife", .blue)
        case "breakfast": return ("sun.horizon.fill", .yellow)
        case "soup", "soups": return ("bowl.fill", .orange)
        case "pasta": return ("fork.knife", .yellow)
        case "asian", "chinese", "japanese": return ("bowl.fill", .red)
        case "mexican": return ("takeoutbag.and.cup.and.straw.fill", .orange)
        case "appetizer", "appetizers": return ("star.fill", .purple)
        case "dessert", "desserts": return ("birthday.cake.fill", .pink)
        case "beverage", "beverages", "drinks": return ("cup.and.saucer.fill", .blue)
        case "grill", "grilled": return ("flame.fill", .red)
        case "seafood", "fish": return ("fish.fill", .cyan)
        default: return ("fork.knife", .blue)
        }
    }
    
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12)
                .fill(
                    LinearGradient(
                        colors: [foodIcon.color.opacity(0.3), foodIcon.color.opacity(0.1)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
            
            Image(systemName: foodIcon.symbol)
                .font(.system(size: size * 0.4))
                .foregroundStyle(foodIcon.color)
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Star Rating View
struct StarRatingView: View {
    let rating: Int
    let maxRating: Int = 5
    var interactive: Bool = false
    var onRatingChanged: ((Int) -> Void)?
    
    var body: some View {
        HStack(spacing: 2) {
            ForEach(1...maxRating, id: \.self) { star in
                Image(systemName: star <= rating ? "star.fill" : "star")
                    .foregroundColor(.yellow)
                    .onTapGesture {
                        if interactive {
                            onRatingChanged?(star)
                        }
                    }
            }
        }
    }
}

// MARK: - Loading View
struct LoadingView: View {
    let message: String
    
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Error View
struct ErrorView: View {
    let message: String
    let retryAction: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundStyle(.orange)
            Text(message)
                .multilineTextAlignment(.center)
            Button("Retry", action: retryAction)
                .buttonStyle(.bordered)
        }
        .padding()
    }
}

#Preview {
    VStack(spacing: 20) {
        FilterChip(title: "Vegan", icon: "🌱", isSelected: true) {}
        FilterChip(title: "Dairy", icon: "🥛", isSelected: false) {}
        
        HStack {
            DietaryTagView(tag: "vegan", size: .small)
            DietaryTagView(tag: "spicy", size: .medium)
            DietaryTagView(tag: "high-protein", size: .large)
        }
        
        FoodImageView(category: "Pizza", size: 80)
        
        StarRatingView(rating: 4)
    }
    .padding()
}
