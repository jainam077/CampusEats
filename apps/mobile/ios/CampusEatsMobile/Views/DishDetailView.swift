// Dish Detail View

import SwiftUI
import PhotosUI

struct DishDetailView: View {
    let dish: Dish
    @State private var reviews: [Review] = []
    @State private var isLoadingReviews = true
    @State private var showReviewSheet = false
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Hero Header
                ZStack(alignment: .bottom) {
                    FoodImageView(category: dish.category ?? "General", size: 200)
                        .frame(maxWidth: .infinity)
                        .frame(height: 200)
                        .clipShape(Rectangle())
                    
                    // Gradient overlay
                    LinearGradient(
                        colors: [.clear, .black.opacity(0.6)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: 100)
                }
                .frame(height: 200)
                
                VStack(alignment: .leading, spacing: 20) {
                    // Title and category
                    VStack(alignment: .leading, spacing: 8) {
                        Text(dish.name)
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        if let category = dish.category {
                            Text(category)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color(.systemGray5))
                                .clipShape(Capsule())
                        }
                    }
                    
                    // Dietary Info with proper icons
                    if let tags = dish.dietaryTags?.filter({ $0 != "general" }), !tags.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Dietary Info")
                                .font(.headline)
                            
                            FlowLayout(spacing: 8) {
                                ForEach(tags, id: \.self) { tag in
                                    DietaryTagView(tag: tag, size: .medium, showLabel: true)
                                }
                            }
                        }
                    }
                    
                    // Allergens Warning
                    if let allergens = dish.allergens, !allergens.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            Label("Allergens", systemImage: "exclamationmark.triangle.fill")
                                .font(.headline)
                                .foregroundStyle(.orange)
                            
                            FlowLayout(spacing: 8) {
                                ForEach(allergens, id: \.self) { allergen in
                                    Text(allergen)
                                        .font(.caption)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 6)
                                        .background(Color.orange.opacity(0.1))
                                        .foregroundStyle(.orange)
                                        .clipShape(Capsule())
                                }
                            }
                        }
                    }
                    
                    // Nutrition Card
                    if dish.nutrition != nil {
                        NutritionCard(dish: dish)
                    }
                    
                    // Ingredients
                    if let ingredients = dish.ingredients, !ingredients.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Ingredients")
                                .font(.headline)
                            
                            Text(ingredients)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    
                    Divider()
                    
                    // Reviews Section
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Reviews")
                                .font(.headline)
                            
                            Spacer()
                            
                            Button {
                                showReviewSheet = true
                            } label: {
                                Label("Add Review", systemImage: "plus.circle.fill")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.green)
                        }
                        
                        if isLoadingReviews {
                            HStack {
                                Spacer()
                                ProgressView()
                                Spacer()
                            }
                            .padding()
                        } else if reviews.isEmpty {
                            VStack(spacing: 12) {
                                Image(systemName: "star.bubble")
                                    .font(.largeTitle)
                                    .foregroundStyle(.secondary)
                                Text("No reviews yet")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                Text("Be the first to review this dish!")
                                    .font(.caption)
                                    .foregroundStyle(.tertiary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 30)
                        } else {
                            LazyVStack(spacing: 12) {
                                ForEach(reviews) { review in
                                    ReviewRow(review: review)
                                }
                            }
                        }
                    }
                }
                .padding()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showReviewSheet) {
            AddReviewSheet(dish: dish) {
                Task { await loadReviews() }
            }
        }
        .task {
            await loadReviews()
        }
    }
    
    private func loadReviews() async {
        do {
            reviews = try await APIService.shared.getDishReviews(dish.dishId)
        } catch {
            print("Error loading reviews: \(error)")
        }
        isLoadingReviews = false
    }
}

struct NutritionCard: View {
    let dish: Dish
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "chart.bar.fill")
                    .foregroundStyle(.green)
                Text("Nutrition Facts")
                    .font(.headline)
            }
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                NutritionItem(value: dish.calories, unit: "", label: "Calories", icon: "flame.fill", color: .orange)
                NutritionItem(value: dish.protein, unit: "g", label: "Protein", icon: "p.circle.fill", color: .red)
                NutritionItem(value: dish.carbs, unit: "g", label: "Carbs", icon: "c.circle.fill", color: .blue)
                NutritionItem(value: dish.fat, unit: "g", label: "Fat", icon: "f.circle.fill", color: .yellow)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

struct NutritionItem: View {
    let value: Int?
    let unit: String
    let label: String
    var icon: String = ""
    var color: Color = .primary
    
    var body: some View {
        VStack(spacing: 6) {
            if !icon.isEmpty {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundStyle(color)
            }
            
            if let value = value {
                Text("\(value)\(unit)")
                    .font(.title3)
                    .fontWeight(.bold)
            } else {
                Text("--")
                    .font(.title3)
                    .foregroundStyle(.secondary)
            }
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

struct ReviewRow: View {
    let review: Review
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                // Avatar
                Circle()
                    .fill(LinearGradient(colors: [.green, .teal], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 40, height: 40)
                    .overlay(
                        Text(String((review.userName ?? "A").prefix(1)).uppercased())
                            .font(.headline)
                            .foregroundStyle(.white)
                    )
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(review.userName ?? "Anonymous")
                        .fontWeight(.medium)
                    
                    Text(formatDate(review.createdAt))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                // Star rating
                HStack(spacing: 2) {
                    ForEach(0..<5) { i in
                        Image(systemName: i < review.rating ? "star.fill" : "star")
                            .font(.caption)
                            .foregroundStyle(i < review.rating ? .yellow : .gray.opacity(0.3))
                    }
                }
            }
            
            if let text = review.textReview, !text.isEmpty {
                Text(text)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            
            if let dietary = review.dietaryFeedback, !dietary.isEmpty {
                Text(dietary)
                    .font(.caption)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.green.opacity(0.1))
                    .foregroundStyle(.green)
                    .clipShape(Capsule())
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
    }
    
    private func formatDate(_ dateStr: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let date = formatter.date(from: dateStr) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            return displayFormatter.string(from: date)
        }
        return dateStr
    }
}

// Add Review Sheet with Photo Support
struct AddReviewSheet: View {
    let dish: Dish
    let onSubmit: () -> Void
    
    @Environment(\.dismiss) private var dismiss
    @State private var rating = 4
    @State private var reviewText = ""
    @State private var dietaryFeedback = ""
    @State private var selectedItem: PhotosPickerItem?
    @State private var selectedImage: Image?
    @State private var isSubmitting = false
    @State private var showCamera = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Dish info header
                    HStack(spacing: 12) {
                        FoodImageView(category: dish.category ?? "General", size: 60)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(dish.name)
                                .font(.headline)
                            if let category = dish.category {
                                Text(category)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        Spacer()
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    
                    // Star Rating
                    VStack(spacing: 12) {
                        Text("How was it?")
                            .font(.headline)
                        
                        HStack(spacing: 12) {
                            ForEach(1...5, id: \.self) { star in
                                Button {
                                    withAnimation(.spring(response: 0.3)) {
                                        rating = star
                                    }
                                } label: {
                                    Image(systemName: star <= rating ? "star.fill" : "star")
                                        .font(.title)
                                        .foregroundStyle(star <= rating ? .yellow : .gray.opacity(0.3))
                                        .scaleEffect(star <= rating ? 1.1 : 1.0)
                                }
                            }
                        }
                        
                        Text(ratingLabel)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    
                    // Photo Section
                    VStack(spacing: 12) {
                        Text("Add a Photo")
                            .font(.headline)
                        
                        if let selectedImage {
                            selectedImage
                                .resizable()
                                .scaledToFill()
                                .frame(height: 200)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                                .overlay(alignment: .topTrailing) {
                                    Button {
                                        self.selectedImage = nil
                                        self.selectedItem = nil
                                    } label: {
                                        Image(systemName: "xmark.circle.fill")
                                            .font(.title2)
                                            .foregroundStyle(.white)
                                            .shadow(radius: 2)
                                    }
                                    .padding(8)
                                }
                        } else {
                            HStack(spacing: 16) {
                                PhotosPicker(selection: $selectedItem, matching: .images) {
                                    VStack(spacing: 8) {
                                        Image(systemName: "photo.on.rectangle")
                                            .font(.title)
                                        Text("Photo Library")
                                            .font(.caption)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color(.systemGray5))
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                }
                                
                                Button {
                                    showCamera = true
                                } label: {
                                    VStack(spacing: 8) {
                                        Image(systemName: "camera.fill")
                                            .font(.title)
                                        Text("Take Photo")
                                            .font(.caption)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color(.systemGray5))
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                }
                            }
                            .foregroundStyle(.primary)
                        }
                    }
                    
                    // Review Text
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Your Review")
                            .font(.headline)
                        
                        TextEditor(text: $reviewText)
                            .frame(minHeight: 100)
                            .padding(8)
                            .background(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                            )
                    }
                    
                    // Dietary Feedback
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Dietary Feedback (Optional)")
                            .font(.headline)
                        
                        TextField("e.g., Actual portion was smaller", text: $dietaryFeedback)
                            .textFieldStyle(.roundedBorder)
                    }
                }
                .padding()
            }
            .navigationTitle("Write a Review")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await submitReview() }
                    } label: {
                        if isSubmitting {
                            ProgressView()
                        } else {
                            Text("Submit")
                                .fontWeight(.semibold)
                        }
                    }
                    .disabled(isSubmitting)
                }
            }
            .onChange(of: selectedItem) { _, newItem in
                Task {
                    if let data = try? await newItem?.loadTransferable(type: Data.self),
                       let uiImage = UIImage(data: data) {
                        selectedImage = Image(uiImage: uiImage)
                    }
                }
            }
            .sheet(isPresented: $showCamera) {
                CameraView { image in
                    selectedImage = Image(uiImage: image)
                }
            }
        }
    }
    
    private var ratingLabel: String {
        switch rating {
        case 1: return "Poor"
        case 2: return "Fair"
        case 3: return "Good"
        case 4: return "Very Good"
        case 5: return "Excellent!"
        default: return ""
        }
    }
    
    private func submitReview() async {
        isSubmitting = true
        
        do {
            try await APIService.shared.submitReview(
                dishId: dish.dishId,
                rating: rating,
                text: reviewText.isEmpty ? nil : reviewText,
                dietaryFeedback: dietaryFeedback.isEmpty ? nil : dietaryFeedback
            )
            onSubmit()
            dismiss()
        } catch {
            print("Error submitting review: \(error)")
        }
        
        isSubmitting = false
    }
}

// Camera View for taking photos
struct CameraView: UIViewControllerRepresentable {
    let onCapture: (UIImage) -> Void
    @Environment(\.dismiss) private var dismiss
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraView
        
        init(_ parent: CameraView) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.onCapture(image)
            }
            parent.dismiss()
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}

// Flow Layout for tags
struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let (size, _) = computeLayout(proposal: proposal, subviews: subviews)
        return size
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let (_, frames) = computeLayout(proposal: proposal, subviews: subviews)
        
        for (index, subview) in subviews.enumerated() {
            if index < frames.count {
                subview.place(at: CGPoint(x: bounds.minX + frames[index].minX, y: bounds.minY + frames[index].minY), proposal: .unspecified)
            }
        }
    }
    
    private func computeLayout(proposal: ProposedViewSize, subviews: Subviews) -> (CGSize, [CGRect]) {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        var frames: [CGRect] = []
        
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth && x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            frames.append(CGRect(origin: CGPoint(x: x, y: y), size: size))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }
        
        return (CGSize(width: maxWidth, height: y + rowHeight), frames)
    }
}

#Preview {
    NavigationStack {
        DishDetailView(dish: Dish(
            dishId: 1,
            name: "Grilled Chicken Sandwich",
            description: "Delicious grilled chicken with fresh vegetables",
            category: "Entrees",
            dietaryTags: ["dairy", "eggs"],
            allergens: ["Wheat", "Soy"],
            nutrition: Nutrition(calories: 450, gProtein: 35, gCarbs: 32, gFat: 18, gFiber: 3, gSugar: 5, mgSodium: 890),
            ingredients: "Chicken, lettuce, tomato, bread"
        ))
    }
}
