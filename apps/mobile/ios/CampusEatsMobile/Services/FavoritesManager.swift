// Favorites Manager - Manages user favorite dishes

import SwiftUI
import Combine

class FavoritesManager: ObservableObject {
    @Published var favoriteIds: Set<Int> = []
    
    private let storageKey = "favoriteDishIds"
    
    init() {
        loadFavorites()
    }
    
    func loadFavorites() {
        if let data = UserDefaults.standard.data(forKey: storageKey),
           let ids = try? JSONDecoder().decode(Set<Int>.self, from: data) {
            favoriteIds = ids
        }
    }
    
    func saveFavorites() {
        if let data = try? JSONEncoder().encode(favoriteIds) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }
    
    func isFavorite(_ dishId: Int) -> Bool {
        favoriteIds.contains(dishId)
    }
    
    func toggleFavorite(_ dishId: Int) {
        if favoriteIds.contains(dishId) {
            favoriteIds.remove(dishId)
        } else {
            favoriteIds.insert(dishId)
        }
        saveFavorites()
    }
    
    func addFavorite(_ dishId: Int) {
        favoriteIds.insert(dishId)
        saveFavorites()
    }
    
    func removeFavorite(_ dishId: Int) {
        favoriteIds.remove(dishId)
        saveFavorites()
    }
}
