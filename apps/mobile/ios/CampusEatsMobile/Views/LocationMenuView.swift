// Location Menu View - GPS-based dining hall detection

import SwiftUI
import CoreLocation

struct LocationMenuView: View {
    @EnvironmentObject var locationManager: LocationManager
    @State private var menuItems: [Dish] = []
    @State private var isLoading = false
    
    // Demo menu items
    private let demoMenuItems: [Dish] = [
        Dish(dishId: 1, name: "Grilled Chicken Bowl", description: "Tender grilled chicken with quinoa and roasted vegetables", category: "Main", dietaryTags: ["high-protein", "gluten-free"], allergens: nil, nutrition: Nutrition(calories: 450, gProtein: 42, gCarbs: 35, gFat: 12, gFiber: 6, gSugar: 4, mgSodium: 520), ingredients: nil),
        Dish(dishId: 2, name: "Caesar Salad", description: "Crisp romaine, parmesan, croutons", category: "Salad", dietaryTags: ["vegetarian"], allergens: ["dairy", "gluten"], nutrition: Nutrition(calories: 280, gProtein: 12, gCarbs: 18, gFat: 20, gFiber: 4, gSugar: 3, mgSodium: 480), ingredients: nil),
        Dish(dishId: 3, name: "Pepperoni Pizza", description: "Classic pepperoni with mozzarella", category: "Pizza", dietaryTags: nil, allergens: ["dairy", "gluten"], nutrition: Nutrition(calories: 320, gProtein: 14, gCarbs: 36, gFat: 14, gFiber: 2, gSugar: 4, mgSodium: 780), ingredients: nil),
        Dish(dishId: 4, name: "Buddha Bowl", description: "Quinoa, chickpeas, avocado, tahini", category: "Main", dietaryTags: ["vegan", "gluten-free"], allergens: ["sesame"], nutrition: Nutrition(calories: 520, gProtein: 18, gCarbs: 62, gFat: 24, gFiber: 14, gSugar: 6, mgSodium: 420), ingredients: nil),
        Dish(dishId: 5, name: "Turkey Club Sandwich", description: "Triple-decker with bacon and avocado", category: "Sandwich", dietaryTags: nil, allergens: ["gluten"], nutrition: Nutrition(calories: 580, gProtein: 32, gCarbs: 42, gFat: 28, gFiber: 4, gSugar: 6, mgSodium: 920), ingredients: nil),
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Location status card
                LocationStatusCard(locationManager: locationManager)
                
                // Nearest dining hall
                if let nearest = locationManager.nearestDiningHall {
                    NearestDiningCard(
                        diningHall: nearest,
                        distance: locationManager.formattedDistance(),
                        mealType: locationManager.currentMealType(),
                        isSimulating: locationManager.isSimulating
                    )
                    
                    // Current menu
                    CurrentMenuSection(
                        venueName: nearest.name,
                        mealType: locationManager.currentMealType(),
                        dishes: demoMenuItems
                    )
                }
                
                // All dining halls
                AllDiningHallsSection(
                    diningLocations: locationManager.diningLocations,
                    currentLocation: locationManager.location
                )
            }
            .padding()
        }
        .navigationTitle("📍 Nearby")
        .onAppear {
            if locationManager.authorizationStatus == .notDetermined {
                locationManager.requestPermission()
            } else if locationManager.location == nil {
                locationManager.simulateLocation()
            }
        }
        .refreshable {
            if locationManager.authorizationStatus == .authorizedWhenInUse ||
               locationManager.authorizationStatus == .authorizedAlways {
                locationManager.startUpdating()
            } else {
                locationManager.simulateLocation()
            }
        }
    }
}

struct LocationStatusCard: View {
    @ObservedObject var locationManager: LocationManager
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: locationManager.location != nil ? "location.fill" : "location.slash.fill")
                .font(.title2)
                .foregroundColor(locationManager.location != nil ? .green : .gray)
            
            VStack(alignment: .leading, spacing: 2) {
                if locationManager.location != nil {
                    Text(locationManager.isSimulating ? "Demo Mode" : "Location Active")
                        .font(.headline)
                    Text(locationManager.isSimulating ? "Simulated for demo" : "GPS tracking enabled")
                        .font(.caption)
                        .foregroundColor(.secondary)
                } else {
                    Text("Location Unavailable")
                        .font(.headline)
                    Text("Enable location for nearby dining")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            if locationManager.authorizationStatus == .denied {
                Button("Settings") {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }
                .font(.caption)
                .buttonStyle(.borderedProminent)
                .tint(.orange)
            }
        }
        .padding()
        .background(
            locationManager.isSimulating ?
            Color.yellow.opacity(0.1) :
            Color(.systemBackground)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(locationManager.isSimulating ? Color.yellow : Color.clear, lineWidth: 1)
        )
        .cornerRadius(12)
    }
}

struct NearestDiningCard: View {
    let diningHall: DiningLocation
    let distance: String
    let mealType: String
    let isSimulating: Bool
    
    var body: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("📍 Nearest Dining Hall")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        if isSimulating {
                            Text("DEMO")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.yellow)
                                .foregroundColor(.black)
                                .cornerRadius(4)
                        }
                    }
                    
                    Text(diningHall.name)
                        .font(.title2)
                        .fontWeight(.bold)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text(distance)
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.orange)
                    
                    Text("away")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Divider()
            
            HStack {
                Label(diningHall.address, systemImage: "mappin")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                HStack(spacing: 4) {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 8, height: 8)
                    
                    Text("Serving \(mealType)")
                        .font(.caption)
                        .foregroundColor(.green)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 5)
    }
}

struct CurrentMenuSection: View {
    let venueName: String
    let mealType: String
    let dishes: [Dish]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("🍽️ \(mealType) Menu")
                    .font(.headline)
                
                Spacer()
                
                Text("\(dishes.count) items")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            ForEach(dishes, id: \.dishId) { dish in
                LocationMenuItemCard(dish: dish)
            }
        }
    }
}

struct LocationMenuItemCard: View {
    let dish: Dish
    @EnvironmentObject var favoritesManager: FavoritesManager
    @EnvironmentObject var nutritionTracker: NutritionTracker
    @State private var showLoggedToast = false
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(dish.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                if let description = dish.description {
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
                
                if let tags = dish.dietaryTags, !tags.isEmpty {
                    HStack(spacing: 4) {
                        ForEach(tags.prefix(2), id: \.self) { tag in
                            Text(tag)
                                .font(.caption2)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.orange.opacity(0.15))
                                .foregroundColor(.orange)
                                .cornerRadius(4)
                        }
                    }
                }
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 8) {
                if let calories = dish.calories {
                    Text("\(calories) cal")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                HStack(spacing: 12) {
                    // Log meal button
                    Button {
                        nutritionTracker.logMeal(dish: dish)
                        withAnimation {
                            showLoggedToast = true
                        }
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                            showLoggedToast = false
                        }
                    } label: {
                        Image(systemName: showLoggedToast ? "checkmark.circle.fill" : "plus.circle")
                            .foregroundColor(showLoggedToast ? .green : .orange)
                    }
                    
                    // Favorite button
                    Button {
                        favoritesManager.toggleFavorite(dish.dishId)
                    } label: {
                        Image(systemName: favoritesManager.isFavorite(dish.dishId) ? "heart.fill" : "heart")
                            .foregroundColor(favoritesManager.isFavorite(dish.dishId) ? .red : .gray)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.03), radius: 5, x: 0, y: 2)
    }
}

struct AllDiningHallsSection: View {
    let diningLocations: [DiningLocation]
    let currentLocation: CLLocation?
    
    var sortedLocations: [DiningLocation] {
        guard let current = currentLocation else { return diningLocations }
        return diningLocations.sorted { $0.distance(from: current) < $1.distance(from: current) }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("🏫 All Dining Halls")
                .font(.headline)
            
            ForEach(sortedLocations) { location in
                DiningHallRow(
                    location: location,
                    distance: currentLocation.map { location.distance(from: $0) }
                )
            }
        }
    }
}

struct DiningHallRow: View {
    let location: DiningLocation
    let distance: Double?
    
    var formattedDistance: String {
        guard let d = distance else { return "" }
        // Convert meters to feet/miles
        let feet = d * 3.28084
        let miles = d / 1609.34
        
        if feet < 1000 {
            return String(format: "%.0f ft", feet)
        } else {
            return String(format: "%.2f mi", miles)
        }
    }
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(location.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text(location.address)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if !formattedDistance.isEmpty {
                Text(formattedDistance)
                    .font(.caption)
                    .foregroundColor(.orange)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

#Preview {
    NavigationStack {
        LocationMenuView()
            .environmentObject(LocationManager())
            .environmentObject(FavoritesManager())
            .environmentObject(NutritionTracker())
    }
}
