// Notification Manager - Smart notifications for meals

import SwiftUI
import UserNotifications

struct NotificationPreferences: Codable {
    var mealReminders: Bool = true
    var dietaryAlerts: Bool = true
    var trendingDishes: Bool = true
    var limitedSpecials: Bool = false
    var favoriteAvailable: Bool = true
    
    // Meal times
    var breakfastTime: Date = Calendar.current.date(from: DateComponents(hour: 8, minute: 0)) ?? Date()
    var lunchTime: Date = Calendar.current.date(from: DateComponents(hour: 12, minute: 0)) ?? Date()
    var dinnerTime: Date = Calendar.current.date(from: DateComponents(hour: 18, minute: 0)) ?? Date()
}

class NotificationManager: ObservableObject {
    @Published var isAuthorized: Bool = false
    @Published var authorizationStatus: UNAuthorizationStatus = .notDetermined
    @Published var preferences: NotificationPreferences = NotificationPreferences()
    
    private let prefsKey = "notificationPreferences"
    
    init() {
        loadPreferences()
        checkAuthorization()
    }
    
    func loadPreferences() {
        if let data = UserDefaults.standard.data(forKey: prefsKey),
           let prefs = try? JSONDecoder().decode(NotificationPreferences.self, from: data) {
            preferences = prefs
        }
    }
    
    func savePreferences() {
        if let data = try? JSONEncoder().encode(preferences) {
            UserDefaults.standard.set(data, forKey: prefsKey)
        }
    }
    
    func checkAuthorization() {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            DispatchQueue.main.async {
                self.authorizationStatus = settings.authorizationStatus
                self.isAuthorized = settings.authorizationStatus == .authorized
            }
        }
    }
    
    func requestAuthorization() async -> Bool {
        do {
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(
                options: [.alert, .badge, .sound]
            )
            await MainActor.run {
                self.isAuthorized = granted
                self.authorizationStatus = granted ? .authorized : .denied
            }
            return granted
        } catch {
            return false
        }
    }
    
    func scheduleMealReminders() {
        guard isAuthorized && preferences.mealReminders else { return }
        
        // Clear existing meal reminders
        UNUserNotificationCenter.current().removePendingNotificationRequests(
            withIdentifiers: ["breakfast", "lunch", "dinner"]
        )
        
        let meals: [(id: String, title: String, time: Date, emoji: String)] = [
            ("breakfast", "Breakfast Time! 🍳", preferences.breakfastTime, "🍳"),
            ("lunch", "Lunch Time! 🥗", preferences.lunchTime, "🥗"),
            ("dinner", "Dinner Time! 🍝", preferences.dinnerTime, "🍝")
        ]
        
        for meal in meals {
            let content = UNMutableNotificationContent()
            content.title = meal.title
            content.body = "Check out what's on the menu today!"
            content.sound = .default
            
            let components = Calendar.current.dateComponents([.hour, .minute], from: meal.time)
            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
            
            let request = UNNotificationRequest(identifier: meal.id, content: content, trigger: trigger)
            UNUserNotificationCenter.current().add(request)
        }
    }
    
    func sendTestNotification(type: String) {
        guard isAuthorized else { return }
        
        let content = UNMutableNotificationContent()
        
        switch type {
        case "meal":
            content.title = "🍽️ Time to Eat!"
            content.body = "Grilled Chicken Bowl is available now at The Commons. Rated 4.8⭐"
        case "trending":
            content.title = "🔥 Trending on Campus"
            content.body = "Buffalo Wings are blowing up! 35 orders in the last hour."
        case "dietary":
            content.title = "🥗 Matches Your Diet!"
            content.body = "New dish alert: Buddha Bowl - vegan, gluten-free"
        case "favorite":
            content.title = "⭐ Your Favorite is Back!"
            content.body = "Pepperoni Pizza is available today at Panther Dining!"
        case "special":
            content.title = "✨ Limited Time Special!"
            content.body = "Korean BBQ Bowl is only available today! Don't miss out!"
        default:
            content.title = "🍽️ Campus Eats"
            content.body = "Check out what's on the menu!"
        }
        
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request)
    }
    
    func togglePreference(_ keyPath: WritableKeyPath<NotificationPreferences, Bool>) {
        preferences[keyPath: keyPath].toggle()
        savePreferences()
        
        if keyPath == \NotificationPreferences.mealReminders {
            if preferences.mealReminders {
                scheduleMealReminders()
            } else {
                UNUserNotificationCenter.current().removePendingNotificationRequests(
                    withIdentifiers: ["breakfast", "lunch", "dinner"]
                )
            }
        }
    }
}
