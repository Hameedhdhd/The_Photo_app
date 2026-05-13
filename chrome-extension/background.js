/**
 * Background Service Worker for Kleinanzeigen Sync Extension
 * Handles: Message routing between popup and content scripts,
 *          Auth state management, API communication
 */

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'GET_AUTH_TOKEN') {
    chrome.storage.local.get(['auth_session'], (result) => {
      const session = result.auth_session;
      if (session && session.access_token) {
        sendResponse({ token: session.access_token, user: session.user });
      } else {
        sendResponse({ token: null, user: null });
      }
    });
    return true; // Keep message channel open for async response
  }

  if (message.action === 'GET_SELECTED_ITEM') {
    chrome.storage.local.get(['selected_item_id'], (result) => {
      sendResponse({ item_id: result.selected_item_id || null });
    });
    return true;
  }

  if (message.action === 'FORM_FILL_COMPLETE') {
    // Content script confirms form was filled
    console.log('Form fill complete for item:', message.item_id);
    sendResponse({ ok: true });
    return true;
  }

  if (message.action === 'FORM_FILL_ERROR') {
    console.error('Form fill error:', message.error);
    sendResponse({ ok: true });
    return true;
  }

  return false;
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Kleinanzeigen Sync extension installed');
    // Clear any stale data
    chrome.storage.local.clear();
  } else if (details.reason === 'update') {
    console.log('Kleinanzeigen Sync extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Handle auth session cleanup when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  // We keep the session alive in storage so user doesn't have to re-login
  // Session expiry is handled by the popup.js isSessionExpired check
});

// Optional: Listen for tab updates to detect when user navigates to Kleinanzeigen
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('kleinanzeigen.de/p-anzeige-aufgeben')) {
    console.log('User navigated to Kleinanzeigen listing page');
    // The content script will auto-inject the sync button via manifest config
  }
});