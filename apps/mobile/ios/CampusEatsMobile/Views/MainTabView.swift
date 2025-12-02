// Main Tab View - App Navigation

import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    @State private var showAIChatSheet = false
    
    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            TabView(selection: $selectedTab) {
                // Home / Dishes
                NavigationStack {
                    DishesView()
                }
                .tabItem {
                    Label("Menu", systemImage: "fork.knife")
                }
                .tag(0)
                
                // Live Trending
                NavigationStack {
                    LiveTrendingView()
                }
                .tabItem {
                    Label("Trending", systemImage: "flame.fill")
                }
                .tag(1)
                
                // Location Menu
                NavigationStack {
                    LocationMenuView()
                }
                .tabItem {
                    Label("Nearby", systemImage: "location.fill")
                }
                .tag(2)
                
                // Recommendations
                NavigationStack {
                    RecommendationsView()
                }
                .tabItem {
                    Label("For You", systemImage: "star.fill")
                }
                .tag(3)
                
                // Profile / Reviews
                NavigationStack {
                    ProfileView()
                }
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(4)
            }
            .tint(.orange)
            
            // Floating AI Chat Button
            Button {
                showAIChatSheet = true
            } label: {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [.orange, .pink],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 60, height: 60)
                        .shadow(color: .orange.opacity(0.4), radius: 10, x: 0, y: 5)
                    
                    Image(systemName: "sparkles")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundColor(.white)
                }
            }
            .padding(.trailing, 20)
            .padding(.bottom, 90)
        }
        .sheet(isPresented: $showAIChatSheet) {
            AIChatView()
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(FavoritesManager())
        .environmentObject(ReviewsManager())
        .environmentObject(NutritionTracker())
        .environmentObject(NotificationManager())
        .environmentObject(LocationManager())
}
