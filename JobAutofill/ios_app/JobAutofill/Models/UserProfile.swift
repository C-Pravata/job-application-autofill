import Foundation
import SwiftUI

struct UserProfile: Identifiable, Codable {
    var id: UUID = UUID()
    var firstName: String
    var lastName: String
    var email: String
    var phone: String
    var address: String
    var city: String
    var state: String
    var zipCode: String
    var linkedInUrl: String?
    var personalWebsite: String?
    var professionalSummary: String?
    
    // Computed properties
    var fullName: String {
        return "\(firstName) \(lastName)"
    }
    
    var location: String {
        return "\(city), \(state) \(zipCode)"
    }
    
    // Default initializer
    init(
        firstName: String = "",
        lastName: String = "",
        email: String = "",
        phone: String = "",
        address: String = "",
        city: String = "",
        state: String = "",
        zipCode: String = "",
        linkedInUrl: String? = nil,
        personalWebsite: String? = nil,
        professionalSummary: String? = nil
    ) {
        self.firstName = firstName
        self.lastName = lastName
        self.email = email
        self.phone = phone
        self.address = address
        self.city = city
        self.state = state
        self.zipCode = zipCode
        self.linkedInUrl = linkedInUrl
        self.personalWebsite = personalWebsite
        self.professionalSummary = professionalSummary
    }
    
    // Completion percentage for profile
    func completionPercentage() -> Double {
        var totalFields = 8 // Required fields
        var completedFields = 0
        
        if !firstName.isEmpty { completedFields += 1 }
        if !lastName.isEmpty { completedFields += 1 }
        if !email.isEmpty { completedFields += 1 }
        if !phone.isEmpty { completedFields += 1 }
        if !address.isEmpty { completedFields += 1 }
        if !city.isEmpty { completedFields += 1 }
        if !state.isEmpty { completedFields += 1 }
        if !zipCode.isEmpty { completedFields += 1 }
        
        // Optional fields
        if linkedInUrl != nil && !linkedInUrl!.isEmpty {
            totalFields += 1
            completedFields += 1
        }
        
        if personalWebsite != nil && !personalWebsite!.isEmpty {
            totalFields += 1
            completedFields += 1
        }
        
        if professionalSummary != nil && !professionalSummary!.isEmpty {
            totalFields += 1
            completedFields += 1
        }
        
        return Double(completedFields) / Double(totalFields)
    }
    
    // Convert to dictionary for JavaScript
    func toDictionary() -> [String: String] {
        var dict: [String: String] = [
            "first_name": firstName,
            "last_name": lastName,
            "email": email,
            "phone": phone,
            "address": address,
            "city": city,
            "state": state,
            "zip": zipCode
        ]
        
        if let linkedin = linkedInUrl, !linkedin.isEmpty {
            dict["linkedin"] = linkedin
        }
        
        if let website = personalWebsite, !website.isEmpty {
            dict["website"] = website
        }
        
        if let summary = professionalSummary, !summary.isEmpty {
            dict["summary"] = summary
        }
        
        return dict
    }
}

// Sample data for previews
extension UserProfile {
    static var sampleData: UserProfile {
        UserProfile(
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phone: "555-123-4567",
            address: "123 Main St",
            city: "San Francisco",
            state: "CA",
            zipCode: "94105",
            linkedInUrl: "https://linkedin.com/in/johndoe",
            personalWebsite: "https://johndoe.com",
            professionalSummary: "Experienced software developer with a passion for creating user-friendly applications."
        )
    }
} 