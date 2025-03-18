# JobAutofill Project Structure

This document provides an overview of the JobAutofill iOS app and Safari extension project structure.

## Overview

JobAutofill is an iOS app with a Safari extension that helps users autofill job applications with their saved information. The project consists of two main components:

1. **iOS App**: The main application where users manage their profile, employment history, education history, and documents.
2. **Safari Extension**: A browser extension that autofills job application forms with the user's saved information.

## Project Organization

```
JobAutofill/
├── JobAutofill/ (Main iOS App)
│   ├── App/
│   │   └── JobAutofillApp.swift (Main app entry point)
│   ├── Models/
│   │   ├── UserProfile.swift (User personal information)
│   │   ├── Employment.swift (Employment history)
│   │   ├── Education.swift (Education history)
│   │   └── Document.swift (Resume and cover letter documents)
│   ├── Views/
│   │   ├── ContentView.swift (Main tab view)
│   │   ├── DashboardView.swift (Overview dashboard)
│   │   ├── ProfileView.swift (Personal information form)
│   │   ├── EmploymentListView.swift (Employment history list)
│   │   ├── EmploymentFormView.swift (Add/edit employment)
│   │   ├── EducationListView.swift (Education history list)
│   │   ├── EducationFormView.swift (Add/edit education)
│   │   ├── DocumentsView.swift (Document management)
│   │   └── AutofillView.swift (Autofill functionality)
│   ├── Services/
│   │   ├── DataManager.swift (Data persistence and sharing)
│   │   └── ExtensionManager.swift (Safari extension communication)
│   └── Resources/
│       ├── Assets.xcassets (Images and colors)
│       └── Info.plist (App configuration)
│
└── JobAutofillExtension/ (Safari Extension)
    ├── SafariWebExtensionHandler.swift (Native extension handler)
    └── Resources/
        ├── background.js (Extension background script)
        ├── content.js (Form detection and autofill script)
        ├── manifest.json (Extension configuration)
        └── images/ (Extension icons)
```

## Key Components

### Models

- **UserProfile**: Stores personal information like name, contact details, and address.
- **Employment**: Represents work experience entries with job title, company, dates, and responsibilities.
- **Education**: Represents education history with degree, institution, dates, and achievements.
- **Document**: Manages uploaded documents like resumes and cover letters.

### Views

- **ContentView**: Main tab-based navigation interface.
- **DashboardView**: Overview of profile completion and quick actions.
- **ProfileView**: Form for editing personal information.
- **EmploymentListView/EmploymentFormView**: List and form for managing employment history.
- **EducationListView/EducationFormView**: List and form for managing education history.
- **DocumentsView**: Interface for managing uploaded documents.
- **AutofillView**: Interface for using the autofill functionality with Safari.

### Services

- **DataManager**: Handles data persistence and sharing between app and extension.
- **ExtensionManager**: Manages communication with the Safari extension.

### Safari Extension

- **SafariWebExtensionHandler.swift**: Native code that handles communication between the app and extension.
- **background.js**: Background script that runs in the Safari extension context.
- **content.js**: Content script that detects and fills form fields on job application websites.
- **manifest.json**: Configuration file for the Safari extension.

## Data Flow

1. User enters their information in the iOS app.
2. Data is stored using the DataManager service.
3. When the user wants to autofill a job application:
   - The app syncs data with the Safari extension using ExtensionManager.
   - The user opens the job application website in Safari.
   - The Safari extension's content script detects form fields and fills them with the user's information.

## Shared Data

The app and extension share data using a shared container accessed through App Groups. The DataManager prepares the data in a format suitable for the extension, and the ExtensionManager handles the communication between the two components.

## Development Notes

- The app uses SwiftUI for the user interface.
- Data persistence is handled through UserDefaults with a shared container.
- The Safari extension uses JavaScript to detect and fill form fields.
- Communication between the app and extension is handled through a combination of shared UserDefaults and the Safari extension messaging API. 