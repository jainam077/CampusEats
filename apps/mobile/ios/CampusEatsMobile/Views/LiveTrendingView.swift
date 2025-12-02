// Live Trending View - Real-time trending dishes

import SwiftUI

struct TrendingDish: Identifiable {
    let id = UUID()
    let dish: Dish
    var ordersLastHour: Int
    var percentChange: Int
    let venue: String
    var rank: Int
}

struct LiveTrendingView: View {
    @State private var trendingDishes: [TrendingDish] = []
    @State private var isLoading = true
    @State private var lastUpdated = Date()
    @State private var selectedTimeRange = "1h"
    @State private var pulseAnimation = false
    
    let timeRanges = ["1h", "3h", "Today"]
    
    // Demo data
    private let demoDishes: [TrendingDish] = [
        TrendingDish(dish: Dish(dishId: 1, name: "Buffalo Wings", description: "Crispy wings with spicy buffalo sauce", category: "Appetizer", dietaryTags: ["spicy"], allergens: nil, nutrition: Nutrition(calories: 680, gProtein: 38, gCarbs: 15, gFat: 52, gFiber: 1, gSugar: 2, mgSodium: 1200), ingredients: nil), ordersLastHour: 47, percentChange: 125, venue: "The Commons", rank: 1),
        TrendingDish(dish: Dish(dishId: 2, name: "Grilled Chicken Bowl", description: "Tender grilled chicken with quinoa", category: "Main", dietaryTags: ["high-protein", "gluten-free"], allergens: nil, nutrition: Nutrition(calories: 450, gProtein: 42, gCarbs: 35, gFat: 12, gFiber: 6, gSugar: 4, mgSodium: 520), ingredients: nil), ordersLastHour: 38, percentChange: 45, venue: "Panther Dining", rank: 2),
        TrendingDish(dish: Dish(dishId: 3, name: "Korean BBQ Bowl", description: "Marinated beef with gochujang sauce", category: "Main", dietaryTags: ["spicy"], allergens: ["soy"], nutrition: Nutrition(calories: 620, gProtein: 35, gCarbs: 55, gFat: 28, gFiber: 4, gSugar: 12, mgSodium: 890), ingredients: nil), ordersLastHour: 31, percentChange: 78, venue: "The Commons", rank: 3),
        TrendingDish(dish: Dish(dishId: 4, name: "Pepperoni Pizza", description: "Classic pepperoni with mozzarella", category: "Pizza", dietaryTags: nil, allergens: ["dairy", "gluten"], nutrition: Nutrition(calories: 320, gProtein: 14, gCarbs: 36, gFat: 14, gFiber: 2, gSugar: 4, mgSodium: 780), ingredients: nil), ordersLastHour: 28, percentChange: 15, venue: "Piedmont Food Court", rank: 4),
        TrendingDish(dish: Dish(dishId: 5, name: "Buddha Bowl", description: "Quinoa, roasted chickpeas, avocado", category: "Main", dietaryTags: ["vegan", "gluten-free"], allergens: nil, nutrition: Nutrition(calories: 520, gProtein: 18, gCarbs: 62, gFat: 24, gFiber: 14, gSugar: 6, mgSodium: 420), ingredients: nil), ordersLastHour: 24, percentChange: 32, venue: "The Commons", rank: 5),
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Live indicator header
                HStack {
                    HStack(spacing: 8) {
                        Circle()
                            .fill(Color.red)
                            .frame(width: 10, height: 10)
                            .scaleEffect(pulseAnimation ? 1.3 : 1.0)
                            .animation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true), value: pulseAnimation)
                        
                        Text("LIVE")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(20)
                    
                    Spacer()
                    
                    Text("Updated \(timeAgo(lastUpdated))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal)
                .onAppear { pulseAnimation = true }
                
                // Time range picker
                Picker("Time Range", selection: $selectedTimeRange) {
                    ForEach(timeRanges, id: \.self) { range in
                        Text(range).tag(range)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)
                
                // Trending list
                if isLoading {
                    ProgressView()
                        .padding(.top, 50)
                } else {
                    LazyVStack(spacing: 12) {
                        ForEach(Array(trendingDishes.enumerated()), id: \.element.id) { index, trending in
                            TrendingDishCard(trending: trending, index: index)
                                .transition(.asymmetric(
                                    insertion: .move(edge: .trailing).combined(with: .opacity),
                                    removal: .move(edge: .leading).combined(with: .opacity)
                                ))
                        }
                    }
                    .padding(.horizontal)
                }
                
                // Stats summary
                if !trendingDishes.isEmpty {
                    StatsCard(trendingDishes: trendingDishes)
                        .padding(.horizontal)
                        .padding(.top, 8)
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("🔥 Trending Now")
        .refreshable {
            await refreshData()
        }
        .onAppear {
            loadDemoData()
            startAutoRefresh()
        }
    }
    
    private func loadDemoData() {
        isLoading = true
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            withAnimation(.spring()) {
                trendingDishes = demoDishes
                isLoading = false
                lastUpdated = Date()
            }
        }
    }
    
    private func refreshData() async {
        // Simulate refresh with random order changes
        try? await Task.sleep(nanoseconds: 500_000_000)
        
        await MainActor.run {
            withAnimation(.spring()) {
                for i in 0..<trendingDishes.count {
                    trendingDishes[i].ordersLastHour += Int.random(in: 1...5)
                    trendingDishes[i].percentChange += Int.random(in: -5...15)
                }
                trendingDishes.sort { $0.ordersLastHour > $1.ordersLastHour }
                for i in 0..<trendingDishes.count {
                    trendingDishes[i].rank = i + 1
                }
                lastUpdated = Date()
            }
        }
    }
    
    private func startAutoRefresh() {
        Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { _ in
            Task { await refreshData() }
        }
    }
    
    private func timeAgo(_ date: Date) -> String {
        let seconds = Int(-date.timeIntervalSinceNow)
        if seconds < 60 { return "just now" }
        if seconds < 120 { return "1 min ago" }
        if seconds < 3600 { return "\(seconds / 60) mins ago" }
        return "\(seconds / 3600) hr ago"
    }
}

struct TrendingDishCard: View {
    let trending: TrendingDish
    let index: Int
    @State private var appeared = false
    
    var rankColor: Color {
        switch trending.rank {
        case 1: return .orange
        case 2: return .gray
        case 3: return .brown
        default: return .secondary
        }
    }
    
    var rankEmoji: String {
        switch trending.rank {
        case 1: return "🥇"
        case 2: return "🥈"
        case 3: return "🥉"
        default: return ""
        }
    }
    
    var body: some View {
        HStack(spacing: 12) {
            // Rank
            ZStack {
                if trending.rank <= 3 {
                    Text(rankEmoji)
                        .font(.title2)
                } else {
                    Text("#\(trending.rank)")
                        .font(.headline)
                        .foregroundColor(.secondary)
                }
            }
            .frame(width: 40)
            
            // Dish info
            VStack(alignment: .leading, spacing: 4) {
                Text(trending.dish.name)
                    .font(.headline)
                
                HStack(spacing: 8) {
                    Text(trending.venue)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if let tags = trending.dish.dietaryTags, !tags.isEmpty {
                        Text("•")
                            .foregroundColor(.secondary)
                        Text(tags.first ?? "")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                }
            }
            
            Spacer()
            
            // Stats
            VStack(alignment: .trailing, spacing: 4) {
                Text("\(trending.ordersLastHour)")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                HStack(spacing: 2) {
                    Image(systemName: trending.percentChange >= 0 ? "arrow.up" : "arrow.down")
                        .font(.caption2)
                    Text("\(abs(trending.percentChange))%")
                        .font(.caption)
                }
                .foregroundColor(trending.percentChange >= 0 ? .green : .red)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
        .scaleEffect(appeared ? 1 : 0.8)
        .opacity(appeared ? 1 : 0)
        .onAppear {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.7).delay(Double(index) * 0.1)) {
                appeared = true
            }
        }
    }
}

struct StatsCard: View {
    let trendingDishes: [TrendingDish]
    
    var totalOrders: Int {
        trendingDishes.reduce(0) { $0 + $1.ordersLastHour }
    }
    
    var avgChange: Int {
        guard !trendingDishes.isEmpty else { return 0 }
        return trendingDishes.reduce(0) { $0 + $1.percentChange } / trendingDishes.count
    }
    
    var body: some View {
        VStack(spacing: 16) {
            Text("📊 Campus Stats")
                .font(.headline)
            
            HStack(spacing: 20) {
                StatItem(value: "\(totalOrders)", label: "Orders/hr", icon: "cart.fill", color: .blue)
                StatItem(value: "+\(avgChange)%", label: "Avg Growth", icon: "chart.line.uptrend.xyaxis", color: .green)
                StatItem(value: "\(trendingDishes.count)", label: "Hot Items", icon: "flame.fill", color: .orange)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(16)
    }
}

struct StatItem: View {
    let value: String
    let label: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
            
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
            
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

#Preview {
    NavigationStack {
        LiveTrendingView()
    }
}
