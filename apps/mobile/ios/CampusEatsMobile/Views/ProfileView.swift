// Profile View - User profile with reviews, favorites, and settings

import SwiftUI
import PhotosUI

struct ProfileView: View {
    @EnvironmentObject var favoritesManager: FavoritesManager
    @EnvironmentObject var reviewsManager: ReviewsManager
    @EnvironmentObject var nutritionTracker: NutritionTracker
    @EnvironmentObject var notificationManager: NotificationManager
    
    @State private var selectedTab = 0
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Profile header
                ProfileHeaderCard(
                    reviewCount: reviewsManager.userReviews.count,
                    favoriteCount: favoritesManager.favoriteIds.count,
                    avgRating: reviewsManager.averageRating
                )
                
                // Tab picker
                Picker("View", selection: $selectedTab) {
                    Text("Reviews").tag(0)
                    Text("Favorites").tag(1)
                    Text("Settings").tag(2)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)
                
                // Content based on tab
                switch selectedTab {
                case 0:
                    ReviewsListSection(reviewsManager: reviewsManager)
                case 1:
                    FavoritesSection(favoritesManager: favoritesManager)
                case 2:
                    SettingsSection()
                default:
                    EmptyView()
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("👤 Profile")
    }
}

struct ProfileHeaderCard: View {
    let reviewCount: Int
    let favoriteCount: Int
    let avgRating: Double
    
    var body: some View {
        VStack(spacing: 16) {
            // Avatar
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [.orange, .pink],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 80, height: 80)
                
                Text("🐾")
                    .font(.largeTitle)
            }
            
            Text("Panther User")
                .font(.title2)
                .fontWeight(.bold)
            
            // Stats
            HStack(spacing: 30) {
                ProfileStat(value: "\(reviewCount)", label: "Reviews")
                ProfileStat(value: "\(favoriteCount)", label: "Favorites")
                ProfileStat(value: String(format: "%.1f", avgRating), label: "Avg Rating")
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(.systemBackground))
        .cornerRadius(20)
        .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 5)
        .padding(.horizontal)
    }
}

struct ProfileStat: View {
    let value: String
    let label: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.orange)
            
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct ReviewsListSection: View {
    @ObservedObject var reviewsManager: ReviewsManager
    @State private var editingReview: UserReview?
    @State private var deleteReviewId: Int?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("📝 My Reviews")
                    .font(.headline)
                
                Spacer()
                
                Text("\(reviewsManager.userReviews.count) total")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal)
            
            if reviewsManager.userReviews.isEmpty {
                EmptyReviewsCard()
            } else {
                ForEach(reviewsManager.userReviews) { review in
                    ReviewCard(
                        review: review,
                        onEdit: { editingReview = review },
                        onDelete: { deleteReviewId = review.reviewId }
                    )
                }
            }
        }
        .padding(.horizontal)
        .sheet(item: $editingReview) { review in
            EditReviewSheet(
                review: review,
                reviewsManager: reviewsManager
            )
        }
        .alert("Delete Review?", isPresented: Binding(
            get: { deleteReviewId != nil },
            set: { if !$0 { deleteReviewId = nil } }
        )) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                if let id = deleteReviewId {
                    withAnimation {
                        reviewsManager.deleteReview(id)
                    }
                }
            }
        } message: {
            Text("This action cannot be undone.")
        }
    }
}

struct EmptyReviewsCard: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "star.bubble")
                .font(.largeTitle)
                .foregroundColor(.gray)
            
            Text("No reviews yet")
                .font(.headline)
            
            Text("Rate dishes to help other students find the best campus food!")
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

struct ReviewCard: View {
    let review: UserReview
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    private var dateFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(review.dishName)
                        .font(.headline)
                    
                    Text(dateFormatter.string(from: review.createdAt))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Star rating
                HStack(spacing: 2) {
                    ForEach(1...5, id: \.self) { star in
                        Image(systemName: star <= review.rating ? "star.fill" : "star")
                            .font(.caption)
                            .foregroundColor(.yellow)
                    }
                }
            }
            
            if let comment = review.comment, !comment.isEmpty {
                Text(comment)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            // Photos
            if let photoData = review.photoData, !photoData.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(photoData.indices, id: \.self) { index in
                            if let uiImage = UIImage(data: photoData[index]) {
                                Image(uiImage: uiImage)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 80, height: 80)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                            }
                        }
                    }
                }
            }
            
            // Actions
            HStack {
                Spacer()
                
                Button(action: onEdit) {
                    Label("Edit", systemImage: "pencil")
                        .font(.caption)
                }
                .buttonStyle(.bordered)
                
                Button(role: .destructive, action: onDelete) {
                    Label("Delete", systemImage: "trash")
                        .font(.caption)
                }
                .buttonStyle(.bordered)
                .tint(.red)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.03), radius: 5, x: 0, y: 2)
    }
}

struct EditReviewSheet: View {
    @Environment(\.dismiss) private var dismiss
    let review: UserReview
    @ObservedObject var reviewsManager: ReviewsManager
    
    @State private var rating: Int
    @State private var comment: String
    
    init(review: UserReview, reviewsManager: ReviewsManager) {
        self.review = review
        self.reviewsManager = reviewsManager
        _rating = State(initialValue: review.rating)
        _comment = State(initialValue: review.comment ?? "")
    }
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Rating") {
                    HStack {
                        ForEach(1...5, id: \.self) { star in
                            Button {
                                rating = star
                            } label: {
                                Image(systemName: star <= rating ? "star.fill" : "star")
                                    .font(.title2)
                                    .foregroundColor(.yellow)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                }
                
                Section("Comment") {
                    TextEditor(text: $comment)
                        .frame(minHeight: 100)
                }
            }
            .navigationTitle("Edit Review")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        reviewsManager.updateReview(review.reviewId, rating: rating, comment: comment)
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}

struct FavoritesSection: View {
    @ObservedObject var favoritesManager: FavoritesManager
    
    // Demo dishes for favorites display
    private let demoDishes: [Dish] = [
        Dish(dishId: 1, name: "Grilled Chicken Bowl", description: "Tender grilled chicken with quinoa", category: "Main", dietaryTags: ["high-protein"], allergens: nil, nutrition: Nutrition(calories: 450, gProtein: 42, gCarbs: 35, gFat: 12, gFiber: 6, gSugar: 4, mgSodium: 520), ingredients: nil),
        Dish(dishId: 2, name: "Buddha Bowl", description: "Quinoa, chickpeas, avocado", category: "Main", dietaryTags: ["vegan"], allergens: nil, nutrition: Nutrition(calories: 520, gProtein: 18, gCarbs: 62, gFat: 24, gFiber: 14, gSugar: 6, mgSodium: 420), ingredients: nil),
        Dish(dishId: 3, name: "Pepperoni Pizza", description: "Classic pepperoni with mozzarella", category: "Pizza", dietaryTags: nil, allergens: ["dairy"], nutrition: Nutrition(calories: 320, gProtein: 14, gCarbs: 36, gFat: 14, gFiber: 2, gSugar: 4, mgSodium: 780), ingredients: nil),
    ]
    
    var favoriteDishes: [Dish] {
        demoDishes.filter { favoritesManager.isFavorite($0.dishId) }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("❤️ Favorites")
                    .font(.headline)
                
                Spacer()
                
                Text("\(favoritesManager.favoriteIds.count) saved")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal)
            
            if favoritesManager.favoriteIds.isEmpty {
                EmptyFavoritesCard()
            } else {
                ForEach(favoriteDishes, id: \.dishId) { dish in
                    FavoriteCard(dish: dish, favoritesManager: favoritesManager)
                }
                
                if favoriteDishes.count < favoritesManager.favoriteIds.count {
                    Text("+ \(favoritesManager.favoriteIds.count - favoriteDishes.count) more favorites")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding()
                }
            }
        }
        .padding(.horizontal)
    }
}

struct EmptyFavoritesCard: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "heart")
                .font(.largeTitle)
                .foregroundColor(.gray)
            
            Text("No favorites yet")
                .font(.headline)
            
            Text("Tap the heart on dishes you love to save them here!")
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

struct FavoriteCard: View {
    let dish: Dish
    @ObservedObject var favoritesManager: FavoritesManager
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(dish.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                if let tags = dish.dietaryTags, !tags.isEmpty {
                    Text(tags.joined(separator: ", "))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            Button {
                withAnimation {
                    favoritesManager.removeFavorite(dish.dishId)
                }
            } label: {
                Image(systemName: "heart.fill")
                    .foregroundColor(.red)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.03), radius: 5, x: 0, y: 2)
    }
}

struct SettingsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("⚙️ Settings")
                .font(.headline)
                .padding(.horizontal)
            
            VStack(spacing: 0) {
                NavigationLink {
                    SmartNotificationsView()
                } label: {
                    SettingsRow(icon: "bell.fill", title: "Notifications", color: .orange)
                }
                
                Divider()
                
                NavigationLink {
                    NutritionDashboardView()
                } label: {
                    SettingsRow(icon: "chart.pie.fill", title: "Nutrition Goals", color: .green)
                }
                
                Divider()
                
                NavigationLink {
                    DietaryPreferencesView()
                } label: {
                    SettingsRow(icon: "leaf.fill", title: "Dietary Preferences", color: .mint)
                }
                
                Divider()
                
                NavigationLink {
                    AboutView()
                } label: {
                    SettingsRow(icon: "info.circle.fill", title: "About", color: .blue)
                }
            }
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .padding(.horizontal)
        }
    }
}

// MARK: - About View
struct AboutView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // App Logo & Name
                VStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [.orange, .pink, .purple],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 100, height: 100)
                        
                        Text("🍽️")
                            .font(.system(size: 50))
                    }
                    
                    Text("Campus Eats")
                        .font(.title)
                        .fontWeight(.bold)
                    
                    Text("Version 1.0.0")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 20)
                
                // Description
                VStack(alignment: .leading, spacing: 16) {
                    Text("Your Smart Campus Dining Companion")
                        .font(.headline)
                        .foregroundStyle(.orange)
                    
                    Text("Campus Eats helps you discover and enjoy the best food on campus. With AI-powered recommendations, real-time trending dishes, and personalized nutrition tracking, eating well has never been easier.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineSpacing(4)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(16)
                .padding(.horizontal)
                
                // Features
                VStack(alignment: .leading, spacing: 16) {
                    Text("Features")
                        .font(.headline)
                    
                    FeatureRow(icon: "sparkles", color: .purple, title: "AI Recommendations", description: "Smart dish suggestions based on your preferences")
                    FeatureRow(icon: "flame.fill", color: .orange, title: "Live Trending", description: "See what's popular right now on campus")
                    FeatureRow(icon: "chart.pie.fill", color: .green, title: "Nutrition Tracking", description: "Track your daily calories, protein, and macros")
                    FeatureRow(icon: "location.fill", color: .blue, title: "Nearby Dining", description: "Find dining halls closest to you")
                    FeatureRow(icon: "mic.fill", color: .red, title: "Voice Search", description: "Search for food using your voice")
                    FeatureRow(icon: "bell.fill", color: .yellow, title: "Smart Notifications", description: "Get alerts for your favorite dishes")
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(16)
                .padding(.horizontal)
                
                // Team
                VStack(alignment: .leading, spacing: 12) {
                    Text("Built with ❤️")
                        .font(.headline)
                    
                    Text("Campus Eats was created to solve the daily struggle of deciding what to eat on campus. Our mission is to make campus dining more enjoyable, nutritious, and social.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineSpacing(4)
                    
                    HStack(spacing: 20) {
                        Link(destination: URL(string: "https://github.com")!) {
                            Image(systemName: "link.circle.fill")
                                .font(.title)
                                .foregroundStyle(.blue)
                        }
                        
                        Link(destination: URL(string: "mailto:support@campuseats.app")!) {
                            Image(systemName: "envelope.circle.fill")
                                .font(.title)
                                .foregroundStyle(.green)
                        }
                    }
                    .padding(.top, 8)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(16)
                .padding(.horizontal)
                
                // Footer
                VStack(spacing: 8) {
                    Text("© 2025 Campus Eats")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    
                    Text("Made for students, by students 🎓")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
                .padding(.top, 20)
                .padding(.bottom, 40)
            }
        }
        .navigationTitle("About")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct FeatureRow: View {
    let icon: String
    let color: Color
    let title: String
    let description: String
    
    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
                .frame(width: 40)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text(description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

struct SettingsRow: View {
    let icon: String
    let title: String
    let color: Color
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 30)
            
            Text(title)
                .font(.subheadline)
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
    }
}

struct DietaryPreferencesView: View {
    @State private var selectedPreferences: Set<String> = []
    
    let preferences = [
        ("🌱", "Vegan"),
        ("🥛", "Dairy-Free"),
        ("🌾", "Gluten-Free"),
        ("🥜", "Nut-Free"),
        ("🍖", "High Protein"),
        ("🥗", "Low Carb"),
        ("🔥", "Spicy"),
        ("🐟", "Pescatarian"),
    ]
    
    var body: some View {
        List {
            Section("Select your dietary preferences") {
                ForEach(preferences, id: \.1) { emoji, name in
                    Button {
                        if selectedPreferences.contains(name) {
                            selectedPreferences.remove(name)
                        } else {
                            selectedPreferences.insert(name)
                        }
                    } label: {
                        HStack {
                            Text(emoji)
                            Text(name)
                                .foregroundColor(.primary)
                            Spacer()
                            if selectedPreferences.contains(name) {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.orange)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Dietary Preferences")
    }
}

#Preview {
    NavigationStack {
        ProfileView()
            .environmentObject(FavoritesManager())
            .environmentObject(ReviewsManager())
            .environmentObject(NutritionTracker())
            .environmentObject(NotificationManager())
    }
}
