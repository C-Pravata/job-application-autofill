import SwiftUI

struct EducationFormView: View {
    @ObservedObject private var dataManager = DataManager.shared
    @Environment(\.presentationMode) private var presentationMode
    
    @State private var education: Education
    @State private var isCurrentEducation: Bool
    @State private var startDate: Date
    @State private var endDate: Date
    
    // Form validation
    @State private var degreeError = ""
    @State private var fieldOfStudyError = ""
    @State private var institutionError = ""
    
    init(education: Education) {
        _education = State(initialValue: education)
        _isCurrentEducation = State(initialValue: education.isCurrentEducation)
        
        // Initialize dates
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        if let startDate = dateFormatter.date(from: education.startDate) {
            _startDate = State(initialValue: startDate)
        } else {
            _startDate = State(initialValue: Date())
        }
        
        if let endDate = dateFormatter.date(from: education.endDate ?? "") {
            _endDate = State(initialValue: endDate)
        } else {
            _endDate = State(initialValue: Date())
        }
    }
    
    var body: some View {
        Form {
            // Education Information Section
            Section(header: Text("Education Information")) {
                TextField("Degree *", text: $education.degree)
                    .autocapitalization(.words)
                if !degreeError.isEmpty {
                    Text(degreeError)
                        .font(.caption)
                        .foregroundColor(.red)
                }
                
                TextField("Field of Study *", text: $education.fieldOfStudy)
                    .autocapitalization(.words)
                if !fieldOfStudyError.isEmpty {
                    Text(fieldOfStudyError)
                        .font(.caption)
                        .foregroundColor(.red)
                }
                
                TextField("Institution *", text: $education.institution)
                    .autocapitalization(.words)
                if !institutionError.isEmpty {
                    Text(institutionError)
                        .font(.caption)
                        .foregroundColor(.red)
                }
                
                TextField("Location", text: $education.location)
                    .autocapitalization(.words)
            }
            
            // Dates Section
            Section(header: Text("Dates")) {
                DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                
                Toggle("I am currently studying here", isOn: $isCurrentEducation)
                
                if !isCurrentEducation {
                    DatePicker("End Date", selection: $endDate, displayedComponents: .date)
                }
            }
            
            // Additional Information Section
            Section(header: Text("Additional Information")) {
                TextField("GPA", text: Binding(
                    get: { education.gpa ?? "" },
                    set: { education.gpa = $0.isEmpty ? nil : $0 }
                ))
                .keyboardType(.decimalPad)
                
                TextEditor(text: Binding(
                    get: { education.achievements ?? "" },
                    set: { education.achievements = $0.isEmpty ? nil : $0 }
                ))
                .frame(minHeight: 100)
                
                Text("List honors, awards, relevant coursework, or extracurricular activities.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // Save Button Section
            Section {
                Button(action: saveEducation) {
                    HStack {
                        Spacer()
                        Text("Save Education")
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
    
    private func saveEducation() {
        // Validate form
        if validateForm() {
            // Update education object with form values
            updateEducationFromForm()
            
            // Check if this is a new or existing education
            if let index = dataManager.educationHistory.firstIndex(where: { $0.id == education.id }) {
                // Update existing education
                dataManager.updateEducation(education)
            } else {
                // Add new education
                dataManager.addEducation(education)
            }
            
            // Dismiss the form
            presentationMode.wrappedValue.dismiss()
        }
    }
    
    // MARK: - Form State Management
    
    private func updateFormState() {
        // Update isCurrentEducation based on education
        isCurrentEducation = education.isCurrentEducation
    }
    
    private func updateEducationFromForm() {
        // Format dates
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        // Update education object
        education.startDate = dateFormatter.string(from: startDate)
        education.isCurrentEducation = isCurrentEducation
        
        if isCurrentEducation {
            education.endDate = nil
        } else {
            education.endDate = dateFormatter.string(from: endDate)
        }
    }
    
    // MARK: - Validation
    
    private func validateForm() -> Bool {
        // Reset errors
        degreeError = ""
        fieldOfStudyError = ""
        institutionError = ""
        
        // Validate required fields
        if education.degree.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            degreeError = "Degree is required"
        }
        
        if education.fieldOfStudy.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            fieldOfStudyError = "Field of study is required"
        }
        
        if education.institution.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            institutionError = "Institution is required"
        }
        
        // Validate dates
        if !isCurrentEducation && endDate < startDate {
            // Show error for end date before start date
            institutionError = "End date cannot be before start date"
        }
        
        return degreeError.isEmpty && fieldOfStudyError.isEmpty && institutionError.isEmpty
    }
    
    private var isFormValid: Bool {
        !education.degree.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !education.fieldOfStudy.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !education.institution.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        (isCurrentEducation || endDate >= startDate)
    }
}

// MARK: - Preview

struct EducationFormView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            EducationFormView(education: Education.sampleData[0])
                .navigationTitle("Edit Education")
        }
    }
} 