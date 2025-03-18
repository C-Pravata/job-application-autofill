import SwiftUI

struct EmploymentFormView: View {
    @ObservedObject private var dataManager = DataManager.shared
    @Environment(\.presentationMode) private var presentationMode
    
    @State private var employment: Employment
    @State private var isCurrentJob: Bool
    @State private var startDate: Date
    @State private var endDate: Date
    
    // Form validation
    @State private var jobTitleError = ""
    @State private var companyError = ""
    @State private var locationError = ""
    
    init(employment: Employment) {
        _employment = State(initialValue: employment)
        _isCurrentJob = State(initialValue: employment.isCurrentJob)
        
        // Initialize dates
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        if let startDate = dateFormatter.date(from: employment.startDate) {
            _startDate = State(initialValue: startDate)
        } else {
            _startDate = State(initialValue: Date())
        }
        
        if let endDate = dateFormatter.date(from: employment.endDate ?? "") {
            _endDate = State(initialValue: endDate)
        } else {
            _endDate = State(initialValue: Date())
        }
    }
    
    var body: some View {
        Form {
            // Job Information Section
            Section(header: Text("Job Information")) {
                TextField("Job Title *", text: $employment.jobTitle)
                    .autocapitalization(.words)
                if !jobTitleError.isEmpty {
                    Text(jobTitleError)
                        .font(.caption)
                        .foregroundColor(.red)
                }
                
                TextField("Company *", text: $employment.company)
                    .autocapitalization(.words)
                if !companyError.isEmpty {
                    Text(companyError)
                        .font(.caption)
                        .foregroundColor(.red)
                }
                
                TextField("Location *", text: $employment.location)
                    .autocapitalization(.words)
                if !locationError.isEmpty {
                    Text(locationError)
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
            
            // Dates Section
            Section(header: Text("Dates")) {
                DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                
                Toggle("I currently work here", isOn: $isCurrentJob)
                
                if !isCurrentJob {
                    DatePicker("End Date", selection: $endDate, displayedComponents: .date)
                }
            }
            
            // Responsibilities Section
            Section(header: Text("Responsibilities")) {
                TextEditor(text: $employment.responsibilities)
                    .frame(minHeight: 100)
                
                Text("Describe your key responsibilities, achievements, and skills used in this role.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // Save Button Section
            Section {
                Button(action: saveEmployment) {
                    HStack {
                        Spacer()
                        Text("Save Employment")
                            .fontWeight(.semibold)
                        Spacer()
                    }
                }
                .disabled(!isFormValid)
            }
        }
        .onAppear {
            // Update form when view appears
            updateFormState()
        }
    }
    
    // MARK: - Actions
    
    private func saveEmployment() {
        // Validate form
        if validateForm() {
            // Update employment object with form values
            updateEmploymentFromForm()
            
            // Check if this is a new or existing employment
            if let index = dataManager.employmentHistory.firstIndex(where: { $0.id == employment.id }) {
                // Update existing employment
                dataManager.updateEmployment(employment)
            } else {
                // Add new employment
                dataManager.addEmployment(employment)
            }
            
            // Dismiss the form
            presentationMode.wrappedValue.dismiss()
        }
    }
    
    // MARK: - Form State Management
    
    private func updateFormState() {
        // Update isCurrentJob based on employment
        isCurrentJob = employment.isCurrentJob
    }
    
    private func updateEmploymentFromForm() {
        // Format dates
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        // Update employment object
        employment.startDate = dateFormatter.string(from: startDate)
        employment.isCurrentJob = isCurrentJob
        
        if isCurrentJob {
            employment.endDate = nil
        } else {
            employment.endDate = dateFormatter.string(from: endDate)
        }
    }
    
    // MARK: - Validation
    
    private func validateForm() -> Bool {
        // Reset errors
        jobTitleError = ""
        companyError = ""
        locationError = ""
        
        // Validate required fields
        if employment.jobTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            jobTitleError = "Job title is required"
        }
        
        if employment.company.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            companyError = "Company is required"
        }
        
        if employment.location.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            locationError = "Location is required"
        }
        
        // Validate dates
        if !isCurrentJob && endDate < startDate {
            // Show error for end date before start date
            locationError = "End date cannot be before start date"
        }
        
        return jobTitleError.isEmpty && companyError.isEmpty && locationError.isEmpty
    }
    
    private var isFormValid: Bool {
        !employment.jobTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !employment.company.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !employment.location.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        (isCurrentJob || endDate >= startDate)
    }
}

// MARK: - Preview

struct EmploymentFormView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            EmploymentFormView(employment: Employment.sampleData[0])
                .navigationTitle("Edit Employment")
        }
    }
} 