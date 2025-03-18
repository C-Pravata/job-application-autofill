import SwiftUI

struct DashboardView: View {
    @ObservedObject private var dataManager = DataManager.shared
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Welcome section
                welcomeSection
                
                // Profile completion section
                profileCompletionSection
                
                // Document status section
                documentStatusSection
                
                // Quick actions section
                quickActionsSection
                
                // Extension status section
                extensionStatusSection
            }
            .padding()
        }
    }
    
    // MARK: - Welcome Section
    private var welcomeSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Welcome, \(dataManager.userProfile.firstName.isEmpty ? "User" : dataManager.userProfile.firstName)")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Let's make your job applications easier")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
    
    // MARK: - Profile Completion Section
    private var profileCompletionSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Profile Completion")
                    .font(.headline)
                
                Spacer()
                
                NavigationLink(destination: ProfileView()) {
                    Text("Edit")
                        .font(.subheadline)
                        .foregroundColor(.blue)
                }
            }
            
            HStack(spacing: 15) {
                // Circular progress indicator
                ZStack {
                    Circle()
                        .stroke(lineWidth: 10)
                        .opacity(0.3)
                        .foregroundColor(.blue)
                    
                    Circle()
                        .trim(from: 0.0, to: CGFloat(profileCompletionPercentage) / 100)
                        .stroke(style: StrokeStyle(lineWidth: 10, lineCap: .round, lineJoin: .round))
                        .foregroundColor(.blue)
                        .rotationEffect(Angle(degrees: 270.0))
                    
                    VStack {
                        Text("\(Int(profileCompletionPercentage))%")
                            .font(.title)
                            .fontWeight(.bold)
                        
                        Text("Complete")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .frame(width: 100, height: 100)
                
                // Section status
                VStack(alignment: .leading, spacing: 8) {
                    SectionStatusRow(
                        title: "Personal Info",
                        isComplete: !dataManager.userProfile.firstName.isEmpty && !dataManager.userProfile.lastName.isEmpty
                    )
                    
                    SectionStatusRow(
                        title: "Employment",
                        isComplete: !dataManager.employmentHistory.isEmpty
                    )
                    
                    SectionStatusRow(
                        title: "Education",
                        isComplete: !dataManager.educationHistory.isEmpty
                    )
                    
                    SectionStatusRow(
                        title: "Documents",
                        isComplete: dataManager.documents.contains(where: { $0.type == "resume" })
                    )
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    // MARK: - Document Status Section
    private var documentStatusSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Documents")
                    .font(.headline)
                
                Spacer()
                
                NavigationLink(destination: DocumentsView()) {
                    Text("Manage")
                        .font(.subheadline)
                        .foregroundColor(.blue)
                }
            }
            
            VStack(spacing: 12) {
                DocumentStatusRow(
                    title: "Resume",
                    isUploaded: dataManager.documents.contains(where: { $0.type == "resume" }),
                    documentName: dataManager.documents.first(where: { $0.type == "resume" })?.name ?? "Not uploaded"
                )
                
                DocumentStatusRow(
                    title: "Cover Letter",
                    isUploaded: dataManager.documents.contains(where: { $0.type == "coverLetter" }),
                    documentName: dataManager.documents.first(where: { $0.type == "coverLetter" })?.name ?? "Not uploaded"
                )
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    // MARK: - Quick Actions Section
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)
            
            HStack(spacing: 15) {
                QuickActionButton(
                    title: "Edit Profile",
                    systemImage: "person.fill",
                    color: .blue,
                    destination: AnyView(ProfileView())
                )
                
                QuickActionButton(
                    title: "Add Job",
                    systemImage: "briefcase.fill",
                    color: .green,
                    destination: AnyView(EmploymentListView())
                )
                
                QuickActionButton(
                    title: "Upload Resume",
                    systemImage: "doc.fill",
                    color: .orange,
                    destination: AnyView(DocumentsView())
                )
                
                QuickActionButton(
                    title: "Autofill",
                    systemImage: "square.and.pencil",
                    color: .purple,
                    destination: AnyView(AutofillView())
                )
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    // MARK: - Extension Status Section
    private var extensionStatusSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Safari Extension")
                .font(.headline)
            
            HStack(spacing: 20) {
                Image(systemName: "safari.fill")
                    .font(.largeTitle)
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Enable Safari Extension")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                    Text("Go to Settings > Safari > Extensions to enable JobAutofill")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Button(action: {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }) {
                    Text("Settings")
                        .font(.subheadline)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    // MARK: - Computed Properties
    private var profileCompletionPercentage: Double {
        var totalSections = 4
        var completedSections = 0
        
        // Personal info
        if !dataManager.userProfile.firstName.isEmpty && !dataManager.userProfile.lastName.isEmpty {
            completedSections += 1
        }
        
        // Employment
        if !dataManager.employmentHistory.isEmpty {
            completedSections += 1
        }
        
        // Education
        if !dataManager.educationHistory.isEmpty {
            completedSections += 1
        }
        
        // Documents
        if dataManager.documents.contains(where: { $0.type == "resume" }) {
            completedSections += 1
        }
        
        return Double(completedSections) / Double(totalSections) * 100.0
    }
}

// MARK: - Supporting Views
struct SectionStatusRow: View {
    let title: String
    let isComplete: Bool
    
    var body: some View {
        HStack {
            Image(systemName: isComplete ? "checkmark.circle.fill" : "circle")
                .foregroundColor(isComplete ? .green : .gray)
            
            Text(title)
                .font(.subheadline)
            
            Spacer()
            
            Text(isComplete ? "Complete" : "Incomplete")
                .font(.caption)
                .foregroundColor(isComplete ? .green : .gray)
        }
    }
}

struct DocumentStatusRow: View {
    let title: String
    let isUploaded: Bool
    let documentName: String
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                
                Text(documentName)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Image(systemName: isUploaded ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundColor(isUploaded ? .green : .red)
        }
    }
}

struct QuickActionButton: View {
    let title: String
    let systemImage: String
    let color: Color
    let destination: AnyView
    
    var body: some View {
        NavigationLink(destination: destination) {
            VStack {
                Image(systemName: systemImage)
                    .font(.title)
                    .foregroundColor(color)
                    .frame(width: 50, height: 50)
                    .background(color.opacity(0.2))
                    .cornerRadius(10)
                
                Text(title)
                    .font(.caption)
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
        }
    }
}

// MARK: - Preview
struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            DashboardView()
                .navigationTitle("Dashboard")
        }
    }
} 