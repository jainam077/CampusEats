// API Service for Campus Eats

import Foundation

class APIService {
    static let shared = APIService()
    
    // Change this to your API URL
    private let baseURL = "http://localhost:8000/api/v1"
    
    private init() {}
    
    // MARK: - Generic GET Request
    private func request<T: Decodable>(_ endpoint: String) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              200...299 ~= httpResponse.statusCode else {
            throw APIError.requestFailed
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(T.self, from: data)
    }
    
    // MARK: - Generic POST Request
    private func postRequest<T: Decodable, B: Encodable>(_ endpoint: String, body: B) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              200...299 ~= httpResponse.statusCode else {
            throw APIError.requestFailed
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(T.self, from: data)
    }
    
    // MARK: - Venues
    func getVenues() async throws -> [Venue] {
        let response: VenuesResponse = try await request("/venues")
        return response.venues
    }
    
    func getVenue(_ id: Int) async throws -> Venue {
        return try await request("/venues/\(id)")
    }
    
    // MARK: - Dishes
    func getDishes(limit: Int = 50) async throws -> [Dish] {
        let response: DishesResponse = try await request("/dishes?limit=\(limit)")
        return response.dishes
    }
    
    func getDish(_ id: Int) async throws -> Dish {
        return try await request("/dishes/\(id)")
    }
    
    func getDishReviews(_ dishId: Int) async throws -> [Review] {
        return try await request("/dishes/\(dishId)/reviews")
    }
    
    // MARK: - Menus
    func getMenusForVenue(_ venueId: Int, date: String) async throws -> [Menu] {
        struct MenusResponse: Decodable {
            let menus: [Menu]
        }
        let response: MenusResponse = try await request("/menus/venue/\(venueId)/date/\(date)")
        return response.menus
    }
    
    // MARK: - Reviews
    func submitReview(dishId: Int, rating: Int, text: String?, dietaryFeedback: String?) async throws {
        struct ReviewRequest: Encodable {
            let dish_id: Int
            let rating: Int
            let text_review: String?
            let dietary_feedback: String?
        }
        
        struct ReviewResponse: Decodable {
            let review_id: Int
            let message: String
        }
        
        let body = ReviewRequest(
            dish_id: dishId,
            rating: rating,
            text_review: text,
            dietary_feedback: dietaryFeedback
        )
        
        let _: ReviewResponse = try await postRequest("/reviews", body: body)
    }
    
    // MARK: - Recommendations
    func getRecommendations(limit: Int = 10) async throws -> RecommendationsResponse {
        return try await request("/recommendations?limit=\(limit)")
    }
    
    func getPersonalizedRecommendations(limit: Int = 10) async throws -> RecommendationsResponse {
        return try await request("/recommendations/for-you?limit=\(limit)")
    }
}

// MARK: - Errors
enum APIError: Error, LocalizedError {
    case invalidURL
    case requestFailed
    case decodingFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .requestFailed:
            return "Request failed. Please check your connection."
        case .decodingFailed:
            return "Failed to decode response"
        }
    }
}
