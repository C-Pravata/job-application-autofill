# JobAutofill iOS App with Safari Extension

## Project Overview

JobAutofill will be a native iOS app that helps users store their job application information and autofill online job applications through a Safari extension. This document outlines the development plan, architecture, and implementation details.

## Components

### 1. iOS App (Main Application)

The main iOS app will provide the following functionality:

- **User Authentication**
  - Sign up/login with email or Apple ID
  - Secure credential storage
  - Profile management

- **Profile Management**
  - Personal information (name, contact, address, etc.)
  - Employment history (multiple entries)
  - Education history (multiple entries)
  - Skills and qualifications
  - References

- **Document Management**
  - Resume storage and versioning
  - Cover letter templates
  - Document preview

- **Application Tracking**
  - Job application history
  - Status tracking
  - Notes and follow-ups

- **Settings**
  - Autofill preferences
  - Notification settings
  - Data privacy controls

### 2. Safari App Extension

The Safari extension will provide the autofill functionality:

- **Form Detection**
  - Identify job application forms
  - Map form fields to user data
  - Support for common job application platforms

- **Autofill Interface**
  - Extension button in Safari toolbar
  - Field selection interface
  - Confirmation before filling

- **Data Security**
  - Secure data transfer between app and extension
  - No data stored in the extension itself
  - Privacy controls for sensitive information

## Technical Architecture

### iOS App Architecture

- **Swift UI** for the user interface
- **Core Data** for local data storage
- **CloudKit** for syncing across devices
- **Keychain** for secure credential storage
- **MVVM Architecture** (Model-View-ViewModel)

### Safari Extension Architecture

- **Safari App Extension** framework
- **JavaScript Injection** for form detection and filling
- **Shared Container** for secure data access from main app

## Development Roadmap

### Phase 1: iOS App Foundation (2-3 weeks)

1. Set up Xcode project with Swift UI
2. Implement user authentication
3. Create data models for profile information
4. Build basic UI for profile management
5. Implement local data storage with Core Data

### Phase 2: Safari Extension Development (2-3 weeks)

1. Add Safari App Extension target to project
2. Develop JavaScript for form field detection
3. Create extension UI for triggering autofill
4. Implement secure data sharing between app and extension
5. Test on sample job application forms

### Phase 3: Integration and Enhancement (2-3 weeks)

1. Connect app and extension functionality
2. Implement document management
3. Add application tracking features
4. Enhance UI/UX with animations and polish
5. Implement CloudKit for cross-device syncing

### Phase 4: Testing and Refinement (2-3 weeks)

1. Beta testing with real users
2. Performance optimization
3. Bug fixes and refinements
4. Accessibility improvements
5. Prepare for App Store submission

## Implementation Details

### Safari Extension Implementation

The Safari extension will use JavaScript injection to identify and fill form fields:

```swift
// In the Safari Extension's script.js
document.addEventListener("DOMContentLoaded", function() {
    // Notify Swift code that the page has loaded
    safari.extension.dispatchMessage("pageLoaded", {
        url: document.location.href
    });
});

// Function to be called from Swift to perform autofill
function autofillForm(userData) {
    // Map common field names to user data
    const fieldMappings = {
        // Personal information
        "first_name": ["first_name", "firstName", "first-name", "fname", "given-name"],
        "last_name": ["last_name", "lastName", "last-name", "lname", "family-name", "surname"],
        "email": ["email", "email_address", "emailAddress", "email-address"],
        // Add more mappings as needed
    };
    
    // Iterate through user data and find matching fields
    for (const [key, value] of Object.entries(userData)) {
        if (fieldMappings[key]) {
            // Try each possible field name
            fieldMappings[key].forEach(fieldName => {
                // Find input fields by name, id, or placeholder
                document.querySelectorAll(`input[name*='${fieldName}'], input[id*='${fieldName}'], input[placeholder*='${fieldName}']`).forEach(input => {
                    input.value = value;
                    // Trigger change event to notify the form
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                });
            });
        }
    }
    
    return true; // Indicate success
}
```

### Data Sharing Between App and Extension

The app and extension will share data using a shared container:

```swift
// In the main app
class DataManager {
    static let shared = DataManager()
    
    private let sharedDefaults = UserDefaults(suiteName: "group.com.yourcompany.jobautofill")
    
    func saveProfileForExtension(profile: UserProfile) {
        let encoder = JSONEncoder()
        if let encoded = try? encoder.encode(profile) {
            sharedDefaults?.set(encoded, forKey: "userProfile")
        }
    }
}

// In the Safari Extension
class ExtensionDataManager {
    static let shared = ExtensionDataManager()
    
    private let sharedDefaults = UserDefaults(suiteName: "group.com.yourcompany.jobautofill")
    
    func getUserProfile() -> UserProfile? {
        if let data = sharedDefaults?.data(forKey: "userProfile") {
            let decoder = JSONDecoder()
            if let profile = try? decoder.decode(UserProfile.self, from: data) {
                return profile
            }
        }
        return nil
    }
}
```

## App Store Considerations

1. **Privacy Policy**: Must clearly explain what data is collected and how it's used
2. **App Review Guidelines**: Ensure compliance with Apple's guidelines for extensions
3. **Data Security**: Implement proper encryption for sensitive user data
4. **Permissions**: Request only necessary permissions for the extension

## Testing Strategy

1. **Unit Testing**: Test individual components with XCTest
2. **Integration Testing**: Test app and extension communication
3. **UI Testing**: Automated UI tests with XCUITest
4. **Beta Testing**: TestFlight distribution to real users
5. **Compatibility Testing**: Test on various iOS versions and devices

## Resources and References

- [Safari App Extensions Documentation](https://developer.apple.com/documentation/safariservices/safari_app_extensions)
- [App Extensions Programming Guide](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/index.html)
- [Swift UI Documentation](https://developer.apple.com/documentation/swiftui)
- [Core Data Programming Guide](https://developer.apple.com/documentation/coredata)

## Next Steps

1. Set up Xcode development environment
2. Create a new iOS project with Safari extension target
3. Implement basic data models and UI
4. Begin developing the Safari extension functionality 