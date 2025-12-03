// Location Manager - GPS-based dining hall detection

import SwiftUI
import CoreLocation

struct DiningLocation: Identifiable {
    let id = UUID()
    let name: String
    let coordinate: CLLocationCoordinate2D
    let address: String
    let currentMeal: String
    
    func distance(from location: CLLocation) -> Double {
        let diningLocation = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
        return location.distance(from: diningLocation)
    }
}

class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    
    @Published var location: CLLocation?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var nearestDiningHall: DiningLocation?
    @Published var distanceToNearest: Double?
    @Published var isSimulating: Bool = false
    
    // Demo dining locations (GSU Campus)
    let diningLocations: [DiningLocation] = [
        DiningLocation(
            name: "The Commons",
            coordinate: CLLocationCoordinate2D(latitude: 33.7537, longitude: -84.3863),
            address: "55 Gilmer St SE",
            currentMeal: "Lunch"
        ),
        DiningLocation(
            name: "Panther Dining Hall",
            coordinate: CLLocationCoordinate2D(latitude: 33.7547, longitude: -84.3851),
            address: "75 Piedmont Ave NE",
            currentMeal: "Lunch"
        ),
        DiningLocation(
            name: "Piedmont North Food Court",
            coordinate: CLLocationCoordinate2D(latitude: 33.7561, longitude: -84.3842),
            address: "162 Piedmont Ave NE",
            currentMeal: "Lunch"
        ),
        DiningLocation(
            name: "Langdale Hall Café",
            coordinate: CLLocationCoordinate2D(latitude: 33.7532, longitude: -84.3872),
            address: "38 Peachtree Center Ave",
            currentMeal: "Breakfast"
        )
    ]
    
    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
    }
    
    func requestPermission() {
        manager.requestWhenInUseAuthorization()
    }
    
    func startUpdating() {
        manager.startUpdatingLocation()
    }
    
    func stopUpdating() {
        manager.stopUpdatingLocation()
    }
    
    // Simulate being at a dining hall for demo
    func simulateLocation() {
        isSimulating = true
        // Simulate being near The Commons
        let simulatedLocation = CLLocation(latitude: 33.7538, longitude: -84.3864)
        self.location = simulatedLocation
        updateNearestDiningHall()
    }
    
    func updateNearestDiningHall() {
        guard let currentLocation = location else { return }
        
        var nearest: DiningLocation?
        var minDistance: Double = .infinity
        
        for dining in diningLocations {
            let distance = dining.distance(from: currentLocation)
            if distance < minDistance {
                minDistance = distance
                nearest = dining
            }
        }
        
        nearestDiningHall = nearest
        distanceToNearest = minDistance
    }
    
    func currentMealType() -> String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 6..<11: return "Breakfast"
        case 11..<15: return "Lunch"
        case 15..<21: return "Dinner"
        default: return "Closed"
        }
    }
    
    func formattedDistance() -> String {
        guard let distance = distanceToNearest else { return "Unknown" }
        
        // Convert meters to feet/miles
        let feet = distance * 3.28084
        let miles = distance / 1609.34
        
        if feet < 1000 {
            return String(format: "%.0f ft", feet)
        } else {
            return String(format: "%.2f mi", miles)
        }
    }
    
    // CLLocationManagerDelegate
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let newLocation = locations.last else { return }
        isSimulating = false
        location = newLocation
        updateNearestDiningHall()
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
        
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            startUpdating()
        case .denied, .restricted:
            // Simulate for demo
            simulateLocation()
        default:
            break
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location error: \(error.localizedDescription)")
        // Fallback to simulation
        simulateLocation()
    }
}
