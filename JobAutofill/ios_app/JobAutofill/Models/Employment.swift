import Foundation
import SwiftUI

struct Employment: Identifiable, Codable {
    var id: UUID = UUID()
    var jobTitle: String
    var company: String
    var startDate: Date
    var endDate: Date?
    var isCurrentJob: Bool
    var location: String
    var responsibilities: String
    
    // Computed properties
    var formattedStartDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: startDate)
    }
    
    var formattedEndDate: String {
        if isCurrentJob {
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
    
    // Default initializer
    init(
        id: UUID = UUID(),
        jobTitle: String = "",
        company: String = "",
        startDate: Date = Date(),
        endDate: Date? = nil,
        isCurrentJob: Bool = false,
        location: String = "",
        responsibilities: String = ""
    ) {
        self.id = id
        self.jobTitle = jobTitle
        self.company = company
        self.startDate = startDate
        self.endDate = endDate
        self.isCurrentJob = isCurrentJob
        self.location = location
        self.responsibilities = responsibilities
    }
    
    // Convert to dictionary for JavaScript
    func toDictionary() -> [String: String] {
        var dict: [String: String] = [
            "job_title": jobTitle,
            "company": company,
            "start_date": formattedStartDate,
            "location": location
        ]
        
        dict["end_date"] = formattedEndDate
        
        if !responsibilities.isEmpty {
            dict["responsibilities"] = responsibilities
        }
        
        return dict
    }
}

// Sample data for previews
extension Employment {
    static var sampleData: [Employment] {
        let calendar = Calendar.current
        let currentDate = Date()
        let twoYearsAgo = calendar.date(byAdding: .year, value: -2, to: currentDate)!
        let fourYearsAgo = calendar.date(byAdding: .year, value: -4, to: currentDate)!
        let threeYearsAgo = calendar.date(byAdding: .year, value: -3, to: twoYearsAgo)!
        
        return [
            Employment(
                jobTitle: "Senior Software Engineer",
                company: "Tech Innovations Inc.",
                startDate: twoYearsAgo,
                endDate: nil,
                isCurrentJob: true,
                location: "San Francisco, CA",
                responsibilities: "Lead development of mobile applications, mentor junior developers, implement CI/CD pipelines."
            ),
            Employment(
                jobTitle: "Software Engineer",
                company: "Digital Solutions LLC",
                startDate: fourYearsAgo,
                endDate: twoYearsAgo,
                isCurrentJob: false,
                location: "Austin, TX",
                responsibilities: "Developed web applications using React and Node.js, collaborated with design team on UI/UX improvements."
            )
        ]
    }
} 