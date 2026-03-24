# Attendance Chrome Extension
- A chrome extension to automate attendance logging for students on Google Meets.(Vibe Coded)

## Features
- Logs attendance in a simple format.
- Automated to `Google Sheets`
- Downloadable `CSV` file 
- Provides a user-friendly popup for teachers to view attendance records.

## Installation
1. Clone the repository.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" using the toggle in the top right corner.
4. Click on "Load unpacked" and select the `attendance-extension` folder.
5. The extension should now be installed and ready to use.

### To Test (You MUST follow these steps):
1. Join a Google Meet call (you can test alone), 
2. Open the participants panel (the People icon in Meet), 
3. Then click your extension icon.
4. Click 'Capture participants from Meet'
5. Once you see all your participants, click 'Download CSV' or 'Send to Sheets'


## How it Works - the Mental Model
<img src="/readme-img/chrome_extension_architecture.svg" alt="Extension Structure Diagram" />

### The three programs are: 
- `content.js` (lives inside the Google Meet tab and can see the DOM), 
- `popup.js` (runs in the extension's popup window and is your teacher UI), and 
- `manifest.json` (the config file that wires everything together and declares permissions). 

They cannot directly call each other's functions — they talk using Chrome's messaging API, like walkie-talkies

## File Structure
attendance-extension/
- ├── manifest.json      ← The extension's birth certificate
- ├── content.js         ← The DOM spy inside Google Meet
- ├── popup.html         ← What the teacher sees when clicking the icon
- ├── popup.js           ← The logic powering the popup
- └── styles.css         ← Styling for the popup

## The Biggest Challenge - 
- Google Meet's DOM is not designed to be scraped. Google changes it regularly without warning. The selectors in content.js will likely need updating 2–3 times a year.

### Debugging:
When the extension stops finding names, the debugging process is straightforward:
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

## The biggest mental leap in this project is the message passing model. 
- You're used to calling functions directly. Here, `popup.js` and `content.js` are in completely separate environments — they can only communicate by sending serialised messages through Chrome's runtime, like two programs on different computers sending JSON to each other over a network. 
- That mental model maps directly to how microservices, REST APIs, and WebSockets work

## Contributing
Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License
This project is licensed under the MIT License.
