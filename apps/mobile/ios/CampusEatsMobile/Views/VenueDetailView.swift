// Venue Detail View

import SwiftUI

struct VenueDetailView: View {
    let venue: Venue
    @State private var menus: [Menu] = []
    @State private var isLoading = true
    @State private var selectedDate = Date()
    @State private var showingDatePicker = false
    
    private var parsedHours: HoursParser.ParsedHours {
        HoursParser.parse(venue.hours)
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Header
                ZStack(alignment: .bottomLeading) {
                    LinearGradient(colors: [.green, .teal], startPoint: .topLeading, endPoint: .bottomTrailing)
                        .frame(height: 180)
                    
                    VStack(alignment: .leading, spacing: 6) {
                        Text(venue.name)
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundStyle(.white)
                        
                        if let location = venue.location {
                            Label(location, systemImage: "mappin.circle.fill")
                                .font(.subheadline)
                                .foregroundStyle(.white.opacity(0.9))
                        }
                    }
                    .padding()
                }
                
                VStack(alignment: .leading, spacing: 20) {
                    // Hours Section
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Hours of Operation", systemImage: "clock.fill")
                            .font(.headline)
                            .foregroundStyle(.green)
                        
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(parsedHours.allHours, id: \.day) { item in
                                HStack(alignment: .top) {
                                    Text(item.day)
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                        .frame(width: 90, alignment: .leading)
                                    
                                    Text(item.hours)
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            
                            if let notes = parsedHours.notes {
                                Text(notes)
                                    .font(.caption)
                                    .foregroundStyle(.orange)
                                    .padding(.top, 4)
                            }
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .padding(.horizontal)
                    
                    Divider()
                        .padding(.horizontal)
                    
                    // Date Picker Section
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Label("Menu", systemImage: "menucard.fill")
                                .font(.headline)
                            
                            Spacer()
                            
                            Button {
                                showingDatePicker = true
                            } label: {
                                HStack(spacing: 4) {
                                    Text(selectedDate, format: .dateTime.weekday(.abbreviated).month(.abbreviated).day())
                                        .font(.subheadline)
                                    Image(systemName: "calendar")
                                }
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color(.systemGray6))
                                .clipShape(Capsule())
                            }
                        }
                        .padding(.horizontal)
                        
                        if isLoading {
                            HStack {
                                Spacer()
                                ProgressView()
                                    .padding(.vertical, 40)
                                Spacer()
                            }
                        } else if menus.isEmpty {
                            VStack(spacing: 12) {
                                Image(systemName: "tray")
                                    .font(.largeTitle)
                                    .foregroundStyle(.secondary)
                                Text("No menu available for this date")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                Text("Try selecting a different date")
                                    .font(.caption)
                                    .foregroundStyle(.tertiary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 40)
                        } else {
                            ForEach(menus) { menu in
                                VStack(alignment: .leading, spacing: 12) {
                                    // Meal type header
                                    HStack {
                                        Text(mealEmoji(menu.mealType))
                                            .font(.title3)
                                        Text(menu.mealType.capitalized)
                                            .font(.headline)
                                    }
                                    .padding(.horizontal)
                                    
                                    if let dishes = menu.dishes, !dishes.isEmpty {
                                        LazyVStack(spacing: 8) {
                                            ForEach(dishes) { dish in
                                                NavigationLink(value: dish) {
                                                    MenuDishRow(dish: dish)
                                                }
                                                .buttonStyle(.plain)
                                            }
                                        }
                                        .padding(.horizontal)
                                    } else {
                                        Text("No dishes available")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                            .padding(.horizontal)
                                    }
                                }
                                .padding(.vertical, 8)
                            }
                        }
                    }
                }
                .padding(.top, 20)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: Dish.self) { dish in
            DishDetailView(dish: dish)
        }
        .sheet(isPresented: $showingDatePicker) {
            DatePickerSheet(selectedDate: $selectedDate) {
                Task { await loadMenus() }
            }
        }
        .task {
            await loadMenus()
        }
        .onChange(of: selectedDate) { _, _ in
            Task { await loadMenus() }
        }
    }
    
    private func mealEmoji(_ mealType: String) -> String {
        switch mealType.lowercased() {
        case "breakfast": return "🌅"
        case "brunch": return "🥞"
        case "lunch": return "☀️"
        case "dinner": return "🌙"
        default: return "🍽️"
        }
    }
    
    private func loadMenus() async {
        isLoading = true
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let dateStr = dateFormatter.string(from: selectedDate)
        
        do {
            menus = try await APIService.shared.getMenusForVenue(venue.venueId, date: dateStr)
        } catch {
            print("Error loading menus: \(error)")
            menus = []
        }
        isLoading = false
    }
}

struct MenuDishRow: View {
    let dish: Dish
    
    var body: some View {
        HStack(spacing: 12) {
            FoodImageView(category: dish.category ?? "General", size: 50)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(dish.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                
                HStack(spacing: 8) {
                    if let calories = dish.calories {
                        Text("\(calories) cal")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    
                    // Dietary tags
                    if let tags = dish.dietaryTags?.filter({ $0 != "general" }), !tags.isEmpty {
                        HStack(spacing: 2) {
                            ForEach(tags.prefix(3), id: \.self) { tag in
                                DietaryTagView(tag: tag, size: .small)
                            }
                        }
                    }
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
    }
}

struct DatePickerSheet: View {
    @Binding var selectedDate: Date
    @Environment(\.dismiss) private var dismiss
    let onSelect: () -> Void
    
    var body: some View {
        NavigationStack {
            DatePicker(
                "Select Date",
                selection: $selectedDate,
                displayedComponents: .date
            )
            .datePickerStyle(.graphical)
            .padding()
            .navigationTitle("Select Date")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        onSelect()
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
        .presentationDetents([.medium])
    }
}

#Preview {
    NavigationStack {
        VenueDetailView(venue: Venue(
            venueId: 1,
            name: "Student Center",
            location: "Main Campus",
            hours: "{\"monday_friday\": \"7 AM - 9 PM\", \"saturday_sunday\": \"9 AM - 7 PM\"}"
        ))
    }
}
