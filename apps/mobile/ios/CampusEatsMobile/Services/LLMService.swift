// LLM Service - OpenAI Integration for Live AI Responses

import Foundation

class LLMService {
    static let shared = LLMService()
    
    // Set your OpenAI API key here or use environment variable
    private var apiKey: String {
        // You can set this in Xcode scheme environment variables
        ProcessInfo.processInfo.environment["OPENAI_API_KEY"] ?? ""
    }
    
    private let baseURL = "https://api.openai.com/v1/chat/completions"
    
    private init() {}
    
    var isConfigured: Bool {
        !apiKey.isEmpty
    }
    
    struct ChatRequest: Encodable {
        let model: String
        let messages: [Message]
        let temperature: Double
        let max_tokens: Int
        
        struct Message: Encodable {
            let role: String
            let content: String
        }
    }
    
    struct ChatResponse: Decodable {
        let choices: [Choice]
        
        struct Choice: Decodable {
            let message: MessageContent
        }
        
        struct MessageContent: Decodable {
            let content: String
        }
    }
    
    /// Generate a response using OpenAI GPT
    func generateResponse(
        userQuery: String,
        availableDishes: [Dish],
        completion: @escaping (Result<String, Error>) -> Void
    ) {
        guard isConfigured else {
            completion(.failure(LLMError.notConfigured))
            return
        }
        
        // Build dish context for the LLM
        let dishContext = availableDishes.map { dish in
            var info = "- \(dish.name)"
            if let cal = dish.nutrition?.calories { info += " (\(Int(cal)) cal" }
            if let protein = dish.nutrition?.gProtein { info += ", \(Int(protein))g protein" }
            if let carbs = dish.nutrition?.gCarbs { info += ", \(Int(carbs))g carbs" }
            info += ")"
            if let tags = dish.dietaryTags, !tags.isEmpty {
                info += " [Tags: \(tags.joined(separator: ", "))]"
            }
            return info
        }.joined(separator: "\n")
        
        let systemPrompt = """
        You are a helpful campus dining assistant called "Campus Eats AI". You help students find the perfect meal based on their preferences, dietary restrictions, and nutritional goals.
        
        Available dishes today:
        \(dishContext)
        
        Guidelines:
        - Be friendly and conversational
        - When recommending dishes, explain WHY they match the user's request
        - Include calorie and protein info when relevant
        - If someone asks for specific calories (e.g., "under 400"), ONLY recommend dishes that meet that criteria
        - Use emojis sparingly but effectively
        - Keep responses concise but helpful
        """
        
        let request = ChatRequest(
            model: "gpt-3.5-turbo",
            messages: [
                ChatRequest.Message(role: "system", content: systemPrompt),
                ChatRequest.Message(role: "user", content: userQuery)
            ],
            temperature: 0.7,
            max_tokens: 300
        )
        
        var urlRequest = URLRequest(url: URL(string: baseURL)!)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            urlRequest.httpBody = try JSONEncoder().encode(request)
        } catch {
            completion(.failure(error))
            return
        }
        
        URLSession.shared.dataTask(with: urlRequest) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(LLMError.noData))
                return
            }
            
            do {
                let response = try JSONDecoder().decode(ChatResponse.self, from: data)
                let content = response.choices.first?.message.content ?? "I couldn't generate a response."
                completion(.success(content))
            } catch {
                // Try to parse error response
                if let errorStr = String(data: data, encoding: .utf8) {
                    print("OpenAI Error: \(errorStr)")
                }
                completion(.failure(error))
            }
        }.resume()
    }
    
    enum LLMError: LocalizedError {
        case notConfigured
        case noData
        case invalidResponse
        
        var errorDescription: String? {
            switch self {
            case .notConfigured:
                return "OpenAI API key not configured. Set OPENAI_API_KEY environment variable."
            case .noData:
                return "No data received from OpenAI"
            case .invalidResponse:
                return "Invalid response from OpenAI"
            }
        }
    }
}

// MARK: - Async/Await version
extension LLMService {
    func generateResponse(userQuery: String, availableDishes: [Dish]) async throws -> String {
        try await withCheckedThrowingContinuation { continuation in
            generateResponse(userQuery: userQuery, availableDishes: availableDishes) { result in
                continuation.resume(with: result)
            }
        }
    }
}
