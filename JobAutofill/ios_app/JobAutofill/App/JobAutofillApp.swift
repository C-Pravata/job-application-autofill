import SwiftUI

@main
struct JobAutofillApp: App {
    // Initialize data manager
    @StateObject private var dataManager = DataManager.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onAppear {
                    // Perform any app startup tasks here
                    setupInitialData()
                }
        }
    }
    
    // Setup initial sample data for preview/demo purposes
    private func setupInitialData() {
        // Check if this is the first launch
        let isFirstLaunch = UserDefaults.standard.bool(forKey: "hasLaunchedBefore") == false
        
        if isFirstLaunch {
            // Set first launch flag
            UserDefaults.standard.set(true, forKey: "hasLaunchedBefore")
            
            // Load sample data for demo purposes
            loadSampleData()
        }
    }
    
    private func loadSampleData() {
        // Only load sample data if the current data is empty
        
        // Sample user profile
        if dataManager.userProfile.firstName.isEmpty {
            dataManager.userProfile = UserProfile.sampleData
            dataManager.saveUserProfile()
        }
        
        // Sample employment history
        if dataManager.employmentHistory.isEmpty {
            dataManager.employmentHistory = Employment.sampleData
            dataManager.saveEmploymentHistory()
        }
        
        // Sample education history
        if dataManager.educationHistory.isEmpty {
            dataManager.educationHistory = Education.sampleData
            dataManager.saveEducationHistory()
        }
        
        // Note: We don't load sample documents since they require actual files
    }
} 