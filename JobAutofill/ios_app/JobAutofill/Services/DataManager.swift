import Foundation
import Combine

class DataManager: ObservableObject {
    // Singleton instance
    static let shared = DataManager()
    
    // Published properties for UI updates
    @Published var userProfile = UserProfile()
    @Published var employmentHistory: [Employment] = []
    @Published var educationHistory: [Education] = []
    @Published var documents: [Document] = []
    
    // App group identifier for shared container
    private let appGroupIdentifier = "group.com.yourcompany.jobautofill"
    private let sharedDefaults: UserDefaults?
    
    // Keys for UserDefaults
    private enum Keys {
        static let userProfile = "userProfile"
        static let employmentHistory = "employmentHistory"
        static let educationHistory = "educationHistory"
        static let documents = "documents"
    }
    
    // Private initializer for singleton
    private init() {
        // Initialize shared UserDefaults
        sharedDefaults = UserDefaults(suiteName: appGroupIdentifier)
        
        // Load data from UserDefaults
        loadData()
    }
    
    // MARK: - Data Loading
    
    private func loadData() {
        loadUserProfile()
        loadEmploymentHistory()
        loadEducationHistory()
        loadDocuments()
    }
    
    private func loadUserProfile() {
        guard let sharedDefaults = sharedDefaults,
              let data = sharedDefaults.data(forKey: Keys.userProfile) else {
            return
        }
        
        do {
            let decoder = JSONDecoder()
            userProfile = try decoder.decode(UserProfile.self, from: data)
        } catch {
            print("Error loading user profile: \(error)")
        }
    }
    
    private func loadEmploymentHistory() {
        guard let sharedDefaults = sharedDefaults,
              let data = sharedDefaults.data(forKey: Keys.employmentHistory) else {
            return
        }
        
        do {
            let decoder = JSONDecoder()
            employmentHistory = try decoder.decode([Employment].self, from: data)
        } catch {
            print("Error loading employment history: \(error)")
        }
    }
    
    private func loadEducationHistory() {
        guard let sharedDefaults = sharedDefaults,
              let data = sharedDefaults.data(forKey: Keys.educationHistory) else {
            return
        }
        
        do {
            let decoder = JSONDecoder()
            educationHistory = try decoder.decode([Education].self, from: data)
        } catch {
            print("Error loading education history: \(error)")
        }
    }
    
    private func loadDocuments() {
        guard let sharedDefaults = sharedDefaults,
              let data = sharedDefaults.data(forKey: Keys.documents) else {
            return
        }
        
        do {
            let decoder = JSONDecoder()
            documents = try decoder.decode([Document].self, from: data)
        } catch {
            print("Error loading documents: \(error)")
        }
    }
    
    // MARK: - Data Saving
    
    func saveUserProfile() {
        guard let sharedDefaults = sharedDefaults else { return }
        
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(userProfile)
            sharedDefaults.set(data, forKey: Keys.userProfile)
        } catch {
            print("Error saving user profile: \(error)")
        }
    }
    
    func saveEmploymentHistory() {
        guard let sharedDefaults = sharedDefaults else { return }
        
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(employmentHistory)
            sharedDefaults.set(data, forKey: Keys.employmentHistory)
        } catch {
            print("Error saving employment history: \(error)")
        }
    }
    
    func saveEducationHistory() {
        guard let sharedDefaults = sharedDefaults else { return }
        
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(educationHistory)
            sharedDefaults.set(data, forKey: Keys.educationHistory)
        } catch {
            print("Error saving education history: \(error)")
        }
    }
    
    func saveDocuments() {
        guard let sharedDefaults = sharedDefaults else { return }
        
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(documents)
            sharedDefaults.set(data, forKey: Keys.documents)
        } catch {
            print("Error saving documents: \(error)")
        }
    }
    
    // MARK: - Data Management
    
    func addEmployment(_ employment: Employment) {
        employmentHistory.append(employment)
        saveEmploymentHistory()
    }
    
    func updateEmployment(_ employment: Employment) {
        if let index = employmentHistory.firstIndex(where: { $0.id == employment.id }) {
            employmentHistory[index] = employment
            saveEmploymentHistory()
        }
    }
    
    func deleteEmployment(at index: Int) {
        employmentHistory.remove(at: index)
        saveEmploymentHistory()
    }
    
    func addEducation(_ education: Education) {
        educationHistory.append(education)
        saveEducationHistory()
    }
    
    func updateEducation(_ education: Education) {
        if let index = educationHistory.firstIndex(where: { $0.id == education.id }) {
            educationHistory[index] = education
            saveEducationHistory()
        }
    }
    
    func deleteEducation(at index: Int) {
        educationHistory.remove(at: index)
        saveEducationHistory()
    }
    
    func addDocument(_ document: Document) {
        documents.append(document)
        saveDocuments()
    }
    
    func updateDocument(_ document: Document) {
        if let index = documents.firstIndex(where: { $0.id == document.id }) {
            documents[index] = document
            saveDocuments()
        }
    }
    
    func deleteDocument(at index: Int) {
        // Delete the file
        let document = documents[index]
        do {
            try FileManager.default.removeItem(at: document.fileURL)
        } catch {
            print("Error deleting document file: \(error)")
        }
        
        // Remove from array
        documents.remove(at: index)
        saveDocuments()
    }
    
    // MARK: - Extension Data
    
    func prepareDataForExtension() -> [String: Any] {
        var data: [String: Any] = [:]
        
        // Add user profile
        data["personal"] = userProfile.toDictionary()
        
        // Add employment history
        if !employmentHistory.isEmpty {
            data["employment"] = employmentHistory.map { $0.toDictionary() }
        }
        
        // Add education history
        if !educationHistory.isEmpty {
            data["education"] = educationHistory.map { $0.toDictionary() }
        }
        
        return data
    }
} 