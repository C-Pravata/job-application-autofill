import Foundation
import SwiftUI

struct Education: Identifiable, Codable {
    var id: UUID = UUID()
    var degree: String
    var fieldOfStudy: String
    var institution: String
    var startDate: Date
    var endDate: Date?
    var isCurrentEducation: Bool
    var location: String
    var gpa: String?
    var achievements: String?
    
    // Computed properties
    var formattedStartDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: startDate)
    }
    
    var formattedEndDate: String {
        if isCurrentEducation {
            return "Present"
        }
        
        guard let endDate = endDate else {
            return "Present"
        }
        
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: endDate)
    }
    
    var duration: String {
        return "\(formattedStartDate) - \(formattedEndDate)"
    }
    
    var degreeAndField: String {
        return "\(degree) in \(fieldOfStudy)"
    }
    
    // Default initializer
    init(
        id: UUID = UUID(),
        degree: String = "",
        fieldOfStudy: String = "",
        institution: String = "",
        startDate: Date = Date(),
        endDate: Date? = nil,
        isCurrentEducation: Bool = false,
        location: String = "",
        gpa: String? = nil,
        achievements: String? = nil
    ) {
        self.id = id
        self.degree = degree
        self.fieldOfStudy = fieldOfStudy
        self.institution = institution
        self.startDate = startDate
        self.endDate = endDate
        self.isCurrentEducation = isCurrentEducation
        self.location = location
        self.gpa = gpa
        self.achievements = achievements
    }
    
    // Convert to dictionary for JavaScript
    func toDictionary() -> [String: String] {
        var dict: [String: String] = [
            "degree": degree,
            "field_of_study": fieldOfStudy,
            "institution": institution,
            "start_date": formattedStartDate,
            "end_date": formattedEndDate,
            "location": location
        ]
        
        if let gpa = gpa, !gpa.isEmpty {
            dict["gpa"] = gpa
        }
        
        if let achievements = achievements, !achievements.isEmpty {
            dict["achievements"] = achievements
        }
        
        return dict
    }
}

// Sample data for previews
extension Education {
    static var sampleData: [Education] {
        let calendar = Calendar.current
        let currentDate = Date()
        let fourYearsAgo = calendar.date(byAdding: .year, value: -4, to: currentDate)!
        let sixYearsAgo = calendar.date(byAdding: .year, value: -6, to: currentDate)!
        let twoYearsAgo = calendar.date(byAdding: .year, value: -2, to: currentDate)!
        
        return [
            Education(
                degree: "Master of Science",
                fieldOfStudy: "Computer Science",
                institution: "Stanford University",
                startDate: twoYearsAgo,
                endDate: nil,
                isCurrentEducation: true,
                location: "Stanford, CA",
                gpa: "3.9",
                achievements: "Research assistant in AI lab, Published paper on machine learning algorithms"
            ),
            Education(
                degree: "Bachelor of Science",
                fieldOfStudy: "Computer Engineering",
                institution: "University of California, Berkeley",
                startDate: sixYearsAgo,
                endDate: fourYearsAgo,
                isCurrentEducation: false,
                location: "Berkeley, CA",
                gpa: "3.8",
                achievements: "Dean's List, Senior project on IoT devices, Hackathon winner"
            )
        ]
    }
} 