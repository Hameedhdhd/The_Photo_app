/**
 * Injected Script - Runs in MAIN world to bypass React upload protections
 * Key insight: Kleinanzeigen uses a hidden file input with class="hidden"
 */

console.log('[KA] Inject script loading in MAIN world...');

const SEL = {
  title: ['input#ad-title', 'input[name="title"]', '#post-ad-title', '[data-testid="ad-title"]', 'input[placeholder*="Titel"]'],
  desc: ['textarea#ad-description', 'textarea[name="description"]', '#post-ad-description', '[data-testid="ad-description"]', 'textarea[placeholder*="Beschreibung"]'],
  price: ['input#ad-price-amount', 'input[name="priceAmount"]', '#post-ad-price', '[data-testid="ad-price"]', 'input[name*="price"]'],
  previews: ['img[src^="blob:"]'],
};

function find(s) { for (const sel of s) { try { const el = document.querySelector(sel); if (el) return el; } catch {} } return null; }
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function getReactProps(el) { if (!el) return null; const k = Object.keys(el).find(k => k.startsWith('__reactProps$')); return k ? el[k] : null; }

function setVal(el, val) {
  if (!el) return;
  el.focus();
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, val); else el.value = val;
  
  try { el.selectionStart = el.selectionEnd = val.length; } catch(e) {}

  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Extra push for React
  el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  el.blur();
}

function kaLog(msg, type) {
  console.log('[KA] ' + msg);
  // Use postMessage to communicate with ISOLATED world (CustomEvent doesn't cross worlds)
  window.postMessage({ source: 'KA_INJECT', action: 'KA_LOG', text: msg, type: type || 'info' }, '*');
}

async function dataUrlToFile(dataUrl, i) {
  try {
    // Try fetch first
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return new File([blob], `photo_${i + 1}.jpg`, { type: blob.type || 'image/jpeg' });
    } catch (fetchErr) {
      // Fallback: manual base64 decode if fetch fails
      const parts = dataUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)[1];
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      return new File([u8arr], `photo_${i + 1}.jpg`, { type: mime });
    }
  } catch (e) { kaLog('dataUrlToFile failed: ' + e.message, 'error'); return null; }
}

function checkPreviews() {
  // Kleinanzeigen previews often use blob: URLs, but let's be more broad
  const blobImgs = document.querySelectorAll('img[src^="blob:"]');
  const uploadContainerImgs = document.querySelectorAll('.upload-container img, [class*="Upload"] img');
  const total = blobImgs.length + uploadContainerImgs.length;
  kaLog('Preview check: ' + total + ' images found (blob=' + blobImgs.length + ')');
  return total > 0;
}

// ============================================================
// PHOTO UPLOAD - Unhide hidden input, set files, fire events
// ============================================================

async function uploadPhotos(imageBlobs) {
  if (!imageBlobs?.length) return true;
  kaLog('=== PHOTO UPLOAD START (' + imageBlobs.length + ' images) ===');

  const files = [];
  for (let i = 0; i < imageBlobs.length; i++) {
    const f = await dataUrlToFile(imageBlobs[i], i);
    if (f) { files.push(f); kaLog('File ' + (i+1) + ': ' + f.name + ' ' + (f.size/1024).toFixed(0) + 'KB'); }
  }
  if (!files.length) { kaLog('No files created', 'error'); return false; }

  const dt = new DataTransfer();
  files.forEach(f => dt.items.add(f));

  // STRATEGY 1: Unhide hidden file input, set files via native setter, fire React onChange
  kaLog('Strategy 1: Unhide + native setter + React onChange');
  const fileInput = document.querySelector('input[type="file"]');
  if (fileInput) {
    kaLog('Found input: accept=' + fileInput.accept + ' class=' + fileInput.className);
    
    // Unhide the input (Kleinanzeigen sets class="hidden")
    fileInput.classList.remove('hidden');
    fileInput.style.cssText = 'display:block!important;visibility:visible!important;position:fixed!important;opacity:1!important;width:1px!important;height:1px!important;z-index:99999!important;top:0!important;left:0!important;';
    
    // Set files using native setter to bypass React override
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files')?.set;
    if (nativeSetter) {
      kaLog('Using native files setter');
      nativeSetter.call(fileInput, dt.files);
    } else {
      fileInput.files = dt.files;
    }
    
    // Try React's internal onChange
    const reactProps = getReactProps(fileInput);
    if (reactProps?.onChange) {
      kaLog('Found React onChange - calling directly');
      try {
        reactProps.onChange({
          target: fileInput, currentTarget: fileInput,
          preventDefault: () => {}, stopPropagation: () => {},
          nativeEvent: new Event('change'), type: 'change', persist: () => {},
        });
        await wait(3000);
        if (checkPreviews()) { kaLog('✅ Strategy 1 SUCCESS (React onChange)', 'info'); return true; }
      } catch (e) { kaLog('React onChange failed: ' + e.message, 'warn'); }
    }
    
    // Try DOM events
    kaLog('Trying DOM change event');
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    fileInput.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(3000);
    if (checkPreviews()) { kaLog('✅ Strategy 1 SUCCESS (DOM events)', 'info'); return true; }
    
    // Restore hidden
    fileInput.style.cssText = '';
    fileInput.classList.add('hidden');
  } else {
    kaLog('No file input found', 'warn');
  }

  // STRATEGY 2: Find addImage button's associated input
  kaLog('Strategy 2: Find addImage button container');
  const allButtons = document.querySelectorAll('button');
  for (const btn of allButtons) {
    if (btn.querySelector('svg[data-title="addImage"]')) {
      kaLog('Found addImage button');
      const container = btn.closest('.flex.w-full.flex-col') || btn.parentElement?.parentElement;
      const inp = container?.querySelector('input[type="file"]');
      if (inp) {
        kaLog('Found associated input in container');
        inp.classList.remove('hidden');
        inp.style.cssText = 'display:block!important;';
        const ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files')?.set;
        if (ns) ns.call(inp, dt.files); else inp.files = dt.files;
        
        const rp = getReactProps(inp);
        if (rp?.onChange) {
          try { rp.onChange({ target: inp, currentTarget: inp, preventDefault:()=>{}, stopPropagation:()=>{}, type:'change', persist:()=>{} }); } catch {}
        }
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        await wait(3000);
        if (checkPreviews()) { kaLog('✅ Strategy 2 SUCCESS', 'info'); return true; }
      }
      break;
    }
  }

  // STRATEGY 3: Walk up DOM looking for onDrop
  kaLog('Strategy 3: Walk DOM for onDrop handler');
  let el = fileInput;
  while (el && el !== document.body) {
    const props = getReactProps(el);
    if (props?.onDrop) {
      kaLog('Found onDrop on ' + el.tagName);
      try {
        props.onDrop({ dataTransfer: dt, preventDefault:()=>{}, stopPropagation:()=>{}, type:'drop', target:el, currentTarget:el, persist:()=>{} });
        await wait(3000);
        if (checkPreviews()) { kaLog('✅ Strategy 3 SUCCESS', 'info'); return true; }
      } catch (e) { kaLog('onDrop failed: ' + e.message, 'warn'); }
    }
    el = el.parentElement;
  }

  // STRATEGY 4: Brute force all inputs
  kaLog('Strategy 4: Brute force all inputs');
  const allInputs = document.querySelectorAll('input[type="file"]');
  kaLog('Found ' + allInputs.length + ' file inputs');
  for (const input of allInputs) {
    input.classList.remove('hidden');
    input.style.cssText = 'display:block!important;';
    const ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files')?.set;
    if (ns) ns.call(input, dt.files); else input.files = dt.files;
    const rp = getReactProps(input);
    if (rp?.onChange) { try { rp.onChange({ target:input, currentTarget:input, preventDefault:()=>{}, stopPropagation:()=>{}, type:'change', persist:()=>{} }); } catch {} }
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await wait(1500);
    if (checkPreviews()) { kaLog('✅ Strategy 4 SUCCESS', 'info'); return true; }
  }

  kaLog('❌ ALL STRATEGIES FAILED', 'error');
  kaLog('Diagnostics: inputs=' + document.querySelectorAll('input[type="file"]').length + ' blobImgs=' + document.querySelectorAll('img[src^="blob:"]').length, 'error');
  return false;
}

// ============================================================
// FILL FORM - Photos FIRST, then text
// ============================================================

async function fillForm(item) {
  kaLog('=== FILL FORM START ===');
  kaLog('Title: ' + (item.title || '').substring(0, 40));
  kaLog('Images: ' + (item.imageBlobs?.length || 0));

  kaLog('Step 1: Filling text...');
  try { const el = await waitFor(SEL.title, 5000); setVal(el, item.title || ''); kaLog('✅ Title'); } catch { kaLog('Title not found', 'warn'); }
  try { const el = await waitFor(SEL.desc, 5000); setVal(el, item.description || ''); kaLog('✅ Description'); } catch { kaLog('Desc not found', 'warn'); }
  try {
    const el = await waitFor(SEL.price, 5000);
    const p = String(item.price || '').replace(/[^\d.,]/g, '').replace(',', '.');
    if (p) setVal(el, p);
    kaLog('✅ Price: ' + p);
  } catch { kaLog('Price not found', 'warn'); }

  if (item.imageBlobs?.length) {
    kaLog('Step 2: Uploading photos...');
    await uploadPhotos(item.imageBlobs);
    await wait(1000);
  }

  kaLog('=== FILL FORM COMPLETE ===');
  window.dispatchEvent(new CustomEvent('KA_FILL_COMPLETE', { detail: { success: true } }));
}

function waitFor(selList, timeout) {
  return new Promise((resolve, reject) => {
    const el = find(selList);
    if (el) return resolve(el);
    const obs = new MutationObserver(() => { const el = find(selList); if (el) { obs.disconnect(); resolve(el); } });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { obs.disconnect(); reject(new Error('Timeout')); }, timeout || 10000);
  });
}

function findDraftButton() {
  const allBtns = document.querySelectorAll('button, a[role="button"]');
  for (const b of allBtns) {
    const txt = (b.textContent || '').trim().toLowerCase();
    if (txt.includes('entwurf') || txt.includes('draft')) return b;
  }
  return null;
}

function captureForm() {
  const title = find(SEL.title)?.value || '';
  const description = find(SEL.desc)?.value || '';
  const price = find(SEL.price)?.value || '';
  const images = [];
  document.querySelectorAll('img[src^="blob:"]').forEach(img => {
    try { const c = document.createElement('canvas'); c.width = img.naturalWidth||400; c.height = img.naturalHeight||300; c.getContext('2d').drawImage(img,0,0); images.push(c.toDataURL('image/jpeg',0.6)); } catch {}
  });
  return { title, description, price, images };
}

// Bridge - Listen for postMessage from ISOLATED world (content.js)
window.addEventListener('message', (e) => {
  if (e.data?.source !== 'KA_BRIDGE') return;
  
  if (e.data.action === 'KA_EXECUTE_FILL') {
    fillForm(e.data.item).catch(err => kaLog('Fill error: ' + err.message, 'error'));
  }
  if (e.data.action === 'KA_EXECUTE_CAPTURE') {
    window.postMessage({ source: 'KA_INJECT', action: 'KA_CAPTURE_RESULT', detail: captureForm() }, '*');
  }
  if (e.data.action === 'KA_EXECUTE_SAVE_DRAFT') {
    const btn = findDraftButton();
    if (btn) { kaLog('Clicking draft save'); btn.click(); } else kaLog('No draft button', 'warn');
    window.postMessage({ source: 'KA_INJECT', action: 'KA_SAVE_DRAFT_RESULT', detail: { success: !!btn } }, '*');
  }
});

kaLog('MAIN world script ready');