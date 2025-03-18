# JobAutofill iOS App

An iOS app with a Safari extension that helps users autofill job applications with their saved information.

## Features

- **Profile Management**: Store personal information, employment history, education history, and documents.
- **Safari Extension**: Automatically fill out job application forms with saved information.
- **Document Management**: Upload and manage resumes and cover letters.
- **Application Tracking**: Keep track of job applications you've filled out.

## Requirements

- Xcode 14.0 or later
- iOS 15.0 or later
- macOS 12.0 or later (for development)
- Apple Developer Account (for testing on physical devices and App Store submission)

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/yourusername/JobAutofill.git
cd JobAutofill/ios_app
```

### Open the Project in Xcode

```bash
open JobAutofill.xcodeproj
```

### Configure Development Team

1. In Xcode, select the project in the Project Navigator.
2. Select the "JobAutofill" target.
3. Go to the "Signing & Capabilities" tab.
4. Select your development team from the dropdown.
5. Repeat for the "JobAutofillExtension" target.

### Configure App Groups

To enable communication between the app and Safari extension, you need to set up App Groups:

1. In Xcode, select the project in the Project Navigator.
2. Select the "JobAutofill" target.
3. Go to the "Signing & Capabilities" tab.
4. Click the "+" button and add "App Groups".
5. Click the "+" button under App Groups and add a group identifier (e.g., "group.com.yourcompany.jobautofill").
6. Repeat for the "JobAutofillExtension" target, using the same group identifier.

### Update Bundle Identifiers

1. In the "JobAutofill" target, update the Bundle Identifier to your own (e.g., "com.yourcompany.JobAutofill").
2. In the "JobAutofillExtension" target, update the Bundle Identifier to match, with the extension suffix (e.g., "com.yourcompany.JobAutofill.JobAutofillExtension").

### Update Code References

Update the following files with your bundle identifiers:

1. `JobAutofill/Services/ExtensionManager.swift`: Update the `getExtensionBundleIdentifier()` and `getAppGroupIdentifier()` methods.
2. `JobAutofill/Services/DataManager.swift`: Update the `appGroupIdentifier` property.
3. `JobAutofillExtension/SafariWebExtensionHandler.swift`: Update the `appGroupIdentifier` variable and the logger subsystem.

## Building and Running

### Running the Main App

1. Select the "JobAutofill" scheme from the scheme selector.
2. Choose a simulator or connected device.
3. Click the Run button or press Cmd+R.

### Testing the Safari Extension

To test the Safari extension:

1. Run the main app on a device or simulator.
2. Complete your profile information in the app.
3. Enable the Safari extension:
   - On iOS: Go to Settings > Safari > Extensions > JobAutofill and toggle it on.
   - On macOS: Go to Safari > Preferences > Extensions > JobAutofill and check the box.
4. In the app, go to the Autofill tab and sync your data with the extension.
5. Open Safari and navigate to a job application website.
6. Tap the extension button in Safari to autofill the form.

## Project Structure

For a detailed overview of the project structure, see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

## Development Workflow

1. **Profile Setup**: Users set up their profile, including personal information, employment history, education history, and documents.
2. **Extension Enablement**: Users enable the Safari extension in their device settings.
3. **Autofill Usage**: Users navigate to job application websites in Safari and use the extension to autofill forms.

## Testing

### Unit Tests

Run unit tests in Xcode:

1. Select the "JobAutofill" scheme.
2. Go to Product > Test or press Cmd+U.

### UI Tests

Run UI tests in Xcode:

1. Select the "JobAutofill" scheme.
2. Go to Product > Test or press Cmd+U.

## Deployment

### App Store Submission

1. Archive the app in Xcode: Product > Archive.
2. In the Archives window, click "Distribute App".
3. Select "App Store Connect" and follow the prompts.

### TestFlight

1. Archive the app in Xcode: Product > Archive.
2. In the Archives window, click "Distribute App".
3. Select "TestFlight" and follow the prompts.

## Troubleshooting

### Safari Extension Not Working

1. Make sure the extension is enabled in Safari settings.
2. Ensure you've synced your profile data in the app's Autofill tab.
3. Check that you have the necessary permissions granted to the extension.
4. Try restarting Safari.

### App Groups Issues

If the app and extension can't communicate:

1. Verify that both targets have the same App Group identifier.
2. Make sure your Apple Developer account has App Groups capability.
3. Clean the build folder (Shift+Cmd+K) and rebuild.

## Resources

- [Safari App Extensions Documentation](https://developer.apple.com/documentation/safariservices/safari_app_extensions)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [App Groups Documentation](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_security_application-groups)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Icons provided by SF Symbols
- UI design inspired by Apple's Human Interface Guidelines 