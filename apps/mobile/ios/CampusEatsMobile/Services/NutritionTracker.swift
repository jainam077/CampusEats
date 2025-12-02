// Nutrition Tracker - Weekly nutrition tracking with goals

import SwiftUI
import Combine

struct NutritionEntry: Codable, Identifiable {
    var id: UUID = UUID()
    let dishId: Int
    let dishName: String
    let calories: Int
    let protein: Int
    let carbs: Int
    let fat: Int
    let date: Date
}

struct NutritionGoals: Codable {
    var dailyCalories: Int = 2000
    var dailyProtein: Int = 50
    var dailyCarbs: Int = 250
    var dailyFat: Int = 65
}

class NutritionTracker: ObservableObject {
    @Published var entries: [NutritionEntry] = []
    @Published var goals: NutritionGoals = NutritionGoals()
    
    private let entriesKey = "nutritionEntries"
    private let goalsKey = "nutritionGoals"
    
    init() {
        loadData()
    }
    
    func loadData() {
        // Load entries
        if let data = UserDefaults.standard.data(forKey: entriesKey),
           let entries = try? JSONDecoder().decode([NutritionEntry].self, from: data) {
            self.entries = entries
        }
        
        // Load goals
        if let data = UserDefaults.standard.data(forKey: goalsKey),
           let goals = try? JSONDecoder().decode(NutritionGoals.self, from: data) {
            self.goals = goals
        }
    }
    
    func saveData() {
        if let entriesData = try? JSONEncoder().encode(entries) {
            UserDefaults.standard.set(entriesData, forKey: entriesKey)
        }
        if let goalsData = try? JSONEncoder().encode(goals) {
            UserDefaults.standard.set(goalsData, forKey: goalsKey)
        }
    }
    
    func logMeal(dish: Dish) {
        let entry = NutritionEntry(
            dishId: dish.dishId,
            dishName: dish.name,
            calories: dish.calories ?? 0,
            protein: dish.protein ?? 0,
            carbs: dish.carbs ?? 0,
            fat: dish.fat ?? 0,
            date: Date()
        )
        entries.append(entry)
        saveData()
    }
    
    func removeEntry(_ entry: NutritionEntry) {
        entries.removeAll { $0.id == entry.id }
        saveData()
    }
    
    // Get entries for today
    var todayEntries: [NutritionEntry] {
        let calendar = Calendar.current
        return entries.filter { calendar.isDateInToday($0.date) }
    }
    
    // Get entries for this week
    var weekEntries: [NutritionEntry] {
        let calendar = Calendar.current
        let weekAgo = calendar.date(byAdding: .day, value: -7, to: Date()) ?? Date()
        return entries.filter { $0.date >= weekAgo }
    }
    
    // Today's totals
    var todayCalories: Int { todayEntries.reduce(0) { $0 + $1.calories } }
    var todayProtein: Int { todayEntries.reduce(0) { $0 + $1.protein } }
    var todayCarbs: Int { todayEntries.reduce(0) { $0 + $1.carbs } }
    var todayFat: Int { todayEntries.reduce(0) { $0 + $1.fat } }
    
    // Progress percentages
    var caloriesProgress: Double { min(Double(todayCalories) / Double(goals.dailyCalories), 1.0) }
    var proteinProgress: Double { min(Double(todayProtein) / Double(goals.dailyProtein), 1.0) }
    var carbsProgress: Double { min(Double(todayCarbs) / Double(goals.dailyCarbs), 1.0) }
    var fatProgress: Double { min(Double(todayFat) / Double(goals.dailyFat), 1.0) }
    
    // Weekly averages
    var weeklyAverageCalories: Int {
        guard !weekEntries.isEmpty else { return 0 }
        let days = Set(weekEntries.map { Calendar.current.startOfDay(for: $0.date) }).count
        return weekEntries.reduce(0) { $0 + $1.calories } / max(days, 1)
    }
    
    // Daily breakdown for chart
    func dailyCaloriesForWeek() -> [(day: String, calories: Int)] {
        let calendar = Calendar.current
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        
        var result: [(String, Int)] = []
        
        for i in (0..<7).reversed() {
            guard let date = calendar.date(byAdding: .day, value: -i, to: Date()) else { continue }
            let dayStart = calendar.startOfDay(for: date)
            let dayEnd = calendar.date(byAdding: .day, value: 1, to: dayStart)!
            
            let dayEntries = entries.filter { $0.date >= dayStart && $0.date < dayEnd }
            let totalCalories = dayEntries.reduce(0) { $0 + $1.calories }
            
            result.append((formatter.string(from: date), totalCalories))
        }
        
        return result
    }
    
    func updateGoals(_ newGoals: NutritionGoals) {
        goals = newGoals
        saveData()
    }
}
