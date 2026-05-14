/**
 * Background Service Worker for Kleinanzeigen Sync Extension
 * Handles: Message routing between popup and content scripts,
 *          Auth state management, API communication
 */

// Batch state
let batchQueue = [];
let batchResults = { success: 0, failed: 0 };
let isBatchProcessing = false;

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

  // Batch listing: start processing queue
  if (message.action === 'START_BATCH') {
    batchQueue = [...message.items];
    batchResults = { success: 0, failed: 0 };
    isBatchProcessing = true;
    processBatchQueue(message.token, message.apiUrl);
    sendResponse({ started: true, count: batchQueue.length });
    return true;
  }

  // Stop batch processing
  if (message.action === 'STOP_BATCH') {
    console.log('[Batch] Stop requested');
    isBatchProcessing = false;
    batchQueue = [];
    sendResponse({ stopped: true });
    return true;
  }

  // Content script reports fill complete (for batch flow)
  if (message.action === 'FILL_AND_SAVE_COMPLETE') {
    console.log('[Batch] Fill + save complete for item:', message.item_id);
    // This is handled via tab callbacks in processBatchQueue
    sendResponse({ ok: true });
    return true;
  }

  // Fetch image on behalf of content script (avoids CORS issues)
  if (message.action === 'FETCH_IMAGE' && message.url) {
    (async () => {
      try {
        const response = await fetch(message.url);
        if (!response.ok) {
          sendResponse({ success: false, error: `HTTP ${response.status}` });
          return;
        }
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        // Fast chunked conversion to base64
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        const base64 = btoa(binary);
        const dataUrl = `data:${blob.type || 'image/jpeg'};base64,${base64}`;
        sendResponse({ success: true, data: dataUrl });
      } catch (e) {
        console.error('Background fetch image error:', e);
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true; // Keep message channel open for async response
  }

  return false;
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Kleinanzeigen Sync extension installed');
    // Only clear auth, keep drafts
    chrome.storage.local.remove(['auth_session']);
  } else if (details.reason === 'update') {
    console.log('Kleinanzeigen Sync extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Handle auth session cleanup when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  // We keep the session alive in storage so user doesn't have to re-login
  // Session expiry is handled by the popup.js isSessionExpired check
});

// ============================================================
// Batch Processing - Opens tabs, fills forms, saves drafts sequentially
// ============================================================

function randomDelay(min, max) {
  return new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));
}

async function processBatchQueue(token, apiUrl) {
  const totalItems = batchQueue.length;
  let currentItem = 0;

  // Send initial progress
  sendBatchProgress('batch-start', 0, totalItems, 'Starting batch listing...');

  while (batchQueue.length > 0 && isBatchProcessing) {
    const item = batchQueue.shift();
    currentItem++;
    const itemTitle = item.title || 'Unknown';

    sendBatchProgress('batch-item', currentItem, totalItems, `Filling ${currentItem}/${totalItems}: ${itemTitle.substring(0, 30)}...`);

    try {
      // 1. Fetch full item data from API
      const fullItem = await fetchItemData(item.item_id, token, apiUrl);
      if (!fullItem) {
        console.warn(`[Batch] Could not fetch item ${item.item_id}, skipping`);
        batchResults.failed++;
        continue;
      }

      // 1b. Fetch images as base64
      let urls = [];
      if (fullItem.image_urls && Array.isArray(fullItem.image_urls)) urls.push(...fullItem.image_urls);
      if (fullItem.image_url) urls.push(fullItem.image_url);
      const uniqueUrls = [...new Set(urls)].filter(u => u && u.length > 0);
      
      const imageBlobs = [];
      for (const url of uniqueUrls) {
        try {
          const imgResp = await fetch(url);
          if (imgResp.ok) {
            const blob = await imgResp.blob();
            const ab = await blob.arrayBuffer();
            const bytes = new Uint8Array(ab);
            let binary = '';
            for (let i = 0; i < bytes.length; i += 8192) {
              binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
            }
            imageBlobs.push(`data:${blob.type || 'image/jpeg'};base64,${btoa(binary)}`);
          }
        } catch (ie) { console.warn('[Batch] Image fetch failed:', ie); }
      }
      fullItem.imageBlobs = imageBlobs;
      fullItem.description = fullItem.formatted_description || fullItem.description_de || fullItem.description || '';

      // 2. Create a new tab with Kleinanzeigen listing page
      const tab = await chrome.tabs.create({
        url: 'https://www.kleinanzeigen.de/p-anzeige-aufgeben-schritt2.html',
        active: false, // Open in background
      });

      // 3. Wait for the page to load + short delay
      await waitForTabLoad(tab.id);
      await randomDelay(1000, 2000); // 1-2s after page load

      // 4. Send FILL_FORM message to content script
      try {
        const fillResponse = await chrome.tabs.sendMessage(tab.id, {
          action: 'FILL_FORM',
          item: fullItem,
          batchMode: true, // Tells content script to use human-like typing
        });

        console.log(`[Batch] Fill response for ${itemTitle}:`, fillResponse);
      } catch (msgErr) {
        console.warn(`[Batch] Could not message tab for ${itemTitle}:`, msgErr);
        // Content script might not be ready yet, wait and retry
        await randomDelay(2000, 4000);
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'FILL_FORM',
            item: fullItem,
            batchMode: true,
          });
        } catch (retryErr) {
          console.error(`[Batch] Retry failed for ${itemTitle}`, retryErr);
          batchResults.failed++;
          await chrome.tabs.remove(tab.id).catch(() => {});
          continue;
        }
      }

      // 5. Wait for form fill to complete (fast copy-paste fill)
      await randomDelay(3000, 5000); // 3-5s for form fill

      // 6. Send SAVE_DRAFT message to click "Entwurf speichern"
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'SAVE_DRAFT',
        });
        console.log(`[Batch] Draft save sent for ${itemTitle}`);
      } catch (saveErr) {
        console.warn(`[Batch] Could not send save draft for ${itemTitle}:`, saveErr);
      }

      // 7. Wait for save to complete
      await randomDelay(1500, 2500);

      // 8. Keep the tab open as requested by user
      console.log(`[Batch] Completed for ${itemTitle} (tab kept open)`);

      batchResults.success++;

    } catch (err) {
      console.error(`[Batch] Error processing ${itemTitle}:`, err);
      batchResults.failed++;
    }

    // 9. Short delay before next item
    if (batchQueue.length > 0) {
      const waitSec = (2 + Math.random() * 3).toFixed(0);
      sendBatchProgress('batch-wait', currentItem, totalItems, `Waiting ${waitSec}s before next item...`);
      await randomDelay(2000, 5000);
    }
  }

  // Batch complete
  isBatchProcessing = false;
  sendBatchProgress('batch-complete', totalItems, totalItems, 
    `Done! ${batchResults.success} succeeded, ${batchResults.failed} failed.`);
  
  // Notify popup of completion
  try {
    chrome.runtime.sendMessage({
      action: 'BATCH_COMPLETE',
      success: batchResults.success,
      failed: batchResults.failed,
    });
  } catch (e) {
    // Popup might be closed
  }
}

async function fetchItemData(itemId, token, apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/api/items/${itemId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    console.error('[Batch] Fetch item error:', e);
    return null;
  }
}

function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
    // Timeout after 30s
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, 30000);
  });
}

function sendBatchProgress(stage, current, total, text) {
  console.log(`[Batch] ${stage}: ${text}`);
  try {
    chrome.runtime.sendMessage({
      action: 'BATCH_PROGRESS',
      stage: stage,
      current: current,
      total: total,
      text: text,
    });
  } catch (e) {
    // Popup might be closed
  }
}

// Optional: Listen for tab updates to detect when user navigates to Kleinanzeigen
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('kleinanzeigen.de/p-anzeige-aufgeben')) {
    console.log('User navigated to Kleinanzeigen listing page');
    // The content script will auto-inject the sync button via manifest config
  }
});