# Job Application Autofill Chrome Extension

A Chrome extension that automatically fills out job applications with your saved information.

## Project Structure

```
JobAutofill/
├── chrome_extension/        # Chrome extension files
│   ├── manifest.json       # Extension manifest
│   ├── icons/             # Extension icons
│   └── src/
│       ├── content/       # Content scripts
│       ├── background/    # Background scripts
│       └── popup/        # Popup UI files
└── web_prototype/         # Web dashboard (Flask app)
```

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd JobAutofill
```

2. **Load the Chrome Extension**
- Open Chrome and go to `chrome://extensions/`
- Enable "Developer mode" in the top right
- Click "Load unpacked" and select the `JobAutofill/chrome_extension` directory

3. **Start the Web Dashboard**
```bash
cd web_prototype
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## Usage

1. **First Time Setup**
- The extension will automatically open the onboarding page
- Create an account or log in
- Fill out your profile information in the dashboard

2. **Using the Extension**
- Visit any job application page
- A green "Autofill Application" button will appear if a form is detected
- Click the button to automatically fill the form
- Fields will be highlighted as they're filled

3. **Quick Access**
- Click the extension icon to:
  - Open the login page if you're not logged in
  - Open the dashboard if you're already logged in

## Features

- Automatic job application form detection
- One-click autofill functionality
- Visual feedback for filled fields
- Support for common job application fields
- Profile management through web dashboard
- Secure data storage
- Cross-site form filling support

## Development

To modify the extension:
1. Make changes to files in the `chrome_extension` directory
2. Reload the extension in Chrome
3. Test your changes on job application sites

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or feedback, please open an issue on the repository. 