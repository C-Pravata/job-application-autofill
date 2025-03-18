import SwiftUI
import SafariServices

struct AutofillView: View {
    @ObservedObject private var dataManager = DataManager.shared
    @State private var jobURL = ""
    @State private var showingSafariView = false
    @State private var showingExtensionInstructions = false
    @State private var recentApplications: [JobApplication] = []
    @State private var showingDeleteAlert = false
    @State private var applicationToDelete: Int?
    @State private var isExtensionEnabled = false
    @State private var isCheckingExtension = false
    @State private var showingSyncAlert = false
    @State private var syncSuccess = false
    
    var body: some View {
        VStack {
            // Extension Status Section
            extensionStatusSection
            
            // URL Input Section
            urlInputSection
            
            Divider()
                .padding(.vertical)
            
            // Recent Applications Section
            if recentApplications.isEmpty {
                emptyStateView
            } else {
                recentApplicationsSection
            }
            
            Spacer()
        }
        .padding()
        .navigationTitle("Autofill")
        .onAppear {
            loadRecentApplications()
            checkExtensionStatus()
        }
        .sheet(isPresented: $showingSafariView) {
            if let url = URL(string: jobURL) {
                SafariView(url: url)
            }
        }
        .sheet(isPresented: $showingExtensionInstructions) {
            ExtensionInstructionsView()
        }
        .alert(isPresented: $showingDeleteAlert) {
            Alert(
                title: Text("Delete Application"),
                message: Text("Are you sure you want to remove this application from your history?"),
                primaryButton: .destructive(Text("Delete")) {
                    if let index = applicationToDelete {
                        recentApplications.remove(at: index)
                        saveRecentApplications()
                    }
                },
                secondaryButton: .cancel()
            )
        }
        .alert(isPresented: $showingSyncAlert) {
            if syncSuccess {
                return Alert(
                    title: Text("Success"),
                    message: Text("Your profile data has been synced with the Safari extension."),
                    dismissButton: .default(Text("OK"))
                )
            } else {
                return Alert(
                    title: Text("Sync Failed"),
                    message: Text("Failed to sync your profile data with the Safari extension. Please make sure the extension is enabled."),
                    primaryButton: .default(Text("Enable Extension")) {
                        ExtensionManager.shared.openExtensionPreferences()
                    },
                    secondaryButton: .cancel(Text("Later"))
                )
            }
        }
    }
    
    // MARK: - Views
    
    private var extensionStatusSection: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: isExtensionEnabled ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                    .foregroundColor(isExtensionEnabled ? .green : .orange)
                    .font(.title2)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(isExtensionEnabled ? "Safari Extension Enabled" : "Safari Extension Not Enabled")
                        .font(.headline)
                    
                    Text(isExtensionEnabled ? "Your profile data is ready for autofill" : "Enable the extension to use autofill")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                if isCheckingExtension {
                    ProgressView()
                        .padding(.horizontal)
                } else {
                    Button(action: {
                        if isExtensionEnabled {
                            syncWithExtension()
                        } else {
                            ExtensionManager.shared.openExtensionPreferences()
                        }
                    }) {
                        Text(isExtensionEnabled ? "Sync Data" : "Enable")
                            .font(.subheadline)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(isExtensionEnabled ? Color.blue : Color.orange)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            
            if !isExtensionEnabled {
                Button(action: {
                    showingExtensionInstructions = true
                }) {
                    Text("How to enable Safari extension")
                        .font(.subheadline)
                        .foregroundColor(.blue)
                }
            }
        }
    }
    
    private var urlInputSection: some View {
        VStack(spacing: 16) {
            Text("Enter a job application URL to autofill")
                .font(.headline)
            
            HStack {
                TextField("https://example.com/apply", text: $jobURL)
                    .keyboardType(.URL)
                    .autocapitalization(.none)
                    .disableAutocorrection(true)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                
                Button(action: clearURL) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
                .padding(.trailing, 8)
                .opacity(jobURL.isEmpty ? 0 : 1)
            }
            .background(Color(.systemGray6))
            .cornerRadius(8)
            
            Button(action: openJobApplication) {
                HStack {
                    Image(systemName: "safari.fill")
                    Text("Open in Safari")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(8)
            }
            .disabled(jobURL.isEmpty || !isValidURL(jobURL))
        }
    }
    
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Spacer()
            
            Image(systemName: "square.and.pencil")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("No Recent Applications")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Your recent job applications will appear here.")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            Spacer()
        }
    }
    
    private var recentApplicationsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Recent Applications")
                .font(.headline)
            
            List {
                ForEach(Array(recentApplications.enumerated()), id: \.element.id) { index, application in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(application.title.isEmpty ? "Job Application" : application.title)
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        Text(application.url)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                        
                        Text("Applied on \(formattedDate(application.date))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .contentShape(Rectangle())
                    .onTapGesture {
                        jobURL = application.url
                        openJobApplication()
                    }
                    .contextMenu {
                        Button(action: {
                            jobURL = application.url
                            openJobApplication()
                        }) {
                            Label("Open in Safari", systemImage: "safari.fill")
                        }
                        
                        Button(action: {
                            applicationToDelete = index
                            showingDeleteAlert = true
                        }) {
                            Label("Delete", systemImage: "trash")
                        }
                    }
                }
                .onDelete { indexSet in
                    if let index = indexSet.first {
                        applicationToDelete = index
                        showingDeleteAlert = true
                    }
                }
            }
            .listStyle(PlainListStyle())
        }
    }
    
    // MARK: - Actions
    
    private func clearURL() {
        jobURL = ""
    }
    
    private func openJobApplication() {
        // Validate URL
        guard isValidURL(jobURL) else { return }
        
        // Add to recent applications
        let newApplication = JobApplication(
            id: UUID().uuidString,
            url: jobURL,
            title: "", // Title will be updated later
            date: Date()
        )
        
        // Check if already exists
        if !recentApplications.contains(where: { $0.url == jobURL }) {
            recentApplications.insert(newApplication, at: 0)
            saveRecentApplications()
        }
        
        // Sync with extension before opening Safari
        if isExtensionEnabled {
            syncWithExtension(showAlert: false) { success in
                // Open Safari view
                showingSafariView = true
            }
        } else {
            // Open Safari view
            showingSafariView = true
        }
    }
    
    private func checkExtensionStatus() {
        isCheckingExtension = true
        
        ExtensionManager.shared.checkExtensionStatus { isEnabled in
            isExtensionEnabled = isEnabled
            isCheckingExtension = false
            
            // If extension is enabled, sync data automatically
            if isEnabled {
                syncWithExtension(showAlert: false)
            }
        }
    }
    
    private func syncWithExtension(showAlert: Bool = true, completion: ((Bool) -> Void)? = nil) {
        ExtensionManager.shared.sendUserDataToExtension { success in
            syncSuccess = success
            
            if showAlert {
                showingSyncAlert = true
            }
            
            completion?(success)
        }
    }
    
    // MARK: - Helpers
    
    private func isValidURL(_ string: String) -> Bool {
        guard let url = URL(string: string) else { return false }
        return UIApplication.shared.canOpenURL(url)
    }
    
    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }
    
    private func loadRecentApplications() {
        // In a real app, this would load from UserDefaults or Core Data
        if let data = UserDefaults.standard.data(forKey: "recentApplications") {
            do {
                let decoder = JSONDecoder()
                recentApplications = try decoder.decode([JobApplication].self, from: data)
            } catch {
                print("Error loading recent applications: \(error)")
            }
        }
    }
    
    private func saveRecentApplications() {
        // In a real app, this would save to UserDefaults or Core Data
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(recentApplications)
            UserDefaults.standard.set(data, forKey: "recentApplications")
        } catch {
            print("Error saving recent applications: \(error)")
        }
    }
}

// MARK: - Safari View

struct SafariView: UIViewControllerRepresentable {
    let url: URL
    
    func makeUIViewController(context: Context) -> SFSafariViewController {
        let safariViewController = SFSafariViewController(url: url)
        return safariViewController
    }
    
    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}

// MARK: - Extension Instructions View

struct ExtensionInstructionsView: View {
    @Environment(\.presentationMode) private var presentationMode
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Enable Safari Extension")
                            .font(.title)
                            .fontWeight(.bold)
                        
                        Text("Follow these steps to enable the JobAutofill Safari extension")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    // Steps
                    VStack(alignment: .leading, spacing: 16) {
                        instructionStep(
                            number: 1,
                            title: "Open Settings",
                            description: "Go to your device Settings app"
                        )
                        
                        instructionStep(
                            number: 2,
                            title: "Navigate to Safari",
                            description: "Scroll down and tap on Safari in the Settings list"
                        )
                        
                        instructionStep(
                            number: 3,
                            title: "Open Extensions",
                            description: "Tap on Extensions in the Safari settings"
                        )
                        
                        instructionStep(
                            number: 4,
                            title: "Enable JobAutofill",
                            description: "Find JobAutofill in the list and toggle it on"
                        )
                        
                        instructionStep(
                            number: 5,
                            title: "Allow Permissions",
                            description: "Make sure to allow the extension to access websites when prompted"
                        )
                    }
                    
                    // Settings Button
                    Button(action: {
                        ExtensionManager.shared.openExtensionPreferences()
                    }) {
                        HStack {
                            Image(systemName: "gear")
                            Text("Open Extension Settings")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }
                    .padding(.top)
                }
                .padding()
            }
            .navigationBarItems(trailing: Button("Done") {
                presentationMode.wrappedValue.dismiss()
            })
        }
    }
    
    private func instructionStep(number: Int, title: String, description: String) -> some View {
        HStack(alignment: .top, spacing: 16) {
            ZStack {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 30, height: 30)
                
                Text("\(number)")
                    .font(.headline)
                    .foregroundColor(.white)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
    }
}

// MARK: - Job Application Model

struct JobApplication: Identifiable, Codable {
    let id: String
    let url: String
    var title: String
    let date: Date
}

// MARK: - Preview

struct AutofillView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            AutofillView()
        }
    }
} 