/**
 * Popup Script - Full UI inside extension popup
 * Handles: Auth, item listing, fill commands, draft management
 */

const SUPABASE_URL = 'https://awwahpecfvdljgupnzft.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JbvTrXHKwtnZTcMGte00Ng_6uhuWG3s';
const API_URL = 'http://localhost:8000';

let currentTab = 'app';
let appItems = [];
let localDrafts = [];
let selectedItemIds = new Set();

// ============================================================
// Supabase Auth
// ============================================================

async function signIn(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error('Login failed');
  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user: data.user,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + 3600,
  };
}

async function getSession() {
  return new Promise(resolve => chrome.storage.local.get(['auth_session'], r => resolve(r.auth_session)));
}

async function setSession(session) {
  return new Promise(resolve => chrome.storage.local.set({ auth_session: session }, resolve));
}

async function clearSession() {
  return new Promise(resolve => chrome.storage.local.remove(['auth_session', 'selected_item_id'], resolve));
}

async function getValidSession() {
  const session = await getSession();
  if (!session) return null;
  const isExpired = Date.now() / 1000 > (session.expires_at - 300);
  return isExpired ? null : session;
}

// ============================================================
// Init
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  const session = await getValidSession();
  if (session) {
    showMainScreen(session);
  } else {
    showLoginScreen();
  }
});

// ============================================================
// Login Screen
// ============================================================

function showLoginScreen() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('main-screen').style.display = 'none';

  document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const errEl = document.getElementById('login-error');
    errEl.style.display = 'none';
    try {
      const session = await signIn(email, pass);
      await setSession(session);
      showMainScreen(session);
    } catch (err) {
      errEl.textContent = 'Login failed. Check your credentials.';
      errEl.style.display = 'block';
    }
  };
}

// ============================================================
// Main Screen
// ============================================================

async function showMainScreen(session) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-screen').style.display = 'flex';
  const emailEl = document.getElementById('user-email');
  if (emailEl) emailEl.textContent = session.user.email;

  // Logout
  document.getElementById('logout-btn').onclick = async () => {
    await clearSession();
    showLoginScreen();
  };

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      renderItemList();
    };
  });

  // Refresh
  document.getElementById('refresh-btn').onclick = () => loadData(session);

  // Save locally button
  document.getElementById('save-local-btn').onclick = () => handleSaveLocal();

  // Batch post
  document.getElementById('batch-post-btn').onclick = () => handleBatchPost(session);

  // Logs
  document.getElementById('show-logs-btn').onclick = () => {
    document.getElementById('log-overlay').style.display = 'flex';
  };
  document.getElementById('close-logs-btn').onclick = () => {
    document.getElementById('log-overlay').style.display = 'none';
  };

  // Load data
  await loadData(session);
}

// Global log handler - only captures extension-specific logs
function addLog(msg, type = 'info') {
  const content = document.getElementById('log-content');
  if (!content) return;
  const time = new Date().toLocaleTimeString();
  const div = document.createElement('div');
  div.className = `log-entry ${type}`;
  div.innerHTML = `<span class="log-time">[${time}]</span> ${msg}`;
  content.appendChild(div);
  content.scrollTop = content.scrollHeight;
}

// Forward logs from content/inject scripts to the log viewer
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'KA_LOG') {
    addLog(msg.text, msg.type);
  }
});

async function loadData(session) {
  showStatus('Loading...', 'loading');
  await fetchAppData(session.access_token);
  await loadLocalDrafts();
  renderItemList();
  showStatus('', '');
}

async function fetchAppData(token) {
  try {
    const res = await fetch(`${API_URL}/api/items`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    appItems = data.items || [];
  } catch (e) {
    console.error('Fetch error:', e);
    appItems = [];
  }
}

async function loadLocalDrafts() {
  const result = await chrome.storage.local.get(['local_drafts']);
  localDrafts = result.local_drafts || [];
}

// ============================================================
// Render Item List
// ============================================================

function renderItemList() {
  const listEl = document.getElementById('item-list');
  const items = currentTab === 'app' ? appItems : localDrafts;

  // Batch bar
  const batchBar = document.getElementById('batch-bar');
  if (currentTab === 'app' && selectedItemIds.size > 0) {
    batchBar.style.display = 'block';
    document.getElementById('batch-count').textContent = selectedItemIds.size;
  } else {
    batchBar.style.display = 'none';
  }

  if (items.length === 0) {
    const icon = currentTab === 'app' ? '📦' : '💾';
    const text = currentTab === 'app' ? 'No items from your app yet' : 'No local drafts saved yet';
    listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">${icon}</div><div class="empty-text">${text}</div></div>`;
    return;
  }

  listEl.innerHTML = '';
  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'item-card';

    const img = currentTab === 'app' ? item.image_url : (item.local_images?.[0] || '');
    const itemId = item.item_id || item.id;
    const isChecked = selectedItemIds.has(itemId);

    let actionsHtml = `<button class="btn-fill" data-index="${index}">FILL</button>`;
    if (currentTab === 'drafts') {
      actionsHtml += `<button class="btn-delete" data-index="${index}">🗑</button>`;
    }

    card.innerHTML = `
      <input type="checkbox" class="item-check" data-id="${itemId}" ${isChecked ? 'checked' : ''}>
      <div class="item-thumb">${img ? `<img src="${img}">` : '📦'}</div>
      <div class="item-info">
        <div class="item-title">${item.title || 'Untitled'}</div>
        <div class="item-price">${item.price || '0'}€</div>
      </div>
      ${actionsHtml}
    `;

    // Checkbox
    card.querySelector('.item-check').onclick = (e) => {
      e.stopPropagation();
      if (e.target.checked) selectedItemIds.add(itemId);
      else selectedItemIds.delete(itemId);
      renderItemList();
    };

    // Fill button
    card.querySelector('.btn-fill').onclick = (e) => {
      e.stopPropagation();
      handleFillItem(item);
    };

    // Delete button (drafts only)
    const deleteBtn = card.querySelector('.btn-delete');
    if (deleteBtn) {
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteDraft(index);
      };
    }

    listEl.appendChild(card);
  });
}

// ============================================================
// Delete Draft
// ============================================================

async function deleteDraft(index) {
  localDrafts.splice(index, 1);
  await chrome.storage.local.set({ local_drafts: localDrafts });
  renderItemList();
  showStatus('🗑 Draft deleted', 'success');
}

// ============================================================
// Fill Item - Send to content script on active Kleinanzeigen tab
// ============================================================

async function handleFillItem(item) {
  showStatus('Preparing fill...', 'loading');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url?.includes('kleinanzeigen.de')) {
      showStatus('❌ Open Kleinanzeigen ad page first!', 'error');
      return;
    }

    // Get full item data if from app
    let fullItem = item;
    if (currentTab === 'app' && item.item_id) {
      const session = await getValidSession();
      if (session) {
        try {
          showStatus('Fetching item details...', 'loading');
          const res = await fetch(`${API_URL}/api/items/${item.item_id}`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (res.ok) fullItem = await res.json();
        } catch (e) { /* use item as-is */ }
      }
    }

    // Fetch images as base64 via background script (avoids CORS)
    showStatus('Loading images...', 'loading');
    let imageBlobs = [];
    
    // Collect all unique non-empty URLs
    let urls = [];
    if (fullItem.local_images && Array.isArray(fullItem.local_images)) urls.push(...fullItem.local_images);
    if (fullItem.image_urls && Array.isArray(fullItem.image_urls)) urls.push(...fullItem.image_urls);
    if (fullItem.image_url) urls.push(fullItem.image_url);
    
    // Deduplicate and filter
    const uniqueUrls = [...new Set(urls)].filter(u => u && typeof u === 'string' && u.length > 0);
    console.log('[Popup] Unique image URLs to fetch:', uniqueUrls.length);

    for (const url of uniqueUrls) {
      if (url.startsWith('data:')) {
        imageBlobs.push(url);
      } else {
        try {
          const response = await chrome.runtime.sendMessage({ action: 'FETCH_IMAGE', url });
          if (response?.success && response.data) {
            imageBlobs.push(response.data);
          }
        } catch (e) { console.error('Image fetch error:', e); }
      }
    }
    
    console.log('[Popup] Final image blobs collected:', imageBlobs.length);

    // Send fill command to content script
    const fillItem = {
      title: fullItem.title || '',
      description: fullItem.formatted_description || fullItem.description_de || fullItem.description || '',
      price: fullItem.price || '',
      imageBlobs: imageBlobs,
    };

    // Save to local drafts FIRST (before filling, so draft is guaranteed)
    await saveToDrafts(fillItem);

    showStatus('🪄 Uploading photos & filling form...', 'loading');

    chrome.tabs.sendMessage(tab.id, { action: 'FILL_FORM', item: fillItem }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('❌ Content script not ready. Reload the page.', 'error');
        return;
      }
      if (response?.success) {
        // Wait 30 seconds before sending SAVE_DRAFT command
        showStatus('⏳ Waiting 30s before saving draft...', 'loading');
        console.log('[Popup] Initiating 30 second wait before save...');
        
        let timeLeft = 30;
        const interval = setInterval(() => {
          timeLeft--;
          if (timeLeft > 0) {
            showStatus(`⏳ Waiting ${timeLeft}s before saving draft...`, 'loading');
          } else {
            clearInterval(interval);
            showStatus('💾 Saving draft...', 'loading');
            
            // Send the save command
            chrome.tabs.sendMessage(tab.id, { action: 'SAVE_DRAFT' }, (saveRes) => {
              if (saveRes?.success) {
                showStatus('✅ Form filled & draft saved!', 'success');
              } else {
                showStatus('⚠️ Filled, but could not click save button', 'warn');
              }
            });
          }
        }, 1000);
        
      } else {
        showStatus('❌ Fill failed', 'error');
      }
    });
  } catch (err) {
    showStatus('❌ ' + err.message, 'error');
  }
}

// ============================================================
// Save to Local Drafts
// ============================================================

async function saveToDrafts(itemData) {
  try {
    const draft = {
      id: 'draft_' + Date.now(),
      title: itemData.title || 'Draft',
      description: itemData.description || '',
      price: itemData.price || '',
      // Store images directly (unlimitedStorage permission handles size)
      local_images: itemData.imageBlobs || [],
      created_at: new Date().toISOString()
    };

    const res = await chrome.storage.local.get(['local_drafts']);
    const existingDrafts = res.local_drafts || [];
    const drafts = [draft, ...existingDrafts].slice(0, 30);
    
    await chrome.storage.local.set({ local_drafts: drafts });
    
    // Verify save worked
    const verify = await chrome.storage.local.get(['local_drafts']);
    console.log('[Popup] Draft saved:', draft.title, 'images:', draft.local_images.length, 'total drafts:', verify.local_drafts?.length);
    
    await loadLocalDrafts();
    
    // Switch to drafts tab to show the saved draft
    currentTab = 'drafts';
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="drafts"]')?.classList.add('active');
    renderItemList();
  } catch (e) {
    console.error('[Popup] Draft save error:', e);
    showStatus('⚠️ Draft save failed: ' + e.message, 'error');
  }
}

// ============================================================
// Save Local - Capture current form from Kleinanzeigen page
// ============================================================

async function handleSaveLocal() {
  showStatus('Capturing form...', 'loading');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url?.includes('kleinanzeigen.de')) {
      showStatus('❌ Open Kleinanzeigen ad page first!', 'error');
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: 'CAPTURE_FORM' }, async (response) => {
      if (chrome.runtime.lastError) {
        showStatus('❌ Content script not ready. Reload the page.', 'error');
        return;
      }
      if (response?.success) {
        await saveToDrafts({
          title: response.title,
          description: response.description,
          price: response.price,
          imageBlobs: response.images || [],
        });
        showStatus('✅ Saved locally!', 'success');
      } else {
        showStatus('❌ Capture failed', 'error');
      }
    });
  } catch (err) {
    showStatus('❌ ' + err.message, 'error');
  }
}

// ============================================================
// Batch Post
// ============================================================

async function handleBatchPost(session) {
  const itemsToPost = appItems.filter(item => selectedItemIds.has(item.item_id || item.id));
  if (itemsToPost.length === 0) return;

  showStatus(`🚀 Starting batch for ${itemsToPost.length} items...`, 'loading');
  chrome.runtime.sendMessage({
    action: 'START_BATCH',
    items: itemsToPost,
    token: session.access_token,
    apiUrl: API_URL
  });
  selectedItemIds.clear();
  renderItemList();
  showStatus('🚀 Batch started!', 'success');
}

// ============================================================
// Status Bar
// ============================================================

function showStatus(msg, type) {
  const bar = document.getElementById('status-bar');
  if (!msg) { bar.style.display = 'none'; bar.className = 'status-bar'; return; }
  bar.textContent = msg;
  bar.className = 'status-bar ' + type;
  if (type === 'success' || type === 'error') {
    setTimeout(() => { bar.style.display = 'none'; }, 4000);
  }
}