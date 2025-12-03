// Campus Eats Mobile App - Main Entry Point

import SwiftUI

@main
struct CampusEatsMobileApp: App {
    @StateObject private var favoritesManager = FavoritesManager()
    @StateObject private var reviewsManager = ReviewsManager()
    @StateObject private var nutritionTracker = NutritionTracker()
    @StateObject private var notificationManager = NotificationManager()
    @StateObject private var locationManager = LocationManager()
    
    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environmentObject(favoritesManager)
                .environmentObject(reviewsManager)
                .environmentObject(nutritionTracker)
                .environmentObject(notificationManager)
                .environmentObject(locationManager)
        }
    }
}
