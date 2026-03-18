// ================================================================
// content.js
// This script is injected directly into the Google Meet page.
// It can see everything on the page — all the HTML elements.
// ================================================================


/**
 * IMPORTANT NOTE FOR BEGINNERS:
 * Google Meet's HTML structure changes frequently.
 * If this script stops working, open Chrome DevTools (F12) on a Meet
 * page, open the participants panel, then right-click a participant
 * name and select "Inspect" to find the new element structure.
 */


/**
 * The main function that reads participant names from the Meet DOM.
 * It tries three different strategies, from most specific to broadest.
 * This makes the extension resilient to Google Meet's DOM changes.
 *
 * @returns {string[]} An array of participant name strings
 */
function captureParticipants() {

  // A JavaScript Set automatically removes duplicate names
  var nameSet = new Set();


  // ── Strategy 1 ──────────────────────────────────────────────
  // Google Meet shows participants in a panel with role="listitem"
  // This is a standard ARIA role — unlikely to change even when
  // Meet's CSS classes change. We look for short text inside these
  // elements, which is almost always the participant's name.
  //
  var listItems = document.querySelectorAll('[role="listitem"]');

  listItems.forEach(function(item) {

    // innerText gives us just the visible text (no hidden elements)
    var rawText = item.innerText || '';

    // Split into individual lines and clean up whitespace
    var lines = rawText
      .split('\n')
      .map(function(line) { return line.trim(); })
      .filter(function(line) {
        // Filter rules: must exist, be short enough to be a name,
        // and not be a generic UI label
        return line.length > 1
          && line.length < 80
          && !line.includes('mute')
          && !line.includes('Turn on')
          && !line.includes('mic')
          && !line.includes('camera');
      });

    // The first valid line inside a participant item is their name
    if (lines.length > 0) {
      nameSet.add(lines[0]);
    }
  });


  // ── Strategy 2 ──────────────────────────────────────────────
  // If the participant panel is not open, names still appear as
  // labels on each participant's video tile. These tiles often
  // have data attributes or aria-labels containing the name.
  //
  if (nameSet.size === 0) {

    var tiles = document.querySelectorAll(
      '[data-participant-id], [data-requested-participant-id]'
    );

    tiles.forEach(function(tile) {

      // aria-label is a built-in accessibility attribute that
      // screen readers use — often contains the full name
      var ariaLabel = tile.getAttribute('aria-label') || '';
      var titleAttr = tile.getAttribute('title') || '';

      var name = ariaLabel || titleAttr;

      // Clean up: remove "(You)" or "(Presenting)" suffixes
      name = name.replace(/\s*\(.*?\)\s*/g, '').trim();

      if (name.length > 1 && name.length < 60) {
        nameSet.add(name);
      }
    });
  }


  // ── Strategy 3 ──────────────────────────────────────────────
  // Last resort: scan video name overlays.
  // Google Meet shows a small name label on each video tile.
  // These are often inside a div near the bottom of the tile.
  //
  if (nameSet.size === 0) {

    // Look for elements that visually look like name overlays:
    // small containers positioned over video feeds
    var nameOverlays = document.querySelectorAll(
      '[data-self-name], [jsname="ZF4Lfb"], [jsname="r4nke"]'
    );

    nameOverlays.forEach(function(el) {
      var text = (el.innerText || el.textContent || '').trim();
      if (text.length > 1 && text.length < 60) {
        nameSet.add(text);
      }
    });
  }


  // Convert the Set to a plain array and return it
  return Array.from(nameSet);
}


// ================================================================
// Message Listener
// This waits for popup.js to send a "GET_PARTICIPANTS" message.
// When it arrives, we capture names and send them back.
// ================================================================

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  // Check that the message is the one we expect
  if (request.action === 'GET_PARTICIPANTS') {

    var participants = captureParticipants();

    // Send the names back to whoever asked (popup.js)
    sendResponse({
      success: true,
      participants: participants,
      timestamp: new Date().toISOString()
    });
  }

  // This line is CRITICAL for Manifest V3.
  // It tells Chrome to keep the message channel open long enough
  // for our synchronous response to go through.
  return true;
});


// Let the console know the content script has loaded
console.log('[Meet Attendance] Content script loaded and ready.');