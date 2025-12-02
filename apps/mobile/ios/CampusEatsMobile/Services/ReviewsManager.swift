// Reviews Manager - Manages user reviews with local persistence

import SwiftUI
import Combine

struct UserReview: Codable, Identifiable {
    var id: Int { reviewId }
    let reviewId: Int
    let dishId: Int
    let dishName: String
    let rating: Int
    let comment: String?
    let photoData: [Data]?
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case reviewId, dishId, dishName, rating, comment, photoData, createdAt
    }
}

class ReviewsManager: ObservableObject {
    @Published var userReviews: [UserReview] = []
    
    private let storageKey = "userReviews"
    
    init() {
        loadReviews()
    }
    
    func loadReviews() {
        if let data = UserDefaults.standard.data(forKey: storageKey),
           let reviews = try? JSONDecoder().decode([UserReview].self, from: data) {
            userReviews = reviews.sorted { $0.createdAt > $1.createdAt }
        }
    }
    
    func saveReviews() {
        if let data = try? JSONEncoder().encode(userReviews) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }
    
    func addReview(dishId: Int, dishName: String, rating: Int, comment: String?, photos: [UIImage]?) {
        let photoData = photos?.compactMap { $0.jpegData(compressionQuality: 0.7) }
        
        let review = UserReview(
            reviewId: Int(Date().timeIntervalSince1970 * 1000),
            dishId: dishId,
            dishName: dishName,
            rating: rating,
            comment: comment,
            photoData: photoData,
            createdAt: Date()
        )
        
        userReviews.insert(review, at: 0)
        saveReviews()
    }
    
    func updateReview(_ reviewId: Int, rating: Int, comment: String?) {
        if let index = userReviews.firstIndex(where: { $0.reviewId == reviewId }) {
            let old = userReviews[index]
            let updated = UserReview(
                reviewId: old.reviewId,
                dishId: old.dishId,
                dishName: old.dishName,
                rating: rating,
                comment: comment,
                photoData: old.photoData,
                createdAt: old.createdAt
            )
            userReviews[index] = updated
            saveReviews()
        }
    }
    
    func deleteReview(_ reviewId: Int) {
        userReviews.removeAll { $0.reviewId == reviewId }
        saveReviews()
    }
    
    func reviewsFor(dishId: Int) -> [UserReview] {
        userReviews.filter { $0.dishId == dishId }
    }
    
    var averageRating: Double {
        guard !userReviews.isEmpty else { return 0 }
        return Double(userReviews.reduce(0) { $0 + $1.rating }) / Double(userReviews.count)
    }
}
