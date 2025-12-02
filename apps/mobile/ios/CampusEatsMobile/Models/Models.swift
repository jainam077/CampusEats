// API Models

import Foundation

// MARK: - Venue
struct Venue: Codable, Identifiable, Hashable {
    let venueId: Int
    let name: String
    let location: String?
    let hours: String?
    
    var id: Int { venueId }
    
    enum CodingKeys: String, CodingKey {
        case venueId = "venue_id"
        case name, location, hours
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(venueId)
    }
    
    static func == (lhs: Venue, rhs: Venue) -> Bool {
        lhs.venueId == rhs.venueId
    }
}

struct VenuesResponse: Codable {
    let venues: [Venue]
    let total: Int
}

// MARK: - Nutrition
struct Nutrition: Codable {
    let calories: Double?
    let gProtein: Double?
    let gCarbs: Double?
    let gFat: Double?
    let gFiber: Double?
    let gSugar: Double?
    let mgSodium: Double?
    
    enum CodingKeys: String, CodingKey {
        case calories
        case gProtein = "g_protein"
        case gCarbs = "g_carbs"
        case gFat = "g_fat"
        case gFiber = "g_fiber"
        case gSugar = "g_sugar"
        case mgSodium = "mg_sodium"
    }
}

// MARK: - Dish
struct Dish: Codable, Identifiable, Hashable {
    let dishId: Int
    let name: String
    let description: String?
    let category: String?
    let dietaryTags: [String]?
    let allergens: [String]?
    let nutrition: Nutrition?
    let ingredients: String?
    
    var id: Int { dishId }
    
    // Computed properties for convenience
    var calories: Int? {
        guard let cal = nutrition?.calories else { return nil }
        return Int(cal)
    }
    
    var protein: Int? {
        guard let p = nutrition?.gProtein else { return nil }
        return Int(p)
    }
    
    var carbs: Int? {
        guard let c = nutrition?.gCarbs else { return nil }
        return Int(c)
    }
    
    var fat: Int? {
        guard let f = nutrition?.gFat else { return nil }
        return Int(f)
    }
    
    enum CodingKeys: String, CodingKey {
        case dishId = "dish_id"
        case name, description, category, allergens, nutrition, ingredients
        case dietaryTags = "dietary_tags"
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(dishId)
    }
    
    static func == (lhs: Dish, rhs: Dish) -> Bool {
        lhs.dishId == rhs.dishId
    }
}

struct DishesResponse: Codable {
    let dishes: [Dish]
    let total: Int
}

// MARK: - Menu
struct Menu: Codable, Identifiable {
    let menuId: Int
    let venueId: Int
    let menuDate: String
    let mealType: String
    let source: String?
    let dishes: [Dish]?
    
    var id: Int { menuId }
    
    enum CodingKeys: String, CodingKey {
        case menuId = "menu_id"
        case venueId = "venue_id"
        case menuDate = "menu_date"
        case mealType = "meal_type"
        case source, dishes
    }
}

// MARK: - Review
struct Review: Codable, Identifiable {
    let reviewId: Int
    let userId: Int
    let dishId: Int
    let rating: Int
    let textReview: String?
    let dietaryFeedback: String?
    let createdAt: String
    let userName: String?
    
    var id: Int { reviewId }
    
    enum CodingKeys: String, CodingKey {
        case reviewId = "review_id"
        case userId = "user_id"
        case dishId = "dish_id"
        case rating
        case textReview = "text_review"
        case dietaryFeedback = "dietary_feedback"
        case createdAt = "created_at"
        case userName = "user_name"
    }
}

// MARK: - Recommendation
struct Recommendation: Codable, Identifiable {
    let dish: Dish
    let score: Double
    let reason: String
    let avgRating: Double?
    let reviewCount: Int?
    
    var id: Int { dish.dishId }
    
    enum CodingKeys: String, CodingKey {
        case dish, score, reason
        case avgRating = "avg_rating"
        case reviewCount = "review_count"
    }
}

struct RecommendationsResponse: Codable {
    let recommendations: [Recommendation]
    let userId: Int?
    let isPersonalized: Bool
    let fallbackUsed: Bool
    
    enum CodingKeys: String, CodingKey {
        case recommendations
        case userId = "user_id"
        case isPersonalized = "is_personalized"
        case fallbackUsed = "fallback_used"
    }
}

// MARK: - Hours Parser
struct HoursParser {
    struct DayHours: Identifiable {
        let day: String
        let hours: String
        var id: String { day }
    }
    
    struct ParsedHours {
        let allHours: [DayHours]
        let notes: String?
        
        static var empty: ParsedHours {
            ParsedHours(allHours: [], notes: nil)
        }
    }
    
    static func parse(_ hoursString: String?) -> ParsedHours {
        guard let hoursString = hoursString, !hoursString.isEmpty else {
            return ParsedHours(
                allHours: [DayHours(day: "Hours", hours: "Not available")],
                notes: nil
            )
        }
        
        // Simple parsing - split by common separators
        var dayHours: [DayHours] = []
        var notes: String? = nil
        
        // Check for common patterns
        let lines = hoursString.components(separatedBy: CharacterSet.newlines)
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
        
        if lines.isEmpty {
            // Try semicolon or pipe separation
            let parts = hoursString.components(separatedBy: CharacterSet(charactersIn: ";|"))
                .map { $0.trimmingCharacters(in: .whitespaces) }
                .filter { !$0.isEmpty }
            
            for part in parts {
                if part.lowercased().contains("note") || part.lowercased().contains("closed") && !part.contains(":") {
                    notes = part
                } else {
                    let components = part.components(separatedBy: ":")
                    if components.count >= 2 {
                        let day = components[0].trimmingCharacters(in: .whitespaces)
                        let time = components.dropFirst().joined(separator: ":").trimmingCharacters(in: .whitespaces)
                        dayHours.append(DayHours(day: day, hours: time))
                    } else {
                        dayHours.append(DayHours(day: "Hours", hours: part))
                    }
                }
            }
        } else {
            for line in lines {
                if line.lowercased().contains("note") || (line.lowercased().contains("closed") && !line.contains(":")) {
                    notes = line
                } else if line.contains(":") || line.contains("-") {
                    // Try to parse as "Day: Time" or "Day - Time"
                    if let colonRange = line.range(of: ":") {
                        let day = String(line[..<colonRange.lowerBound]).trimmingCharacters(in: .whitespaces)
                        let time = String(line[colonRange.upperBound...]).trimmingCharacters(in: .whitespaces)
                        dayHours.append(DayHours(day: day, hours: time))
                    } else {
                        dayHours.append(DayHours(day: "Hours", hours: line))
                    }
                } else {
                    dayHours.append(DayHours(day: "Info", hours: line))
                }
            }
        }
        
        if dayHours.isEmpty {
            dayHours.append(DayHours(day: "Hours", hours: hoursString))
        }
        
        return ParsedHours(allHours: dayHours, notes: notes)
    }
}
