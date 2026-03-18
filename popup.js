// ================================================================
// popup.js
// Runs inside the extension popup window.
// Handles all button clicks and communicates with content.js.
// ================================================================


// ── Configuration ───────────────────────────────────────────────
// IMPORTANT: Replace this URL with your own Apps Script Web App URL.
// We will create this in Step 6 below. Leave it empty for now.
var SHEETS_WEB_APP_URL = '';


// ── Application State ────────────────────────────────────────────
// We store all our data in a simple object.
// This is the "single source of truth" for our popup.
var state = {
  participants: [],    // Array of { name: string, present: boolean }
  className:    '',    // e.g. "Math 101"
  capturedAt:   null   // JavaScript Date object of when we captured
};


// ── DOM References ────────────────────────────────────────────────
// We grab references to our HTML elements once at the top.
// Much cleaner than calling document.getElementById() everywhere.
var captureBtn    = document.getElementById('capture-btn');
var selectAllBtn  = document.getElementById('select-all-btn');
var deselectAllBtn = document.getElementById('deselect-all-btn');
var csvBtn        = document.getElementById('csv-btn');
var sheetsBtn     = document.getElementById('sheets-btn');
var classInput    = document.getElementById('class-name');
var listContainer = document.getElementById('participant-list');
var summaryEl     = document.getElementById('summary');
var subtitleEl    = document.getElementById('subtitle');
var statusDot     = document.getElementById('status-dot');


// ── Event Listeners ───────────────────────────────────────────────
// Attach a click handler to each button.

captureBtn.addEventListener('click', handleCapture);
selectAllBtn.addEventListener('click', handleSelectAll);
deselectAllBtn.addEventListener('click', handleDeselectAll);
csvBtn.addEventListener('click', handleDownloadCSV);
sheetsBtn.addEventListener('click', handleSendToSheets);


// ── Core Functions ─────────────────────────────────────────────────

/**
 * Called when the teacher clicks "Capture participants".
 * Sends a message to content.js and waits for the names back.
 */
function handleCapture() {

  setStatus('loading', 'Capturing...');
  captureBtn.textContent = 'Capturing...';
  captureBtn.disabled = true;

  // Step 1: Find the active Google Meet tab in the current window
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {

    var tab = tabs[0];

    // Safety check: are we actually on a Google Meet page?
    if (!tab || !tab.url || !tab.url.includes('meet.google.com')) {
      showError('Please open this extension while in a Google Meet session.');
      resetCaptureButton();
      return;
    }

    // Step 2: Send a message to content.js in that tab
    // content.js is listening for this exact message
    chrome.tabs.sendMessage(tab.id, { action: 'GET_PARTICIPANTS' }, function(response) {

      // Step 3: Handle the response (or handle errors)

      // chrome.runtime.lastError tells us if something went wrong
      if (chrome.runtime.lastError) {
        showError(
          'Could not connect to the Meet page. ' +
          'Try refreshing Google Meet and opening this extension again.'
        );
        resetCaptureButton();
        return;
      }

      if (!response || !response.success) {
        showError('No response from the page. Try re-opening the extension.');
        resetCaptureButton();
        return;
      }

      // Step 4: We got names back! Process them.
      var names = response.participants;

      if (names.length === 0) {
        showError(
          'No participants found. Make sure the participants panel is open in Meet ' +
          '(click the People icon in Meet first).'
        );
        resetCaptureButton();
        return;
      }

      // Store in our state object
      state.participants = names.map(function(name) {
        return { name: name, present: true };
      });
      state.capturedAt = new Date();
      state.className = classInput.value.trim() || 'Unnamed Class';

      // Update the UI
      renderParticipantList();
      updateSummary();
      setStatus('ready', 'Captured ' + names.length + ' participants');
      resetCaptureButton();
    });
  });
}


/**
 * Builds the HTML for the participant list and inserts it into the page.
 * Called every time the list needs to be refreshed.
 */
function renderParticipantList() {

  if (state.participants.length === 0) {
    listContainer.innerHTML = '<p class="empty-message">No participants captured yet.</p>';
    return;
  }

  // Build the list HTML using Array.map() — creates one item per participant
  var html = state.participants.map(function(participant, index) {

    var checkedAttr = participant.present ? 'checked' : '';
    var badgeClass  = participant.present ? 'badge-present' : 'badge-absent';
    var badgeText   = participant.present ? 'Present' : 'Absent';

    // Each row: checkbox + name + badge
    return (
      '<label class="participant-row">' +
        '<input ' +
          'type="checkbox" ' +
          checkedAttr + ' ' +
          'data-index="' + index + '" ' +
          'class="participant-checkbox"' +
        '>' +
        '<span class="participant-name">' + escapeHtml(participant.name) + '</span>' +
        '<span class="badge ' + badgeClass + '">' + badgeText + '</span>' +
      '</label>'
    );
  }).join('');

  listContainer.innerHTML = html;

  // Attach change listeners to each checkbox
  var checkboxes = listContainer.querySelectorAll('.participant-checkbox');
  checkboxes.forEach(function(checkbox) {
    checkbox.addEventListener('change', function() {
      var idx = parseInt(this.getAttribute('data-index'));
      state.participants[idx].present = this.checked;
      updateSummary();
      renderParticipantList(); // Re-render to update badges
    });
  });
}


/**
 * Marks every participant as present.
 */
function handleSelectAll() {
  state.participants.forEach(function(p) { p.present = true; });
  renderParticipantList();
  updateSummary();
}


/**
 * Marks every participant as absent.
 */
function handleDeselectAll() {
  state.participants.forEach(function(p) { p.present = false; });
  renderParticipantList();
  updateSummary();
}


/**
 * Updates the "X of Y marked present" summary line.
 */
function updateSummary() {
  var total   = state.participants.length;
  var present = state.participants.filter(function(p) { return p.present; }).length;
  summaryEl.textContent = present + ' of ' + total + ' marked present';
}


// ── Export Functions ───────────────────────────────────────────────

/**
 * Builds a CSV string from state and triggers a file download.
 * No server required — this all happens in the browser.
 */
function handleDownloadCSV() {

  if (state.participants.length === 0) {
    alert('Please capture participants first.');
    return;
  }

  var date    = formatDate(state.capturedAt || new Date());
  var time    = formatTime(state.capturedAt || new Date());

  // CSV header row
  var rows = ['Student Name,Class,Date,Time,Status'];

  // One CSV row per participant
  state.participants.forEach(function(p) {
    var status = p.present ? 'Present' : 'Absent';
    // Wrap name in quotes to handle commas in names
    rows.push(
      '"' + p.name + '",' +
      '"' + state.className + '",' +
      date + ',' +
      time + ',' +
      status
    );
  });

  var csvContent = rows.join('\n');

  // Create a temporary download link and click it programmatically
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var url  = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'attendance-' + date + '.csv');
  link.click();

  // Clean up the temporary URL
  URL.revokeObjectURL(url);
}


/**
 * Sends attendance data to your Google Apps Script Web App,
 * which then writes each row to your Google Sheet.
 */
function handleSendToSheets() {

  if (state.participants.length === 0) {
    alert('Please capture participants first.');
    return;
  }

  if (!SHEETS_WEB_APP_URL) {
    alert(
      'You need to set your Apps Script Web App URL first.\n\n' +
      'Open popup.js and paste your URL into the SHEETS_WEB_APP_URL variable at the top.'
    );
    return;
  }

  sheetsBtn.textContent = 'Sending...';
  sheetsBtn.disabled = true;

  var date = formatDate(state.capturedAt || new Date());
  var time = formatTime(state.capturedAt || new Date());

  // Build the data payload to send
  var payload = {
    className:    state.className,
    date:         date,
    time:         time,
    participants: state.participants
  };

  // fetch() is the modern way to make HTTP requests from JavaScript
  fetch(SHEETS_WEB_APP_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    if (data.success) {
      sheetsBtn.textContent = 'Sent!';
      setTimeout(function() {
        sheetsBtn.textContent = 'Send to Sheets';
        sheetsBtn.disabled = false;
      }, 2000);
    } else {
      throw new Error(data.error || 'Unknown error from Apps Script');
    }
  })
  .catch(function(error) {
    alert('Error sending to Sheets: ' + error.message);
    sheetsBtn.textContent = 'Send to Sheets';
    sheetsBtn.disabled = false;
  });
}


// ── Utility / Helper Functions ─────────────────────────────────────

function resetCaptureButton() {
  captureBtn.textContent = 'Capture participants';
  captureBtn.disabled = false;
}

function showError(message) {
  listContainer.innerHTML = '<p class="error-message">' + escapeHtml(message) + '</p>';
  setStatus('error', 'Error');
}

function setStatus(type, text) {
  subtitleEl.textContent = text;
  statusDot.className = 'status-dot status-' + type;
}

/**
 * Escapes HTML special characters to prevent XSS.
 * Always do this when inserting user/external data into HTML.
 */
function escapeHtml(text) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function formatDate(date) {
  var y = date.getFullYear();
  var m = String(date.getMonth() + 1).padStart(2, '0');
  var d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function formatTime(date) {
  var h   = date.getHours();
  var min = String(date.getMinutes()).padStart(2, '0');
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + min + ' ' + ampm;
}