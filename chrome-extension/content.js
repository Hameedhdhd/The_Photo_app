/**
 * Isolated Content Script (Runs in ISOLATED world)
 * Bridge between popup.js (extension) and inject.js (main world)
 */

console.log('[KA-Sync-Bridge] Loaded in ISOLATED world');

// Inject the main world script dynamically
const s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
s.onload = function() {
  this.remove();
};
(document.head || document.documentElement).appendChild(s);

// Pending response callbacks for MAIN world replies
const pendingCallbacks = {};

// Listen for messages from MAIN world (inject.js)
window.addEventListener('message', (e) => {
  if (e.data?.source !== 'KA_INJECT') return;
  
  // Forward logs to popup
  if (e.data.action === 'KA_LOG') {
    try { chrome.runtime.sendMessage({ action: 'KA_LOG', text: e.data.text, type: e.data.type }); } catch {}
  }
  
  // Handle responses from MAIN world
  if (e.data.action === 'KA_CAPTURE_RESULT' && pendingCallbacks.CAPTURE_FORM) {
    pendingCallbacks.CAPTURE_FORM({ success: true, ...e.data.detail });
    delete pendingCallbacks.CAPTURE_FORM;
  }
  if (e.data.action === 'KA_SAVE_DRAFT_RESULT' && pendingCallbacks.SAVE_DRAFT) {
    pendingCallbacks.SAVE_DRAFT(e.data.detail);
    delete pendingCallbacks.SAVE_DRAFT;
  }
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  
  if (msg.action === 'FILL_FORM' && msg.item) {
    console.log('[KA-Bridge] FILL_FORM -> posting to MAIN world');
    sendResponse({ success: true });
    window.postMessage({ source: 'KA_BRIDGE', action: 'KA_EXECUTE_FILL', item: msg.item }, '*');
    return false;
  }

  if (msg.action === 'CAPTURE_FORM') {
    pendingCallbacks.CAPTURE_FORM = sendResponse;
    window.postMessage({ source: 'KA_BRIDGE', action: 'KA_EXECUTE_CAPTURE' }, '*');
    return true;
  }

  if (msg.action === 'SAVE_DRAFT') {
    pendingCallbacks.SAVE_DRAFT = sendResponse;
    window.postMessage({ source: 'KA_BRIDGE', action: 'KA_EXECUTE_SAVE_DRAFT' }, '*');
    return true;
  }

  return false;
});
