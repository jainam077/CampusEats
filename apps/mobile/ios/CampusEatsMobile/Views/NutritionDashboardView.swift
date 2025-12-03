// Nutrition Dashboard View - Weekly tracking with charts

import SwiftUI
import Charts

struct NutritionDashboardView: View {
    @EnvironmentObject var tracker: NutritionTracker
    @State private var selectedTab = 0
    @State private var showGoalsSheet = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Daily Progress Header
                DailyProgressCard(tracker: tracker)
                
                // Tab selector
                Picker("View", selection: $selectedTab) {
                    Text("Today").tag(0)
                    Text("Week").tag(1)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)
                
                if selectedTab == 0 {
                    TodayView(tracker: tracker)
                } else {
                    WeekView(tracker: tracker)
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("🥗 Nutrition")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showGoalsSheet = true
                } label: {
                    Image(systemName: "target")
                }
            }
        }
        .sheet(isPresented: $showGoalsSheet) {
            GoalsSettingsView(tracker: tracker)
        }
    }
}

struct DailyProgressCard: View {
    @ObservedObject var tracker: NutritionTracker
    
    var body: some View {
        VStack(spacing: 16) {
            // Calories circle
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 12)
                
                Circle()
                    .trim(from: 0, to: tracker.caloriesProgress)
                    .stroke(
                        LinearGradient(
                            colors: [.orange, .pink],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 12, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.spring(), value: tracker.caloriesProgress)
                
                VStack(spacing: 4) {
                    Text("\(tracker.todayCalories)")
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                    
                    Text("of \(tracker.goals.dailyCalories) cal")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .frame(width: 150, height: 150)
            
            // Macro bars
            HStack(spacing: 20) {
                MacroProgressBar(
                    label: "Protein",
                    current: tracker.todayProtein,
                    goal: tracker.goals.dailyProtein,
                    unit: "g",
                    color: .blue
                )
                
                MacroProgressBar(
                    label: "Carbs",
                    current: tracker.todayCarbs,
                    goal: tracker.goals.dailyCarbs,
                    unit: "g",
                    color: .green
                )
                
                MacroProgressBar(
                    label: "Fat",
                    current: tracker.todayFat,
                    goal: tracker.goals.dailyFat,
                    unit: "g",
                    color: .purple
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(20)
        .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 5)
        .padding(.horizontal)
    }
}

struct MacroProgressBar: View {
    let label: String
    let current: Int
    let goal: Int
    let unit: String
    let color: Color
    
    var progress: Double {
        min(Double(current) / Double(goal), 1.0)
    }
    
    var body: some View {
        VStack(spacing: 8) {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
            
            ZStack(alignment: .bottom) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 24, height: 60)
                
                RoundedRectangle(cornerRadius: 4)
                    .fill(color)
                    .frame(width: 24, height: 60 * progress)
                    .animation(.spring(), value: progress)
            }
            
            Text("\(current)\(unit)")
                .font(.caption)
                .fontWeight(.semibold)
        }
    }
}

struct TodayView: View {
    @ObservedObject var tracker: NutritionTracker
    
    var body: some View {
        VStack(spacing: 16) {
            // Today's meals
            VStack(alignment: .leading, spacing: 12) {
                Text("Today's Meals")
                    .font(.headline)
                    .padding(.horizontal)
                
                if tracker.todayEntries.isEmpty {
                    EmptyMealsCard()
                } else {
                    ForEach(tracker.todayEntries) { entry in
                        MealEntryCard(entry: entry) {
                            withAnimation {
                                tracker.removeEntry(entry)
                            }
                        }
                    }
                }
            }
        }
        .padding(.horizontal)
    }
}

struct EmptyMealsCard: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "fork.knife")
                .font(.largeTitle)
                .foregroundColor(.gray)
            
            Text("No meals logged today")
                .font(.headline)
                .foregroundColor(.secondary)
            
            Text("Log meals from the menu to track nutrition")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .background(Color(.systemGray6))
        .cornerRadius(16)
    }
}

struct MealEntryCard: View {
    let entry: NutritionEntry
    let onDelete: () -> Void
    
    private var timeFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter
    }
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.dishName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text(timeFormatter.string(from: entry.date))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            HStack(spacing: 12) {
                VStack {
                    Text("\(entry.calories)")
                        .font(.headline)
                        .foregroundColor(.orange)
                    Text("cal")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                
                Button(role: .destructive, action: onDelete) {
                    Image(systemName: "trash")
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.03), radius: 5, x: 0, y: 2)
    }
}

struct WeekView: View {
    @ObservedObject var tracker: NutritionTracker
    
    var body: some View {
        VStack(spacing: 20) {
            // Weekly chart
            WeeklyCaloriesChart(tracker: tracker)
            
            // Weekly stats
            WeeklyStatsCard(tracker: tracker)
        }
        .padding(.horizontal)
    }
}

struct WeeklyCaloriesChart: View {
    @ObservedObject var tracker: NutritionTracker
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("This Week")
                .font(.headline)
            
            Chart {
                ForEach(tracker.dailyCaloriesForWeek(), id: \.day) { item in
                    BarMark(
                        x: .value("Day", item.day),
                        y: .value("Calories", item.calories)
                    )
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.orange, .pink],
                            startPoint: .bottom,
                            endPoint: .top
                        )
                    )
                    .cornerRadius(6)
                }
                
                // Goal line
                RuleMark(y: .value("Goal", tracker.goals.dailyCalories))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
                    .foregroundStyle(.gray)
            }
            .frame(height: 200)
            .chartYAxis {
                AxisMarks(position: .leading)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

struct WeeklyStatsCard: View {
    @ObservedObject var tracker: NutritionTracker
    
    var body: some View {
        VStack(spacing: 16) {
            Text("📊 Weekly Summary")
                .font(.headline)
            
            HStack(spacing: 20) {
                WeekStatItem(
                    icon: "flame.fill",
                    value: "\(tracker.weeklyAverageCalories)",
                    label: "Avg Cal/Day",
                    color: .orange
                )
                
                WeekStatItem(
                    icon: "fork.knife",
                    value: "\(tracker.weekEntries.count)",
                    label: "Meals Logged",
                    color: .blue
                )
                
                let onTrack = tracker.weeklyAverageCalories <= tracker.goals.dailyCalories
                WeekStatItem(
                    icon: onTrack ? "checkmark.circle.fill" : "exclamationmark.triangle.fill",
                    value: onTrack ? "On Track" : "Over",
                    label: "Status",
                    color: onTrack ? .green : .red
                )
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(16)
    }
}

struct WeekStatItem: View {
    let icon: String
    let value: String
    let label: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
            
            Text(value)
                .font(.headline)
            
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct GoalsSettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var tracker: NutritionTracker
    
    @State private var calories: Double
    @State private var protein: Double
    @State private var carbs: Double
    @State private var fat: Double
    
    init(tracker: NutritionTracker) {
        self.tracker = tracker
        _calories = State(initialValue: Double(tracker.goals.dailyCalories))
        _protein = State(initialValue: Double(tracker.goals.dailyProtein))
        _carbs = State(initialValue: Double(tracker.goals.dailyCarbs))
        _fat = State(initialValue: Double(tracker.goals.dailyFat))
    }
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Daily Goals") {
                    VStack(alignment: .leading) {
                        HStack {
                            Text("Calories")
                            Spacer()
                            Text("\(Int(calories))")
                                .foregroundColor(.orange)
                        }
                        Slider(value: $calories, in: 1200...4000, step: 50)
                            .tint(.orange)
                    }
                    
                    VStack(alignment: .leading) {
                        HStack {
                            Text("Protein")
                            Spacer()
                            Text("\(Int(protein))g")
                                .foregroundColor(.blue)
                        }
                        Slider(value: $protein, in: 30...200, step: 5)
                            .tint(.blue)
                    }
                    
                    VStack(alignment: .leading) {
                        HStack {
                            Text("Carbs")
                            Spacer()
                            Text("\(Int(carbs))g")
                                .foregroundColor(.green)
                        }
                        Slider(value: $carbs, in: 50...500, step: 10)
                            .tint(.green)
                    }
                    
                    VStack(alignment: .leading) {
                        HStack {
                            Text("Fat")
                            Spacer()
                            Text("\(Int(fat))g")
                                .foregroundColor(.purple)
                        }
                        Slider(value: $fat, in: 20...150, step: 5)
                            .tint(.purple)
                    }
                }
                
                Section {
                    Button("Reset to Defaults") {
                        calories = 2000
                        protein = 50
                        carbs = 250
                        fat = 65
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Nutrition Goals")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        tracker.updateGoals(NutritionGoals(
                            dailyCalories: Int(calories),
                            dailyProtein: Int(protein),
                            dailyCarbs: Int(carbs),
                            dailyFat: Int(fat)
                        ))
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        NutritionDashboardView()
            .environmentObject(NutritionTracker())
    }
}
