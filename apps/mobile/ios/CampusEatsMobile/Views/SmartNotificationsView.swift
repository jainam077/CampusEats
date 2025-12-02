// Smart Notifications View - Notification preferences and testing

import SwiftUI

struct SmartNotificationsView: View {
    @EnvironmentObject var notificationManager: NotificationManager
    @State private var showTimePicker: String?
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Permission status
                PermissionStatusCard(notificationManager: notificationManager)
                
                // Notification preferences
                if notificationManager.isAuthorized {
                    PreferencesSection(notificationManager: notificationManager)
                    
                    MealTimesSection(
                        notificationManager: notificationManager,
                        showTimePicker: $showTimePicker
                    )
                    
                    TestNotificationsSection(notificationManager: notificationManager)
                }
            }
            .padding()
        }
        .navigationTitle("🔔 Notifications")
        .sheet(item: Binding(
            get: { showTimePicker.map { TimePickerSheet(meal: $0) } },
            set: { showTimePicker = $0?.meal }
        )) { sheet in
            TimePickerView(
                meal: sheet.meal,
                time: bindingFor(meal: sheet.meal),
                onSave: {
                    notificationManager.savePreferences()
                    notificationManager.scheduleMealReminders()
                }
            )
            .presentationDetents([.height(300)])
        }
    }
    
    private func bindingFor(meal: String) -> Binding<Date> {
        switch meal {
        case "breakfast":
            return $notificationManager.preferences.breakfastTime
        case "lunch":
            return $notificationManager.preferences.lunchTime
        case "dinner":
            return $notificationManager.preferences.dinnerTime
        default:
            return .constant(Date())
        }
    }
}

struct TimePickerSheet: Identifiable {
    let meal: String
    var id: String { meal }
}

struct PermissionStatusCard: View {
    @ObservedObject var notificationManager: NotificationManager
    
    var body: some View {
        VStack(spacing: 16) {
            switch notificationManager.authorizationStatus {
            case .authorized:
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                        .font(.title2)
                    
                    VStack(alignment: .leading) {
                        Text("Notifications Enabled")
                            .font(.headline)
                        Text("You'll receive meal reminders and updates")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                }
                
            case .denied:
                VStack(spacing: 12) {
                    HStack {
                        Image(systemName: "bell.slash.fill")
                            .foregroundColor(.red)
                            .font(.title2)
                        
                        VStack(alignment: .leading) {
                            Text("Notifications Blocked")
                                .font(.headline)
                            Text("Enable in Settings to receive updates")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                    }
                    
                    Button {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    } label: {
                        Label("Open Settings", systemImage: "gear")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.orange)
                }
                
            default:
                VStack(spacing: 12) {
                    Image(systemName: "bell.badge")
                        .font(.largeTitle)
                        .foregroundColor(.orange)
                    
                    Text("Enable Notifications")
                        .font(.headline)
                    
                    Text("Get notified about meal times, trending dishes, and when your favorites are available!")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    
                    Button {
                        Task {
                            await notificationManager.requestAuthorization()
                        }
                    } label: {
                        Text("Enable Notifications")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.orange)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

struct PreferencesSection: View {
    @ObservedObject var notificationManager: NotificationManager
    
    let preferences: [(keyPath: WritableKeyPath<NotificationPreferences, Bool>, label: String, icon: String)] = [
        (\.mealReminders, "Meal Time Reminders", "🍽️"),
        (\.dietaryAlerts, "Dietary Match Alerts", "🥗"),
        (\.trendingDishes, "Trending Dish Alerts", "🔥"),
        (\.limitedSpecials, "Limited Time Specials", "✨"),
        (\.favoriteAvailable, "Favorite Available", "⭐"),
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("⚙️ Preferences")
                .font(.headline)
            
            VStack(spacing: 0) {
                ForEach(preferences, id: \.label) { pref in
                    Toggle(isOn: Binding(
                        get: { notificationManager.preferences[keyPath: pref.keyPath] },
                        set: { _ in notificationManager.togglePreference(pref.keyPath) }
                    )) {
                        HStack {
                            Text(pref.icon)
                            Text(pref.label)
                                .font(.subheadline)
                        }
                    }
                    .tint(.orange)
                    .padding()
                    .background(Color(.systemBackground))
                    
                    if pref.label != preferences.last?.label {
                        Divider()
                    }
                }
            }
            .cornerRadius(12)
        }
    }
}

struct MealTimesSection: View {
    @ObservedObject var notificationManager: NotificationManager
    @Binding var showTimePicker: String?
    
    private var timeFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("⏰ Meal Reminder Times")
                .font(.headline)
            
            VStack(spacing: 0) {
                MealTimeRow(
                    emoji: "🍳",
                    meal: "Breakfast",
                    time: timeFormatter.string(from: notificationManager.preferences.breakfastTime)
                ) {
                    showTimePicker = "breakfast"
                }
                
                Divider()
                
                MealTimeRow(
                    emoji: "🥗",
                    meal: "Lunch",
                    time: timeFormatter.string(from: notificationManager.preferences.lunchTime)
                ) {
                    showTimePicker = "lunch"
                }
                
                Divider()
                
                MealTimeRow(
                    emoji: "🍝",
                    meal: "Dinner",
                    time: timeFormatter.string(from: notificationManager.preferences.dinnerTime)
                ) {
                    showTimePicker = "dinner"
                }
            }
            .background(Color(.systemBackground))
            .cornerRadius(12)
        }
    }
}

struct MealTimeRow: View {
    let emoji: String
    let meal: String
    let time: String
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack {
                Text(emoji)
                Text(meal)
                    .font(.subheadline)
                Spacer()
                Text(time)
                    .foregroundColor(.secondary)
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .buttonStyle(.plain)
    }
}

struct TimePickerView: View {
    @Environment(\.dismiss) private var dismiss
    let meal: String
    @Binding var time: Date
    let onSave: () -> Void
    
    var body: some View {
        NavigationStack {
            VStack {
                DatePicker(
                    "Select Time",
                    selection: $time,
                    displayedComponents: .hourAndMinute
                )
                .datePickerStyle(.wheel)
                .labelsHidden()
            }
            .navigationTitle("\(meal.capitalized) Time")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        onSave()
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}

struct TestNotificationsSection: View {
    @ObservedObject var notificationManager: NotificationManager
    
    let testTypes: [(type: String, label: String, color: Color)] = [
        ("meal", "🍽️ Meal", .blue),
        ("trending", "🔥 Trending", .red),
        ("dietary", "🥗 Dietary", .green),
        ("favorite", "⭐ Favorite", .yellow),
        ("special", "✨ Special", .purple),
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("🧪 Test Notifications")
                .font(.headline)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                ForEach(testTypes, id: \.type) { test in
                    Button {
                        notificationManager.sendTestNotification(type: test.type)
                    } label: {
                        Text(test.label)
                            .font(.caption)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(test.color.opacity(0.15))
                            .foregroundColor(test.color)
                            .cornerRadius(10)
                    }
                    .buttonStyle(.plain)
                }
            }
            
            Text("Tap to send a test notification")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
}

#Preview {
    NavigationStack {
        SmartNotificationsView()
            .environmentObject(NotificationManager())
    }
}
