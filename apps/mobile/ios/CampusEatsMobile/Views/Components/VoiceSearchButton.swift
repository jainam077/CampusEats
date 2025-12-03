// Voice Search View - Speech recognition for dish search

import SwiftUI
import Speech
import AVFoundation

class SpeechRecognizer: ObservableObject {
    @Published var transcript = ""
    @Published var isRecording = false
    @Published var errorMessage: String?
    @Published var isAuthorized = false
    
    private var audioEngine = AVAudioEngine()
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    
    func requestAuthorization() {
        SFSpeechRecognizer.requestAuthorization { status in
            DispatchQueue.main.async {
                switch status {
                case .authorized:
                    self.isAuthorized = true
                case .denied, .restricted, .notDetermined:
                    self.isAuthorized = false
                    self.errorMessage = "Speech recognition not authorized"
                @unknown default:
                    self.isAuthorized = false
                }
            }
        }
    }
    
    func startRecording() {
        guard !isRecording else { return }
        
        // Reset
        transcript = ""
        errorMessage = nil
        
        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            errorMessage = "Failed to configure audio session"
            return
        }
        
        // Create recognition request
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else {
            errorMessage = "Failed to create recognition request"
            return
        }
        recognitionRequest.shouldReportPartialResults = true
        
        // Start recognition task
        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { result, error in
            if let result = result {
                DispatchQueue.main.async {
                    self.transcript = result.bestTranscription.formattedString
                }
            }
            
            if error != nil || (result?.isFinal ?? false) {
                self.stopRecording()
            }
        }
        
        // Configure audio engine
        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            self.recognitionRequest?.append(buffer)
        }
        
        // Start audio engine
        audioEngine.prepare()
        do {
            try audioEngine.start()
            isRecording = true
        } catch {
            errorMessage = "Failed to start audio engine"
        }
    }
    
    func stopRecording() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel()
        recognitionTask = nil
        
        DispatchQueue.main.async {
            self.isRecording = false
        }
    }
}

struct VoiceSearchButton: View {
    @StateObject private var speechRecognizer = SpeechRecognizer()
    @Binding var searchText: String
    @State private var showVoiceSheet = false
    @State private var pulseAnimation = false
    
    var body: some View {
        Button {
            showVoiceSheet = true
        } label: {
            Image(systemName: "mic.fill")
                .font(.system(size: 18))
                .foregroundColor(.orange)
        }
        .sheet(isPresented: $showVoiceSheet) {
            VoiceSearchSheet(
                speechRecognizer: speechRecognizer,
                searchText: $searchText,
                isPresented: $showVoiceSheet
            )
            .presentationDetents([.medium])
            .presentationDragIndicator(.visible)
        }
        .onAppear {
            speechRecognizer.requestAuthorization()
        }
    }
}

struct VoiceSearchSheet: View {
    @ObservedObject var speechRecognizer: SpeechRecognizer
    @Binding var searchText: String
    @Binding var isPresented: Bool
    @State private var pulseScale: CGFloat = 1.0
    
    var body: some View {
        VStack(spacing: 24) {
            // Title
            Text("Voice Search")
                .font(.title2)
                .fontWeight(.bold)
            
            // Microphone button
            ZStack {
                // Pulse animation
                if speechRecognizer.isRecording {
                    Circle()
                        .fill(Color.red.opacity(0.2))
                        .frame(width: 120, height: 120)
                        .scaleEffect(pulseScale)
                        .onAppear {
                            withAnimation(.easeInOut(duration: 1).repeatForever(autoreverses: true)) {
                                pulseScale = 1.3
                            }
                        }
                }
                
                // Mic button
                Button {
                    if speechRecognizer.isRecording {
                        speechRecognizer.stopRecording()
                        if !speechRecognizer.transcript.isEmpty {
                            searchText = speechRecognizer.transcript
                            isPresented = false
                        }
                    } else {
                        speechRecognizer.startRecording()
                    }
                } label: {
                    Circle()
                        .fill(speechRecognizer.isRecording ? Color.red : Color.orange)
                        .frame(width: 100, height: 100)
                        .overlay {
                            Image(systemName: speechRecognizer.isRecording ? "stop.fill" : "mic.fill")
                                .font(.system(size: 40))
                                .foregroundColor(.white)
                        }
                        .shadow(color: (speechRecognizer.isRecording ? Color.red : Color.orange).opacity(0.4),
                               radius: 10, x: 0, y: 5)
                }
            }
            
            // Status text
            Text(speechRecognizer.isRecording ? "Listening..." : "Tap to speak")
                .font(.headline)
                .foregroundColor(.secondary)
            
            // Transcript
            if !speechRecognizer.transcript.isEmpty {
                VStack(spacing: 8) {
                    Text("I heard:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text(speechRecognizer.transcript)
                        .font(.title3)
                        .fontWeight(.medium)
                        .multilineTextAlignment(.center)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                }
                .padding(.horizontal)
            }
            
            // Error message
            if let error = speechRecognizer.errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
            }
            
            // Not authorized message
            if !speechRecognizer.isAuthorized {
                VStack(spacing: 8) {
                    Image(systemName: "mic.slash.fill")
                        .font(.largeTitle)
                        .foregroundColor(.gray)
                    
                    Text("Microphone access required")
                        .font(.headline)
                    
                    Text("Enable microphone access in Settings to use voice search")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    
                    Button("Open Settings") {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.orange)
                }
                .padding()
            }
            
            // Example queries
            VStack(alignment: .leading, spacing: 8) {
                Text("Try saying:")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                HStack(spacing: 8) {
                    ExampleQueryPill(text: "\"chicken bowl\"")
                    ExampleQueryPill(text: "\"vegan pizza\"")
                    ExampleQueryPill(text: "\"high protein\"")
                }
            }
            .padding(.top)
            
            Spacer()
        }
        .padding(.top, 24)
        .onDisappear {
            if speechRecognizer.isRecording {
                speechRecognizer.stopRecording()
            }
        }
    }
}

struct ExampleQueryPill: View {
    let text: String
    
    var body: some View {
        Text(text)
            .font(.caption)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color(.systemGray6))
            .cornerRadius(12)
    }
}

#Preview {
    VStack {
        VoiceSearchButton(searchText: .constant(""))
    }
}
