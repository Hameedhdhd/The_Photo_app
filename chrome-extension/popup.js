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
      expires_at: data.expires_at,
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
}

// ============================================================
// App State
// ============================================================

let auth;
let currentItems = [];
let selectedItemId = null;

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
// API Calls
// ============================================================

async function apiCall(endpoint, options = {}) {
  const session = await auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const url = `${CONFIG.API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };

  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

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

    const statusClass = item.listing_status ? `status-${item.listing_status}` : 'status-draft';
    const statusLabel = formatStatus(item.listing_status || 'draft');

    card.innerHTML = `
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

    card.addEventListener('click', () => selectItem(item));
    itemsList.appendChild(card);
  });
}

function selectItem(item) {
  selectedItemId = item.item_id;
  chrome.storage.local.set({ selected_item_id: item.item_id });

  // Update selection visual
  document.querySelectorAll('.item-card').forEach(c => c.classList.remove('selected'));
  event.currentTarget.classList.add('selected');

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

  // Check for existing session
  const session = await auth.getSession();
  
  if (session && !auth.isSessionExpired(session)) {
    userEmailSpan.textContent = session.user?.email || 'User';
    showScreen('items-screen');
    
    // Restore selected item
    const stored = await chrome.storage.local.get(['selected_item_id']);
    if (stored.selected_item_id) selectedItemId = stored.selected_item_id;
    
    await loadItems();
  } else {
    if (session) {
      await auth.clearSession();
    }
    showScreen('login-screen');
  }
}

init();