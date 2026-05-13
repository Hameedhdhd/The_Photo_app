/**
 * Popup script for Kleinanzeigen Sync Extension
 * Handles: Login via Supabase Auth, Item listing, Item selection
 */

// ============================================================
// Supabase Auth Client (minimal, no SDK dependency)
// Uses Supabase REST API directly for auth
// ============================================================

class SupabaseAuth {
  constructor(url, anonKey) {
    this.url = url;
    this.anonKey = anonKey;
  }

  async signIn(email, password) {
    const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.anonKey,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.msg || 'Login failed');
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
      expires_at: data.expires_at || Math.floor(Date.now() / 1000) + 3600,
    };
  }

  async signUp(email, password) {
    const response = await fetch(`${this.url}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.anonKey,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.msg || 'Sign up failed');
    }

    const data = await response.json();
    
    // If email confirmation is required, we won't get a session
    if (!data.access_token) {
      return { needsConfirmation: true, user: data.user || data };
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
      expires_at: data.expires_at,
    };
  }

  async getSession() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['auth_session'], (result) => {
        resolve(result.auth_session || null);
      });
    });
  }

  async setSession(session) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ auth_session: session }, resolve);
    });
  }

  async clearSession() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['auth_session', 'selected_item_id'], resolve);
    });
  }

  isSessionExpired(session) {
    if (!session || !session.expires_at) return true;
    // Add 5 minute buffer
    return Date.now() / 1000 > (session.expires_at - 300);
  }

  async refreshSession(session) {
    if (!session?.refresh_token) return null;
    try {
      const response = await fetch(`${this.url}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.anonKey,
        },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const newSession = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user || session.user,
        expires_at: data.expires_at || Math.floor(Date.now() / 1000) + 3600,
      };
      await this.setSession(newSession);
      return newSession;
    } catch (e) {
      console.error('Token refresh failed:', e);
      return null;
    }
  }

  async getValidSession() {
    const session = await this.getSession();
    if (!session) return null;
    if (!this.isSessionExpired(session)) return session;
    // Try refresh
    const refreshed = await this.refreshSession(session);
    return refreshed;
  }
}

// ============================================================
// App State
// ============================================================

let auth;
let currentItems = [];
let selectedItemId = null;
let selectedBatchItems = new Set(); // Set of item IDs selected for batch
let isBatchRunning = false;

// ============================================================
// DOM Elements
// ============================================================

const loginScreen = document.getElementById('login-screen');
const itemsScreen = document.getElementById('items-screen');
const detailScreen = document.getElementById('detail-screen');

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');

const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const refreshBtn = document.getElementById('refresh-btn');

const statusText = document.getElementById('status-text');
const statusIcon = document.getElementById('status-icon');

const itemsList = document.getElementById('items-list');
const itemsLoading = document.getElementById('items-loading');
const itemsEmpty = document.getElementById('items-empty');

const itemDetail = document.getElementById('item-detail');
const backBtn = document.getElementById('back-btn');
const fillFormBtn = document.getElementById('fill-form-btn');
const markListedBtn = document.getElementById('mark-listed-btn');

// ============================================================
// Screen Management
// ============================================================

function showScreen(screenId) {
  [loginScreen, itemsScreen, detailScreen].forEach(s => s.classList.add('hidden'));
  document.getElementById(screenId).classList.remove('hidden');
}

function setStatus(text, type = 'success') {
  statusText.textContent = text;
  const icons = { success: '✅', error: '❌', warning: '⚠️', loading: '⏳' };
  statusIcon.textContent = icons[type] || '✅';
  const bar = document.getElementById('status-bar');
  bar.className = `status-bar ${type}`;
}

// ============================================================
// API URL Detection & API Calls
// ============================================================

let detectedApiUrl = null;

async function detectApiUrl() {
  if (detectedApiUrl) return detectedApiUrl;
  const urls = [CONFIG.API_URL, CONFIG.API_URL_FALLBACK].filter(Boolean);
  for (const url of urls) {
    try {
      const response = await fetch(`${url}/`, { method: 'GET', signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        detectedApiUrl = url;
        console.log(`[Sync] API detected at: ${url}`);
        return url;
      }
    } catch (e) {
      console.log(`[Sync] API not reachable at: ${url}`);
    }
  }
  detectedApiUrl = CONFIG.API_URL;
  return detectedApiUrl;
}

async function apiCall(endpoint, options = {}) {
  const session = await auth.getValidSession();
  if (!session) throw new Error('Not authenticated. Please log in again.');

  const baseUrl = await detectApiUrl();
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };

  let response = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  // If 401, try refreshing token once
  if (response.status === 401) {
    const refreshed = await auth.refreshSession(session);
    if (refreshed) {
      const retryHeaders = { ...headers, 'Authorization': `Bearer ${refreshed.access_token}` };
      response = await fetch(url, {
        ...options,
        headers: { ...retryHeaders, ...options.headers },
      });
    }
    if (!response.ok) {
      await auth.clearSession();
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

// ============================================================
// Items Management
// ============================================================

async function loadItems() {
  itemsLoading.classList.remove('hidden');
  itemsList.innerHTML = '';
  itemsEmpty.classList.add('hidden');
  setStatus('Loading items...', 'loading');

  try {
    const data = await apiCall('/api/items');
    currentItems = data.items || data || [];

    if (currentItems.length === 0) {
      itemsEmpty.classList.remove('hidden');
      setStatus('No items yet', 'warning');
    } else {
      renderItems(currentItems);
      setStatus(`${currentItems.length} items ready`, 'success');
    }
  } catch (err) {
    console.error('Failed to load items:', err);
    setStatus('Failed to load items', 'error');
    itemsEmpty.classList.remove('hidden');
    itemsEmpty.querySelector('p').textContent = `Error: ${err.message}`;
  } finally {
    itemsLoading.classList.add('hidden');
  }
}

function renderItems(items) {
  itemsList.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    if (item.item_id === selectedItemId) card.classList.add('selected');
    if (selectedBatchItems.has(item.item_id)) card.classList.add('batch-selected');

    const statusClass = item.listing_status ? `status-${item.listing_status}` : 'status-draft';
    const statusLabel = formatStatus(item.listing_status || 'draft');

    card.innerHTML = `
      <input type="checkbox" class="item-checkbox" data-item-id="${item.item_id}" ${selectedBatchItems.has(item.item_id) ? 'checked' : ''}>
      ${item.image_url
        ? `<img class="item-card-image" src="${item.image_url}" alt="${item.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
           <div class="item-card-image-placeholder" style="display:none">📦</div>`
        : `<div class="item-card-image-placeholder">📦</div>`
      }
      <div class="item-card-info">
        <div class="item-card-title">${escapeHtml(item.title)}</div>
        <div class="item-card-meta">${escapeHtml(item.category || '')} · ${escapeHtml(item.room || '')}</div>
      </div>
      <span class="item-card-status ${statusClass}">${statusLabel}</span>
      <span class="item-card-price">${escapeHtml(item.price || '')}</span>
    `;

    // Checkbox click: toggle batch selection (stop propagation to prevent card click)
    const checkbox = card.querySelector('.item-checkbox');
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target.checked) {
        selectedBatchItems.add(item.item_id);
        card.classList.add('batch-selected');
      } else {
        selectedBatchItems.delete(item.item_id);
        card.classList.remove('batch-selected');
      }
      updateBatchBar();
    });

    // Card click: show detail (only if not clicking checkbox)
    card.addEventListener('click', function(e) {
      if (e.target.classList.contains('item-checkbox')) return;
      selectItem(item, this);
    });
    
    itemsList.appendChild(card);
  });

  updateBatchBar();
}

function updateBatchBar() {
  const batchBar = document.getElementById('batch-bar');
  const batchCount = document.getElementById('batch-count');
  const count = selectedBatchItems.size;
  
  if (count > 0) {
    batchBar.classList.remove('hidden');
    batchCount.textContent = `${count} selected`;
  } else {
    batchBar.classList.add('hidden');
  }
  
  // Update select-all checkbox
  const selectAll = document.getElementById('select-all-checkbox');
  if (selectAll) {
    selectAll.checked = currentItems.length > 0 && selectedBatchItems.size === currentItems.length;
  }
}

// Select All checkbox
document.getElementById('select-all-checkbox').addEventListener('change', (e) => {
  if (e.target.checked) {
    currentItems.forEach(item => selectedBatchItems.add(item.item_id));
  } else {
    selectedBatchItems.clear();
  }
  renderItems(currentItems);
});

// Stop Batch button
document.getElementById('batch-stop-btn').addEventListener('click', () => {
  if (!isBatchRunning) return;
  chrome.runtime.sendMessage({ action: 'STOP_BATCH' });
  document.getElementById('progress-text').textContent = '⏹ Stopping...';
});

// Batch List button
document.getElementById('batch-list-btn').addEventListener('click', async () => {
  if (isBatchRunning || selectedBatchItems.size === 0) return;
  
  isBatchRunning = true;
  const batchBar = document.getElementById('batch-bar');
  const batchProgress = document.getElementById('batch-progress');
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');
  
  // Get full item data for selected items
  const items = currentItems.filter(item => selectedBatchItems.has(item.item_id));
  const totalItems = items.length;
  
  // Show progress
  batchBar.classList.add('hidden');
  batchProgress.classList.remove('hidden');
  progressText.textContent = `Starting batch list for ${totalItems} items...`;
  progressFill.style.width = '0%';
  
  try {
    // Get auth session
    const session = await auth.getValidSession();
    if (!session) throw new Error('Not authenticated');
    
    // Send batch request to background script
    chrome.runtime.sendMessage({
      action: 'START_BATCH',
      items: items,
      token: session.access_token,
      apiUrl: detectedApiUrl || CONFIG.API_URL,
    });
    
    setStatus(`Batch listing ${totalItems} items...`, 'loading');
  } catch (err) {
    progressText.textContent = `❌ Error: ${err.message}`;
    isBatchRunning = false;
    batchProgress.classList.add('hidden');
    batchBar.classList.remove('hidden');
  }
});

// Listen for batch progress updates from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'BATCH_PROGRESS') {
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');
    const batchProgress = document.getElementById('batch-progress');
    
    batchProgress.classList.remove('hidden');
    progressText.textContent = message.text;
    
    if (message.current && message.total) {
      const pct = Math.round((message.current / message.total) * 100);
      progressFill.style.width = `${pct}%`;
    }
    
    sendResponse({ ok: true });
  }
  
  if (message.action === 'BATCH_COMPLETE') {
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');
    const batchProgress = document.getElementById('batch-progress');
    
    progressFill.style.width = '100%';
    progressText.textContent = `✅ Batch complete! ${message.success} succeeded, ${message.failed} failed.`;
    
    isBatchRunning = false;
    selectedBatchItems.clear();
    setStatus(`Batch done: ${message.success} listed`, 'success');
    
    // Hide progress after a few seconds
    setTimeout(() => {
      batchProgress.classList.add('hidden');
      updateBatchBar();
      loadItems(); // Refresh items
    }, 5000);
    
    sendResponse({ ok: true });
  }
  
  return true;
});

function selectItem(item, cardElement) {
  selectedItemId = item.item_id;
  chrome.storage.local.set({ selected_item_id: item.item_id });

  // Update selection visual
  document.querySelectorAll('.item-card').forEach(c => c.classList.remove('selected'));
  if (cardElement) cardElement.classList.add('selected');

  // Show detail screen
  showItemDetail(item);
}

function showItemDetail(item) {
  const desc = item.description_de || item.description_en || 'No description';
  
  itemDetail.innerHTML = `
    ${item.image_url
      ? `<img class="item-detail-image" src="${item.image_url}" alt="${item.title}" onerror="this.style.display='none'">`
      : ''
    }
    <div class="item-detail-title">${escapeHtml(item.title)}</div>
    <div class="item-detail-price">${escapeHtml(item.price || 'No price')}</div>
    <div class="item-detail-category">${escapeHtml(item.category || '')} · ${escapeHtml(item.room || '')}</div>
    <div class="item-detail-description">${escapeHtml(desc)}</div>
  `;

  // Update mark-listed button state
  if (item.listing_status === 'listed_kleinanzeigen') {
    markListedBtn.textContent = '✅ Already Listed';
    markListedBtn.disabled = true;
  } else {
    markListedBtn.textContent = '✅ Mark as Listed on Kleinanzeigen';
    markListedBtn.disabled = false;
  }

  showScreen('detail-screen');
}

// ============================================================
// Event Handlers
// ============================================================

// Sign Up / Login Toggle
let isSignUpMode = false;
const signupToggleLink = document.getElementById('signup-toggle-link');
const signupText = document.getElementById('signup-text');

signupToggleLink.addEventListener('click', (e) => {
  e.preventDefault();
  isSignUpMode = !isSignUpMode;
  if (isSignUpMode) {
    loginBtn.textContent = 'Sign Up';
    signupText.textContent = 'Already have an account?';
    signupToggleLink.textContent = 'Log In';
  } else {
    loginBtn.textContent = 'Log In';
    signupText.textContent = "Don't have an account?";
    signupToggleLink.textContent = 'Sign Up';
  }
  loginError.classList.add('hidden');
});

// Login Form
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  loginBtn.disabled = true;

  try {
    if (isSignUpMode) {
      loginBtn.textContent = 'Creating account...';
      const result = await auth.signUp(emailInput.value, passwordInput.value);
      
      if (result.needsConfirmation) {
        loginError.textContent = '✅ Account created! Please check your email to confirm, then log in.';
        loginError.classList.remove('hidden');
        loginError.style.color = '#86B817';
        // Switch back to login mode
        isSignUpMode = false;
        loginBtn.textContent = 'Log In';
        signupText.textContent = "Don't have an account?";
        signupToggleLink.textContent = 'Sign Up';
        return;
      }
      
      await auth.setSession(result);
      userEmailSpan.textContent = result.user.email;
      showScreen('items-screen');
      await loadItems();
    } else {
      loginBtn.textContent = 'Logging in...';
      const session = await auth.signIn(emailInput.value, passwordInput.value);
      await auth.setSession(session);
      userEmailSpan.textContent = session.user.email;
      showScreen('items-screen');
      await loadItems();
    }
  } catch (err) {
    loginError.textContent = err.message || (isSignUpMode ? 'Sign up failed.' : 'Login failed. Check your credentials.');
    loginError.classList.remove('hidden');
    loginError.style.color = '';
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = isSignUpMode ? 'Sign Up' : 'Log In';
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await auth.clearSession();
  currentItems = [];
  selectedItemId = null;
  emailInput.value = '';
  passwordInput.value = '';
  showScreen('login-screen');
});

// Refresh Items
refreshBtn.addEventListener('click', loadItems);

// Back from detail
backBtn.addEventListener('click', () => {
  showScreen('items-screen');
});

// Fill Form - sends selected item to content script
fillFormBtn.addEventListener('click', async () => {
  if (!selectedItemId) {
    setStatus('Select an item first', 'warning');
    return;
  }

  try {
    // Get full item data
    const item = await apiCall(`/api/items/${selectedItemId}`);
    
    // Send to content script via chrome messaging
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url || !tab.url.includes('kleinanzeigen.de')) {
      setStatus('Open Kleinanzeigen listing page first!', 'warning');
      return;
    }

    await chrome.tabs.sendMessage(tab.id, {
      action: 'FILL_FORM',
      item: item,
    });

    setStatus('Form filled! Check Kleinanzeigen.', 'success');
  } catch (err) {
    console.error('Fill form error:', err);
    setStatus(`Error: ${err.message}`, 'error');
  }
});

// Mark as Listed
markListedBtn.addEventListener('click', async () => {
  if (!selectedItemId) return;

  try {
    markListedBtn.disabled = true;
    markListedBtn.textContent = 'Updating...';
    
    await apiCall(`/api/items/${selectedItemId}/mark-listed`, {
      method: 'PATCH',
      body: JSON.stringify({ platform: 'kleinanzeigen' }),
    });

    setStatus('Marked as listed! 🎉', 'success');
    markListedBtn.textContent = '✅ Already Listed';
    
    // Refresh items in background
    await loadItems();
  } catch (err) {
    setStatus(`Error: ${err.message}`, 'error');
    markListedBtn.disabled = false;
    markListedBtn.textContent = '✅ Mark as Listed on Kleinanzeigen';
  }
});

// ============================================================
// Utility Functions
// ============================================================

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatStatus(status) {
  const labels = {
    'draft': 'Draft',
    'listed_kleinanzeigen': 'Listed',
    'listed_ebay': 'eBay',
    'sold': 'Sold',
  };
  return labels[status] || status || 'Draft';
}

// ============================================================
// Initialize
// ============================================================

async function init() {
  auth = new SupabaseAuth(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

  // Detect API URL in background
  detectApiUrl();

  // Check for existing session (with auto-refresh)
  const session = await auth.getValidSession();
  
  if (session) {
    userEmailSpan.textContent = session.user?.email || 'User';
    showScreen('items-screen');
    
    // Restore selected item
    const stored = await chrome.storage.local.get(['selected_item_id']);
    if (stored.selected_item_id) selectedItemId = stored.selected_item_id;
    
    await loadItems();
  } else {
    showScreen('login-screen');
  }
}

init();