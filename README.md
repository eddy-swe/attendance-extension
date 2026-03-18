# Attendance Chrome Extension
- A chrome extension to automate attendance logging for students on Google Meets.(Vibe Coded)

## Features
- Automatically detects when a student joins or leaves a Google Meet.
- Logs attendance in a simple format.
- Provides a user-friendly popup for teachers to view attendance records.

## Installation
1. Clone the repository or download the ZIP file.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" using the toggle in the top right corner.
4. Click on "Load unpacked" and select the `attendance-extension` folder.
5. The extension should now be installed and ready to use.

## Usage
1. Join a Google Meet as a student. The extension will automatically log your attendance.
2. As a teacher, click on the extension icon to view the attendance records for the current Meet.

## Structure
<img src="/readme-img/chrome_extension_architecture.svg" alt="Extension Structure Diagram" />

## File Structure
attendance-extension/
├── manifest.json      ← The extension's birth certificate
├── content.js         ← The DOM spy inside Google Meet
├── popup.html         ← What the teacher sees when clicking the icon
├── popup.js           ← The logic powering the popup
└── styles.css         ← Styling for the popup

## Contributing
Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

