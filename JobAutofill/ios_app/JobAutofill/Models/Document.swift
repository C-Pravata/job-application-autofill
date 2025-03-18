import Foundation
import SwiftUI

enum DocumentType: String, Codable {
    case resume = "Resume"
    case coverLetter = "Cover Letter"
}

struct Document: Identifiable, Codable {
    var id: UUID = UUID()
    var name: String
    var type: DocumentType
    var fileURL: URL
    var originalFilename: String
    var uploadDate: Date
    var isDefault: Bool
    
    // Computed properties
    var formattedUploadDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: uploadDate)
    }
    
    var fileExtension: String {
        return fileURL.pathExtension.lowercased()
    }
    
    var isImage: Bool {
        let imageExtensions = ["jpg", "jpeg", "png", "gif", "heic"]
        return imageExtensions.contains(fileExtension)
    }
    
    var isPDF: Bool {
        return fileExtension == "pdf"
    }
    
    var isDoc: Bool {
        let docExtensions = ["doc", "docx"]
        return docExtensions.contains(fileExtension)
    }
    
    var iconName: String {
        if isImage {
            return "photo"
        } else if isPDF {
            return "doc.text"
        } else if isDoc {
            return "doc.text"
        } else {
            return "doc"
        }
    }
    
    // Default initializer
    init(
        id: UUID = UUID(),
        name: String = "",
        type: DocumentType = .resume,
        fileURL: URL,
        originalFilename: String = "",
        uploadDate: Date = Date(),
        isDefault: Bool = false
    ) {
        self.id = id
        self.name = name
        self.type = type
        self.fileURL = fileURL
        self.originalFilename = originalFilename.isEmpty ? fileURL.lastPathComponent : originalFilename
        self.uploadDate = uploadDate
        self.isDefault = isDefault
    }
}

// Sample data for previews
extension Document {
    static var sampleData: [Document] {
        let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        
        return [
            Document(
                name: "Software Engineer Resume",
                type: .resume,
                fileURL: documentsDirectory.appendingPathComponent("resume.pdf"),
                originalFilename: "John_Doe_Resume.pdf",
                uploadDate: Date(),
                isDefault: true
            ),
            Document(
                name: "General Cover Letter",
                type: .coverLetter,
                fileURL: documentsDirectory.appendingPathComponent("cover_letter.docx"),
                originalFilename: "John_Doe_Cover_Letter.docx",
                uploadDate: Date(),
                isDefault: true
            ),
            Document(
                name: "Tech Startup Resume",
                type: .resume,
                fileURL: documentsDirectory.appendingPathComponent("startup_resume.pdf"),
                originalFilename: "John_Doe_Startup_Resume.pdf",
                uploadDate: Date().addingTimeInterval(-86400 * 7), // 7 days ago
                isDefault: false
            )
        ]
    }
} 