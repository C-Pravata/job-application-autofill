import Foundation
import SafariServices

class ExtensionManager {
    // Singleton instance
    static let shared = ExtensionManager()
    
    // Private initializer for singleton
    private init() {}
    
    // MARK: - Extension Communication
    
    /// Send user data to the Safari extension
    func sendUserDataToExtension(completion: @escaping (Bool) -> Void) {
        // Get user data from data manager
        let userData = DataManager.shared.prepareDataForExtension()
        
        // Convert to JSON
        guard let jsonData = try? JSONSerialization.data(withJSONObject: userData, options: []),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            completion(false)
            return
        }
        
        // Create message to send to extension
        let message = [
            "action": "setUserData",
            "userData": userData
        ] as [String: Any]
        
        // Send message to extension
        sendMessageToExtension(message) { success in
            completion(success)
        }
    }
    
    /// Send a message to the Safari extension
    private func sendMessageToExtension(_ message: [String: Any], completion: @escaping (Bool) -> Void) {
        // Get the Safari extension state
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: getExtensionBundleIdentifier()) { state, error in
            guard let state = state, state.isEnabled else {
                // Extension is not enabled
                completion(false)
                return
            }
            
            // Extension is enabled, store data in shared UserDefaults
            self.storeMessageInSharedDefaults(message)
            completion(true)
        }
    }
    
    /// Store message in shared UserDefaults for the extension to access
    private func storeMessageInSharedDefaults(_ message: [String: Any]) {
        guard let appGroupIdentifier = getAppGroupIdentifier(),
              let sharedDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
            return
        }
        
        // Convert message to JSON data
        if let jsonData = try? JSONSerialization.data(withJSONObject: message, options: []) {
            // Store in shared UserDefaults
            sharedDefaults.set(jsonData, forKey: "extensionMessage")
            sharedDefaults.synchronize()
        }
    }
    
    // MARK: - Extension Management
    
    /// Check if the Safari extension is enabled
    func checkExtensionStatus(completion: @escaping (Bool) -> Void) {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: getExtensionBundleIdentifier()) { state, error in
            guard let state = state else {
                completion(false)
                return
            }
            
            completion(state.isEnabled)
        }
    }
    
    /// Open Safari extension preferences
    func openExtensionPreferences() {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: getExtensionBundleIdentifier()) { error in
            if let error = error {
                print("Error opening extension preferences: \(error)")
            }
        }
    }
    
    // MARK: - Helper Methods
    
    /// Get the bundle identifier for the Safari extension
    private func getExtensionBundleIdentifier() -> String {
        // Replace with your actual extension bundle identifier
        return "com.yourcompany.JobAutofill.JobAutofillExtension"
    }
    
    /// Get the app group identifier for shared container
    private func getAppGroupIdentifier() -> String? {
        return "group.com.yourcompany.jobautofill"
    }
} 