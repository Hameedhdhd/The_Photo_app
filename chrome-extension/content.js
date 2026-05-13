/**
 * Content Script for Kleinanzeigen Sync Extension
 * Injected into: https://www.kleinanzeigen.de/p-anzeige-aufgeben.html*
 * 
 * Handles:
 * - Injecting the "⚡ Fill from My App" floating button
 * - Listening for FILL_FORM messages from popup
 * - Populating Kleinanzeigen form fields (title, description, price)
 * - Uploading images via DataTransfer API
 * - Visual feedback during fill operations
 */

// ============================================================
// Selectors - Updated for current Kleinanzeigen DOM
// Multiple fallback selectors for robustness
// ============================================================

const SELECTORS = {
  title: [
    'input#postad-title',
    'input[name="title"]',
    'input[aria-label*="Titel"]',
    'input[placeholder*="Titel"]',
    '#postAd-title',
    '.Inputfield input[type="text"]',
  ],
  description: [
    'textarea#postad-description',
    'textarea[name="description"]',
    'textarea[aria-label*="Beschreibung"]',
    '#postAd-description',
    '.Inputfield textarea',
  ],
  price: [
    'input#postad-price',
    'input[name="price"]',
    'input[aria-label*="Preis"]',
    'input[placeholder*="Preis"]',
    '#postAd-price',
    '#priceInput',
  ],
  imageInput: [
    'input[type="file"]',
    'input[accept*="image"]',
    '#image-upload-input',
    '.ImageUpload input[type="file"]',
  ],
  // Price type radio buttons (Festpreis, Verhandlungsbasis, etc.)
  priceTypeFixed: [
    'input[value="FIXED"]',
    'input[name="priceType"][value="FIXED"]',
    '#priceTypeFixed',
  ],
  // Shipping type
  shippingType: [
    'select[name="shippingType"]',
    'select#shippingType',
  ],
};

// ============================================================
// State
// ============================================================

let isFilling = false;
let pendingItem = null;

// ============================================================
// UI Injection - Create the floating sync button
// ============================================================

function createSyncButton() {
  // Prevent duplicate buttons
  if (document.getElementById('kleinanzeigen-sync-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'kleinanzeigen-sync-btn';
  btn.innerHTML = '⚡ Fill from My App';
  btn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 99999;
    padding: 12px 20px;
    background: #86B817;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 4px 12px rgba(134, 184, 23, 0.4);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  `;

  btn.addEventListener('mouseenter', () => {
    if (!isFilling) {
      btn.style.background = '#75a314';
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 6px 16px rgba(134, 184, 23, 0.5)';
    }
  });

  btn.addEventListener('mouseleave', () => {
    if (!isFilling) {
      btn.style.background = '#86B817';
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 4px 12px rgba(134, 184, 23, 0.4)';
    }
  });

  btn.addEventListener('click', handleSyncButtonClick);
  document.body.appendChild(btn);
}

// ============================================================
// Status Overlay - Shows feedback during fill operation
// ============================================================

function createStatusOverlay() {
  if (document.getElementById('kleinanzeigen-sync-status')) return;

  const overlay = document.createElement('div');
  overlay.id = 'kleinanzeigen-sync-status';
  overlay.style.cssText = `
    position: fixed;
    top: 70px;
    right: 20px;
    z-index: 99998;
    padding: 12px 18px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    display: none;
    max-width: 280px;
  `;
  document.body.appendChild(overlay);
}

function showStatus(message, type = 'info') {
  const overlay = document.getElementById('kleinanzeigen-sync-status');
  if (!overlay) return;

  const styles = {
    info: { background: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9' },
    success: { background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' },
    error: { background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' },
    loading: { background: '#fff3e0', color: '#e65100', border: '1px solid #ffcc80' },
  };

  const s = styles[type] || styles.info;
  overlay.style.background = s.background;
  overlay.style.color = s.color;
  overlay.style.border = s.border;
  overlay.textContent = message;
  overlay.style.display = 'block';

  if (type === 'success' || type === 'error') {
    setTimeout(() => { overlay.style.display = 'none'; }, 5000);
  }
}

function hideStatus() {
  const overlay = document.getElementById('kleinanzeigen-sync-status');
  if (overlay) overlay.style.display = 'none';
}

// ============================================================
// DOM Utilities - Find elements with fallback selectors
// ============================================================

function findElement(selectorList) {
  for (const selector of selectorList) {
    const el = document.querySelector(selector);
    if (el) {
      console.log(`[Kleinanzeigen Sync] Found element with selector: ${selector}`);
      return el;
    }
  }
  return null;
}

/**
 * Set a value on a React-controlled input by simulating native input events.
 * This is needed because Kleinanzeigen likely uses React, and simply setting
 * .value won't trigger React's state updates.
 */
function setNativeValue(element, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
    'value'
  )?.set;

  if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }

  // Trigger input event so React picks up the change
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Also try React's internal handler for older React versions
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLElement.prototype, 'value'
  )?.set;
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

/**
 * Wait for an element to appear in the DOM (useful for dynamic pages)
 */
function waitForElement(selectorList, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const el = findElement(selectorList);
    if (el) { resolve(el); return; }

    const observer = new MutationObserver(() => {
      const el = findElement(selectorList);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      const el = findElement(selectorList);
      if (el) resolve(el);
      else reject(new Error(`Element not found: ${selectorList[0]}`));
    }, timeout);
  });
}

// ============================================================
// Form Filling Logic
// ============================================================

async function fillForm(item) {
  if (isFilling) {
    showStatus('Already filling form, please wait...', 'loading');
    return;
  }

  isFilling = true;
  const btn = document.getElementById('kleinanzeigen-sync-btn');
  if (btn) {
    btn.style.background = '#f59e0b';
    btn.innerHTML = '⏳ Filling...';
    btn.style.cursor = 'wait';
  }

  try {
    // 1. Fill Title
    showStatus('Filling title...', 'loading');
    const titleEl = await waitForElement(SELECTORS.title, 3000);
    if (titleEl) {
      titleEl.focus();
      setNativeValue(titleEl, item.title || '');
      titleEl.blur();
      showStatus('✅ Title filled', 'success');
    } else {
      showStatus('⚠️ Title field not found', 'error');
    }

    // Small delay between fields for React state updates
    await delay(300);

    // 2. Fill Description (use German description by default for Kleinanzeigen)
    showStatus('Filling description...', 'loading');
    const descEl = await waitForElement(SELECTORS.description, 3000);
    if (descEl) {
      descEl.focus();
      const description = item.description_de || item.description_en || '';
      setNativeValue(descEl, description);
      descEl.blur();
      showStatus('✅ Description filled', 'success');
    } else {
      showStatus('⚠️ Description field not found', 'error');
    }

    await delay(300);

    // 3. Fill Price
    showStatus('Filling price...', 'loading');
    const priceEl = await waitForElement(SELECTORS.price, 3000);
    if (priceEl) {
      priceEl.focus();
      // Clean price - remove "EUR", "€", spaces, etc.
      const cleanPrice = String(item.price || '')
        .replace(/[^\d.,]/g, '')
        .replace(',', '.');
      setNativeValue(priceEl, cleanPrice);
      priceEl.blur();
      showStatus('✅ Price filled', 'success');

      // Try to set price type to "Festpreis" (fixed price)
      const fixedPriceRadio = findElement(SELECTORS.priceTypeFixed);
      if (fixedPriceRadio && !fixedPriceRadio.checked) {
        fixedPriceRadio.click();
      }
    } else {
      showStatus('⚠️ Price field not found (might need to enable pricing first)', 'error');
    }

    await delay(300);

    // 4. Upload Images
    if (item.image_url || (item.image_urls && item.image_urls.length > 0)) {
      showStatus('Uploading images...', 'loading');
      const imageUrls = item.image_urls || (item.image_url ? [item.image_url] : []);
      await uploadImages(imageUrls);
      showStatus('✅ Images uploaded', 'success');
    }

    // 5. Done!
    showStatus('🎉 Form filled! Please check category and click Publish.', 'success');
    
    // Notify background script
    chrome.runtime.sendMessage({
      action: 'FORM_FILL_COMPLETE',
      item_id: item.item_id,
    });

  } catch (err) {
    console.error('[Kleinanzeigen Sync] Fill error:', err);
    showStatus(`❌ Error: ${err.message}`, 'error');
    
    chrome.runtime.sendMessage({
      action: 'FORM_FILL_ERROR',
      error: err.message,
      item_id: item?.item_id,
    });
  } finally {
    isFilling = false;
    const btn = document.getElementById('kleinanzeigen-sync-btn');
    if (btn) {
      btn.style.background = '#86B817';
      btn.innerHTML = '⚡ Fill from My App';
      btn.style.cursor = 'pointer';
    }
  }
}

// ============================================================
// Image Upload via DataTransfer API
// ============================================================

async function uploadImages(imageUrls) {
  if (!imageUrls || imageUrls.length === 0) {
    console.log('[Kleinanzeigen Sync] No images to upload');
    return;
  }

  // Find the file input
  const fileInput = await waitForElement(SELECTORS.imageInput, 5000);
  if (!fileInput) {
    throw new Error('Image upload area not found on page');
  }

  const dataTransfer = new DataTransfer();
  let successCount = 0;

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    showStatus(`Downloading image ${i + 1}/${imageUrls.length}...`, 'loading');
    
    try {
      // Fetch the image as a blob
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
      
      const blob = await response.blob();
      
      // Determine filename and type
      const contentType = blob.type || 'image/jpeg';
      const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
      const filename = `item_photo_${i + 1}.${ext}`;
      
      // Create a File object and add to DataTransfer
      const file = new File([blob], filename, { type: contentType });
      dataTransfer.items.add(file);
      successCount++;
      
      console.log(`[Kleinanzeigen Sync] Prepared image: ${filename} (${(blob.size / 1024).toFixed(1)}KB)`);
    } catch (err) {
      console.warn(`[Kleinanzeigen Sync] Failed to load image ${url}:`, err);
      showStatus(`⚠️ Could not load image ${i + 1}, skipping...`, 'loading');
    }
  }

  if (successCount === 0) {
    throw new Error('No images could be downloaded');
  }

  // Assign the files to the file input
  fileInput.files = dataTransfer.files;

  // Dispatch events to notify the website's JavaScript
  // Multiple events for maximum compatibility
  fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  fileInput.dispatchEvent(new Event('input', { bubbles: true }));
  
  // Also try a custom event that some frameworks listen for
  fileInput.dispatchEvent(new CustomEvent('fileselect', { bubbles: true, detail: { files: dataTransfer.files } }));

  console.log(`[Kleinanzeigen Sync] ${successCount} images uploaded to form`);
}

// ============================================================
// Button Click Handler
// ============================================================

async function handleSyncButtonClick() {
  if (isFilling) return;

  // Check if we have a pending item from popup
  if (pendingItem) {
    await fillForm(pendingItem);
    pendingItem = null;
    return;
  }

  // Otherwise, fetch from extension storage
  showStatus('Checking for selected item...', 'loading');
  
  try {
    // Get selected item from storage
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['selected_item_id'], resolve);
    });

    if (!result.selected_item_id) {
      showStatus('No item selected. Open the extension popup and select an item first.', 'error');
      return;
    }

    // Get auth token
    const authResult = await new Promise((resolve) => {
      chrome.storage.local.get(['auth_session'], resolve);
    });

    if (!authResult.auth_session?.access_token) {
      showStatus('Not logged in. Open the extension popup to log in.', 'error');
      return;
    }

    // Fetch item data from backend
    showStatus('Fetching item data...', 'loading');
    const response = await fetch(`${window.EXTENSION_CONFIG.API_URL}/api/items/${result.selected_item_id}`, {
      headers: {
        'Authorization': `Bearer ${authResult.auth_session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch item: ${response.status}`);
    }

    const item = await response.json();
    await fillForm(item);

  } catch (err) {
    console.error('[Kleinanzeigen Sync] Sync button error:', err);
    showStatus(`❌ ${err.message}`, 'error');
  }
}

// ============================================================
// Message Listener - Receive FILL_FORM from popup
// ============================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'FILL_FORM' && message.item) {
    console.log('[Kleinanzeigen Sync] Received FILL_FORM message with item:', message.item.title);
    
    // Store the item and trigger fill
    pendingItem = message.item;
    fillForm(message.item)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    
    return true; // Keep message channel open for async response
  }

  if (message.action === 'PING') {
    sendResponse({ status: 'content_script_active' });
    return true;
  }

  return false;
});

// ============================================================
// Utility
// ============================================================

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// Initialize - Inject UI elements when page is ready
// ============================================================

function init() {
  console.log('[Kleinanzeigen Sync] Content script loaded');
  
  // Wait for the page to be sufficiently loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(createSyncButton, 1000);
      setTimeout(createStatusOverlay, 1100);
    });
  } else {
    setTimeout(createSyncButton, 1000);
    setTimeout(createStatusOverlay, 1100);
  }
}

init();