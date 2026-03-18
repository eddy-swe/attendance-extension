# Attendance Chrome Extension
- A chrome extension to automate attendance logging for students on Google Meets.(Vibe Coded)

## Features
- Automatically detects when a student joins or leaves a Google Meet.
- Logs attendance in a simple format.
- Provides a user-friendly popup for teachers to view attendance records.

## Installation
1. Clone the repository.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" using the toggle in the top right corner.
4. Click on "Load unpacked" and select the `attendance-extension` folder.
5. The extension should now be installed and ready to use.

### To Test (You MUST follow these steps):
- join a Google Meet call (you can test alone), open the participants panel (the People icon in Meet), then click your extension icon.

## Usage
1. Join a Google Meet as a student. The extension will automatically log your attendance.
2. As a teacher, click on the extension icon to view the attendance records for the current Meet.

## Structure
<img src="/readme-img/chrome_extension_architecture.svg" alt="Extension Structure Diagram" />

## File Structure
attendance-extension/
- ├── manifest.json      ← The extension's birth certificate
- ├── content.js         ← The DOM spy inside Google Meet
- ├── popup.html         ← What the teacher sees when clicking the icon
- ├── popup.js           ← The logic powering the popup
- └── styles.css         ← Styling for the popup

## Debugging
- Google Meet's DOM is not designed to be scraped. Google changes it regularly without warning. The selectors in content.js will likely need updating 2–3 times a year.

- When the extension stops finding names, the debugging process is straightforward:

1. Join a Google Meet, open the participants panel
2. Press `F12` to open Chrome DevTools
3. Click the cursor/inspector icon and click on a participant's name in the panel
4. DevTools will highlight the exact HTML element
5. Look at its parent elements for any stable attributes (`role, data-*, aria-*`)
6. Update the `querySelectorAll()` selectors in `content.js` accordingly

## Key Concepts in this Project
| Concept | Where it appears | Message |
|---------|------------------|---------|
| Message passing | `chrome.tabs.sendMessage()` ↔ `chrome.runtime.onMessage` | Programs talking to each other |
| Callbacks | The function inside `chrome.tabs.query(tabs, function(tabs){...})` | - |
| Promises / .then() | The `fetch()` chain in `handleSendToSheets` | - |
| DOM querying | `document.querySelectorAll()` with CSS selectors | - |
| State management | The state object in `popup.js` | All data in one place |
| JSON | Data format for messages between popup and Apps Script | - |
| Set data structure | `new Set()` | Automatic deduplication of names |
| XSS prevention | `escapeHtml()` | Never insert external data into HTML directly |
| Blob / URL API | Creating a CSV download without any server | - |

- The biggest mental leap in this project is the message passing model. You're used to calling functions directly. 
- Here, popup.js and content.js are in completely separate environments — they can only communicate by sending serialised messages through Chrome's runtime, like two programs on different computers sending JSON to each other over a network. 
-- That mental model maps directly to how microservices, REST APIs, and WebSockets work
## Contributing
Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

