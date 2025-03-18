import SwiftUI

struct ProfileView: View {
    @ObservedObject private var dataManager = DataManager.shared
    @State private var profile: UserProfile
    @State private var showingSaveAlert = false
    
    // Form validation
    @State private var firstNameError = ""
    @State private var lastNameError = ""
    @State private var emailError = ""
    
    init() {
        // Initialize state with current profile
        _profile = State(initialValue: DataManager.shared.userProfile)
    }
    
    var body: some View {
        Form {
            // Basic Information Section
            Section(header: Text("Basic Information")) {
                TextField("First Name *", text: $profile.firstName)
                    .autocapitalization(.words)
                if !firstNameError.isEmpty {
                    Text(firstNameError)
                        .font(.caption)
                        .foregroundColor(.red)
                }
                
                TextField("Last Name *", text: $profile.lastName)
                    .autocapitalization(.words)
                if !lastNameError.isEmpty {
                    Text(lastNameError)
                        .font(.caption)
                        .foregroundColor(.red)
                }
                
                TextField("Email *", text: $profile.email)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                if !emailError.isEmpty {
                    Text(emailError)
                        .font(.caption)
                        .foregroundColor(.red)
                }
                
                TextField("Phone", text: $profile.phone)
                    .keyboardType(.phonePad)
            }
            
            // Address Section
            Section(header: Text("Address")) {
                TextField("Street Address", text: $profile.address)
                    .autocapitalization(.words)
                
                TextField("City", text: $profile.city)
                    .autocapitalization(.words)
                
                TextField("State/Province", text: $profile.state)
                    .autocapitalization(.words)
                
                TextField("ZIP/Postal Code", text: $profile.zipCode)
                    .keyboardType(.numbersAndPunctuation)
            }
            
            // Online Presence Section
            Section(header: Text("Online Presence")) {
                TextField("LinkedIn URL", text: Binding(
                    get: { profile.linkedInUrl ?? "" },
                    set: { profile.linkedInUrl = $0.isEmpty ? nil : $0 }
                ))
                .keyboardType(.URL)
                .autocapitalization(.none)
                
                TextField("Personal Website", text: Binding(
                    get: { profile.personalWebsite ?? "" },
                    set: { profile.personalWebsite = $0.isEmpty ? nil : $0 }
                ))
                .keyboardType(.URL)
                .autocapitalization(.none)
            }
            
            // Professional Summary Section
            Section(header: Text("Professional Summary")) {
                TextEditor(text: Binding(
                    get: { profile.professionalSummary ?? "" },
                    set: { profile.professionalSummary = $0.isEmpty ? nil : $0 }
                ))
                .frame(minHeight: 100)
            }
            
            // Save Button Section
            Section {
                Button(action: saveProfile) {
                    HStack {
                        Spacer()
                        Text("Save Profile")
                            .fontWeight(.semibold)
                        Spacer()
                    }
                }
                .disabled(!isFormValid)
            }
        }
        .navigationTitle("Profile")
        .alert(isPresented: $showingSaveAlert) {
            Alert(
                title: Text("Profile Saved"),
                message: Text("Your profile information has been updated."),
                dismissButton: .default(Text("OK"))
            )
        }
    }
    
    // MARK: - Actions
    
    private func saveProfile() {
        // Validate form
        if validateForm() {
            // Update data manager
            dataManager.userProfile = profile
            dataManager.saveUserProfile()
            
            // Show confirmation
            showingSaveAlert = true
        }
    }
    
    // MARK: - Validation
    
    private func validateForm() -> Bool {
        // Reset errors
        firstNameError = ""
        lastNameError = ""
        emailError = ""
        
        // Validate required fields
        if profile.firstName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            firstNameError = "First name is required"
        }
        
        if profile.lastName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            lastNameError = "Last name is required"
        }
        
        if profile.email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            emailError = "Email is required"
        } else if !isValidEmail(profile.email) {
            emailError = "Please enter a valid email address"
        }
        
        return firstNameError.isEmpty && lastNameError.isEmpty && emailError.isEmpty
    }
    
    private func isValidEmail(_ email: String) -> Bool {
        let emailRegEx = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPred = NSPredicate(format:"SELF MATCHES %@", emailRegEx)
        return emailPred.evaluate(with: email)
    }
    
    private var isFormValid: Bool {
        !profile.firstName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !profile.lastName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !profile.email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        isValidEmail(profile.email)
    }
}

// MARK: - Preview
struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            ProfileView()
        }
    }
} 