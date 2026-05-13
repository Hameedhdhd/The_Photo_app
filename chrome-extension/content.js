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
  // Title: input#ad-title (name="title")
  title: [
    'input#ad-title',
    'input[name="title"]',
  ],
  // Description: textarea#ad-description (name="description")
  description: [
    'textarea#ad-description',
    'textarea[name="description"]',
  ],
  // Price: input#ad-price-amount (name="priceAmount")
  price: [
    'input#ad-price-amount',
    'input[name="priceAmount"]',
  ],
  // Image upload: hidden file input (accepts jpeg,gif,png,heic,heif)
  imageInput: [
    'input[type="file"][accept*="image"]',
    'input[type="file"]',
  ],
  // Ad type: radio button for "Ich biete" (OFFER)
  adTypeOffer: [
    'input#ad-type-OFFER',
    'input[name="adType"][value="OFFER"]',
  ],
  // Price type: hidden input (name="priceType", value="FIXED" by default)
  priceTypeFixed: [
    'input[name="priceType"][value="FIXED"]',
  ],
  // Category: hidden input (name="categoryId")
  categoryId: [
    'input[name="categoryId"]',
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
    setTimeout(() => { overlay.style.display = 'none'; }, 10000);
  } else if (type === 'info') {
    setTimeout(() => { overlay.style.display = 'none'; }, 15000);
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
  // Focus the element first
  element.focus();
  
  // Use the native setter to bypass React's controlled input
  const proto = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  
  if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }

  // Dispatch events to trigger React state updates and form validation
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Also dispatch keyboard events to simulate real typing
  element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
  element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
}

/**
 * Human-like typing: types one character at a time with random delays.
 * Anti-bot measure for batch mode.
 */
async function typeHumanLike(element, text) {
  element.focus();
  
  // Clear existing value first
  const proto = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (valueSetter) {
    valueSetter.call(element, '');
  } else {
    element.value = '';
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
  
  await delay(200 + Math.random() * 300);
  
  // Type one character at a time
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const currentValue = text.substring(0, i + 1);
    
    // Set value using native setter
    if (valueSetter) {
      valueSetter.call(element, currentValue);
    } else {
      element.value = currentValue;
    }
    
    // Dispatch keyboard events before input
    element.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
    
    // Random delay between keystrokes (50-150ms)
    await delay(50 + Math.random() * 100);
  }
  
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.blur();
}

/**
 * Save draft by clicking "Entwurf speichern" button
 */
async function saveDraft() {
  // Try multiple selectors for the save draft button
  const selectors = [
    'button[data-testid="button-save-draft"]',
    'button[form="postad-form"][type="submit"]',
  ];
  
  // Also search by button text
  const allButtons = document.querySelectorAll('button');
  let saveBtn = null;
  
  for (const btn of allButtons) {
    const text = btn.textContent.trim().toLowerCase();
    if (text.includes('entwurf') || text.includes('save draft') || text.includes('speichern')) {
      saveBtn = btn;
      break;
    }
  }
  
  // Fallback to selector-based search
  if (!saveBtn) {
    for (const sel of selectors) {
      saveBtn = document.querySelector(sel);
      if (saveBtn) break;
    }
  }
  
  if (saveBtn) {
    console.log('[Kleinanzeigen Sync] Found save draft button, clicking:', saveBtn.textContent.trim());
    saveBtn.click();
    return true;
  } else {
    console.warn('[Kleinanzeigen Sync] Save draft button not found');
    return false;
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

async function fillForm(item, batchMode = false) {
  if (isFilling) {
    showStatus('Already filling form, please wait...', 'loading');
    return;
  }

  isFilling = true;
  const btn = document.getElementById('kleinanzeigen-sync-btn');
  if (btn) {
    btn.style.background = '#f59e0b';
    btn.innerHTML = batchMode ? '⏳ Batch Fill...' : '⏳ Filling...';
    btn.style.cursor = 'wait';
  }

  const errors = [];
  // Fast fill like copy-paste: instant setNativeValue with short pauses
  const fillValue = (el, val) => { setNativeValue(el, val); return Promise.resolve(); };
  const fieldDelay = batchMode ? () => delay(200 + Math.random() * 400) : () => delay(400);

  try {
    // 1. Set Ad Type to "Ich biete" (OFFER)
    try {
      const offerRadio = findElement(SELECTORS.adTypeOffer);
      if (offerRadio && !offerRadio.checked) {
        offerRadio.click();
        console.log('[Kleinanzeigen Sync] Set ad type to OFFER');
      }
    } catch (e) { errors.push('adType'); }

    await (batchMode ? delay(500 + Math.random() * 1000) : delay(200));

    // 2. Fill Title
    try {
      showStatus('Filling title...', 'loading');
      const titleEl = await waitForElement(SELECTORS.title, 5000);
      await fillValue(titleEl, item.title || '');
      console.log('[Kleinanzeigen Sync] Title filled:', item.title);
    } catch (e) {
      console.warn('[Kleinanzeigen Sync] Title fill failed:', e);
      errors.push('title');
    }

    await fieldDelay();

    // 3. Fill Description (uses formatted_description from backend API - single source of truth)
    try {
      showStatus('Filling description...', 'loading');
      const descEl = await waitForElement(SELECTORS.description, 5000);
      const description = item.formatted_description || item.description_de || '';
      await fillValue(descEl, description);
      console.log('[Kleinanzeigen Sync] Description filled');
    } catch (e) {
      console.warn('[Kleinanzeigen Sync] Description fill failed:', e);
      errors.push('description');
    }

    await fieldDelay();

    // 4. Fill Price
    try {
      showStatus('Filling price...', 'loading');
      const priceEl = await waitForElement(SELECTORS.price, 5000);
      // Clean price - remove "EUR", "€", spaces, etc.
      const cleanPrice = String(item.price || '')
        .replace(/[^\d.,]/g, '')
        .replace(',', '.');
      if (cleanPrice) {
        await fillValue(priceEl, cleanPrice);
        console.log('[Kleinanzeigen Sync] Price filled:', cleanPrice);
      }
    } catch (e) {
      console.warn('[Kleinanzeigen Sync] Price fill failed:', e);
      errors.push('price');
    }

    await fieldDelay();

    // 5. Upload Images
    try {
      if (item.image_url || (item.image_urls && item.image_urls.length > 0)) {
        showStatus('Uploading images...', 'loading');
        const imageUrls = item.image_urls || (item.image_url ? [item.image_url] : []);
        await uploadImages(imageUrls);
      }
    } catch (e) {
      console.warn('[Kleinanzeigen Sync] Image upload failed:', e);
      errors.push('images');
    }

    // 6. Done!
    if (errors.length === 0) {
      showStatus('🎉 Form filled! Check category & publish.', 'success');
    } else {
      showStatus(`⚠️ Filled with issues: ${errors.join(', ')}. Check the form.`, 'info');
    }
    
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
      // Use background script to fetch image (avoids CORS issues in content script)
      const imageBlob = await fetchImageViaBackground(url);
      
      // Determine filename and type
      const contentType = imageBlob.type || 'image/jpeg';
      const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
      const filename = `item_photo_${i + 1}.${ext}`;
      
      // Create a File object and add to DataTransfer
      const file = new File([imageBlob], filename, { type: contentType });
      dataTransfer.items.add(file);
      successCount++;
      
      console.log(`[Kleinanzeigen Sync] Prepared image: ${filename} (${(imageBlob.size / 1024).toFixed(1)}KB)`);
    } catch (err) {
      console.warn(`[Kleinanzeigen Sync] Failed to load image ${url}:`, err);
      showStatus(`⚠️ Could not load image ${i + 1}, skipping...`, 'loading');
    }
  }

  if (successCount === 0) {
    throw new Error('No images could be downloaded');
  }

  // Approach 1: Try setting files on the hidden input + dispatch change
  fileInput.files = dataTransfer.files;
  fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  fileInput.dispatchEvent(new Event('input', { bubbles: true }));
  
  await delay(500);

  // Approach 2: Simulate drag-and-drop on the upload area
  // This works better with React-based upload components
  const uploadArea = fileInput.closest('[class*="flex"]') || fileInput.parentElement;
  if (uploadArea) {
    console.log('[Kleinanzeigen Sync] Simulating drag-and-drop on upload area');
    
    // Create drop event with files
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: dataTransfer,
    });
    
    // Need to override dataTransfer.files since DragEvent doesn't set them properly
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: dataTransfer.files,
        items: dataTransfer.items,
        types: ['Files'],
        getData: () => '',
        setData: () => {},
      },
      writable: false,
    });
    
    // Fire dragenter, dragover, then drop
    uploadArea.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true }));
    uploadArea.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true }));
    uploadArea.dispatchEvent(dropEvent);
    uploadArea.dispatchEvent(new DragEvent('dragleave', { bubbles: true, cancelable: true }));
  }

  await delay(500);

  // Approach 3: Try clicking the file input to trigger native file dialog, then set files
  // Some React apps listen for the input's click event
  try {
    // Make the input temporarily visible and clickable
    const originalDisplay = fileInput.style.display;
    const originalOpacity = fileInput.style.opacity;
    const originalPosition = fileInput.style.position;
    fileInput.style.display = 'block';
    fileInput.style.opacity = '0';
    fileInput.style.position = 'fixed';
    fileInput.style.top = '0';
    fileInput.style.left = '0';
    fileInput.style.width = '1px';
    fileInput.style.height = '1px';
    
    // Re-assign files after making visible (some browsers reset on display change)
    fileInput.files = dataTransfer.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Restore original styles
    await delay(300);
    fileInput.style.display = originalDisplay;
    fileInput.style.opacity = originalOpacity;
    fileInput.style.position = originalPosition;
  } catch (e) {
    console.warn('[Kleinanzeigen Sync] Approach 3 failed:', e);
  }

  console.log(`[Kleinanzeigen Sync] ${successCount} images prepared (upload may need manual verification)`);
}

/**
 * Fetch an image via the background service worker to avoid CORS restrictions.
 * Falls back to direct fetch if background messaging fails.
 */
async function fetchImageViaBackground(url) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'FETCH_IMAGE',
      url: url,
    });
    
    if (response && response.success && response.data) {
      // Convert base64 data URL back to blob
      const res = await fetch(response.data);
      return await res.blob();
    }
  } catch (e) {
    console.log('[Kleinanzeigen Sync] Background fetch failed, trying direct fetch:', e);
  }
  
  // Fallback: try direct fetch (works if CORS headers allow it)
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  return await response.blob();
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
    // On HTTPS pages, skip HTTP LAN IPs (mixed content blocked by Chrome)
    showStatus('Fetching item data...', 'loading');
    const isHttpsPage = location.protocol === 'https:';
    const apiUrls = [window.EXTENSION_CONFIG.API_URL, window.EXTENSION_CONFIG.API_URL_FALLBACK].filter(url => {
      if (!url) return false;
      if (isHttpsPage && url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
        console.warn(`[Kleinanzeigen Sync] Skipping ${url} (mixed content blocked on HTTPS page)`);
        return false;
      }
      return true;
    });
    let item = null;
    let lastError = null;
    
    for (const apiUrl of apiUrls) {
      try {
        const response = await fetch(`${apiUrl}/api/items/${result.selected_item_id}`, {
          headers: {
            'Authorization': `Bearer ${authResult.auth_session.access_token}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000),
        });
        
        if (response.ok) {
          item = await response.json();
          break;
        }
        lastError = new Error(`API returned ${response.status}`);
      } catch (e) {
        lastError = e;
      }
    }
    
    if (!item) throw lastError || new Error('Failed to fetch item from API');

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
    console.log('[Kleinanzeigen Sync] Received FILL_FORM message with item:', message.item.title, 
      message.batchMode ? '(BATCH MODE)' : '');
    
    // Store the item and trigger fill
    pendingItem = message.item;
    fillForm(message.item, message.batchMode || false)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    
    return true; // Keep message channel open for async response
  }

  if (message.action === 'SAVE_DRAFT') {
    console.log('[Kleinanzeigen Sync] Received SAVE_DRAFT message');
    saveDraft()
      .then((found) => sendResponse({ success: found }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
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
      setTimeout(createDebugButton, 1200);
    });
  } else {
    setTimeout(createSyncButton, 1000);
    setTimeout(createStatusOverlay, 1100);
    setTimeout(createDebugButton, 1200);
  }
}

// ============================================================
// Debug Helper - Scans DOM and logs all form fields
// ============================================================

function createDebugButton() {
  if (document.getElementById('kleinanzeigen-debug-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'kleinanzeigen-debug-btn';
  btn.innerHTML = '🔍 Debug DOM';
  btn.style.cssText = `
    position: fixed;
    top: 60px;
    right: 20px;
    z-index: 99999;
    padding: 8px 14px;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
  `;

  btn.addEventListener('click', debugDomFields);
  document.body.appendChild(btn);
}

function debugDomFields() {
  console.log('\n========== KLEINANZEIGEN DOM DEBUG ==========\n');
  
  const fields = document.querySelectorAll('input, textarea, select');
  console.log(`Found ${fields.length} form fields:\n`);
  
  fields.forEach((el, i) => {
    const info = {
      index: i,
      tag: el.tagName.toLowerCase(),
      type: el.type || '',
      id: el.id || '',
      name: el.name || '',
      className: el.className?.substring(0, 80) || '',
      placeholder: el.placeholder || '',
      ariaLabel: el.getAttribute('aria-label') || '',
      value: el.type === 'file' ? '[FILE INPUT]' : (el.value?.substring(0, 50) || ''),
      accept: el.accept || '',
      required: el.required,
      readOnly: el.readOnly,
      parentClass: el.parentElement?.className?.substring(0, 60) || '',
      parentId: el.parentElement?.id || '',
    };
    console.log(`Field ${i}:`, JSON.stringify(info, null, 2));
  });

  // Also check for React roots and framework clues
  const reactRoot = document.querySelector('[data-reactroot]') || document.querySelector('#root') || document.querySelector('#app');
  console.log('\nReact root:', reactRoot ? reactRoot.tagName + '#' + reactRoot.id : 'Not found');
  
  // Check for specific Kleinanzeigen classes
  const customInputs = document.querySelectorAll('[class*="postad"], [class*="PostAd"], [class*="Postad"], [class*="adForm"], [class*="AdForm"]');
  console.log(`\nCustom Kleinanzeigen elements: ${customInputs.length}`);
  customInputs.forEach((el, i) => {
    console.log(`  Custom ${i}: tag=${el.tagName}, id=${el.id}, class=${el.className?.substring(0, 80)}`);
  });

  // Check for labels
  const labels = document.querySelectorAll('label');
  console.log(`\nLabels (${labels.length}):`);
  labels.forEach((el, i) => {
    console.log(`  Label ${i}: for=${el.getAttribute('for')}, text="${el.textContent?.trim().substring(0, 40)}"`);
  });

  console.log('\n========== END DOM DEBUG ==========\n');
  
  // Also show summary in status overlay
  showStatus(`🔍 Debug: ${fields.length} fields found. Check console (F12) for details.`, 'info');
  
  // Remove debug button after use
  const btn = document.getElementById('kleinanzeigen-debug-btn');
  if (btn) btn.remove();
}

init();