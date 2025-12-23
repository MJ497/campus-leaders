// profile.js — full patched version
// Single-file profile + posts grid + robust author fetch helpers
// Paste/replace your existing profile.js with this.

// ------------------------------ Firebase init ------------------------------
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDC3L5vruhYXfarn5O81cLld50oagYkmxE",
  authDomain: "campus-leaders.firebaseapp.com",
  projectId: "campus-leaders",
  storageBucket: "campus-leaders.firebasestorage.app",
  messagingSenderId: "445360528951",
  appId: "1:445360528951:web:712da8859c8ac4cb6129b2"
};

// UPLOADCARE settings (matches sign.js)
const UPLOADCARE_PUBLIC_KEY = "2683b7806064b3db73e3";
const UPLOADCARE_BASE_UPLOAD = "https://upload.uploadcare.com/base/";
const UPLOADCARE_CDN = "https://12hsb3bgrj.ucarecd.net/";

// Init firebase once
if (window.firebase && FIREBASE_CONFIG && FIREBASE_CONFIG.projectId) {
  try { if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG); } catch (e) { console.warn('Firebase init error', e); }
}
const auth = (window.firebase ? firebase.auth() : null);
const db = (window.firebase ? firebase.firestore() : null);
const storage = (window.firebase && firebase.storage ? firebase.storage() : null);

// ------------------------------ DOM refs ------------------------------
const profileAvatar = document.getElementById('profile-avatar');
const navAvatar = document.getElementById('nav-avatar');
const profileFullname = document.getElementById('profile-fullname');
const profilePosition = document.getElementById('profile-position');
const profileSchool = document.getElementById('profile-school');
const profileYear = document.getElementById('profile-year');
const profileAssoc = document.getElementById('profile-assoc');
const profileState = document.getElementById('profile-state');

const firstNameEl = document.getElementById('firstName');
const lastNameEl = document.getElementById('lastName');
const emailEl = document.getElementById('email');
const phoneEl = document.getElementById('phone');
const bioEl = document.getElementById('bio');
const associationEl = document.getElementById('association');
const stateEl = document.getElementById('state');

const editBtn = document.getElementById('edit-profile-btn');
const editModal = document.getElementById('edit-modal');
const closeEdit = document.getElementById('close-edit');
const cancelEdit = document.getElementById('cancel-edit');
const saveProfileBtn = document.getElementById('save-profile');

let inputFirst = document.getElementById('input-firstName');
let inputLast = document.getElementById('input-lastName');
let inputPosition = document.getElementById('input-position');
let inputEmail = document.getElementById('input-email');
let inputPhone = document.getElementById('input-phone');
let inputSchool = document.getElementById('input-schoolName');
let inputYear = document.getElementById('input-yearHeld');
let inputAssoc = document.getElementById('input-association');
let inputState = document.getElementById('input-stateName');
let inputBio = document.getElementById('input-bio');
let inputImage = document.getElementById('input-image');
let inputImageName = document.getElementById('input-image-name');

const downloadBtn = document.getElementById('download-json'); // main Download button in UI
const exportVcardBtn = document.getElementById('download-vcard');
const toast = document.getElementById('toast');

// old activity area (kept for backward compatibility if present)
const profileActivityPosts = document.getElementById('profile-activity-posts');

// Posts grid area ids (these must exist in your page)
const POSTS_GRID_ID = 'user-posts-grid';
const POSTS_LOADING_ID = 'posts-loading';
const NO_POSTS_ID = 'no-posts';

// ------------------------------ small helpers ------------------------------
function showToast(msg, bg = '#111827', ms = 2500) {
  if (!toast) { alert(msg); return; }
  toast.textContent = msg;
  toast.style.background = bg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), ms);
}

function escapeHtml(s){ if(s === undefined || s === null) return ''; return s.toString().replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

function normalizeImgurUrl(url){
  if(!url) return '';
  try{
    const u = url.trim();
    if(/^https?:\/\/i\.imgur\.com\//i.test(u)) return u;
    const m = u.match(/imgur\.com\/(?:a\/|gallery\/)?([A-Za-z0-9]+)/i);
    if(m && m[1]) return 'https://i.imgur.com/' + m[1] + '.jpg';
    return u;
  }catch(e){ return url; }
}

// timeSince helper (human-readable)
function timeSince(date){
  if(!date) return '';
  const now = (new Date()).getTime();
  const then = (date instanceof Date) ? date.getTime() : new Date(date).getTime();
  const seconds = Math.floor((now - then)/1000);
  if(seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds/60);
  if(minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes/60);
  if(hours < 24) return `${hours}h`;
  const days = Math.floor(hours/24);
  if(days < 30) return `${days}d`;
  const months = Math.floor(days/30);
  if(months < 12) return `${months}mo`;
  const years = Math.floor(months/12);
  return `${years}y`;
}

// ------------------------------ populateProfile ------------------------------
let currentUser = null;
let currentUserDoc = null;
let uploadedImageFile = null;

async function populateProfile(user) {
  currentUser = user;
  if (!user) {
    profileFullname && (profileFullname.textContent = 'Guest');
    profilePosition && (profilePosition.textContent = '');
    profileSchool && (profileSchool.textContent = '');
    profileYear && (profileYear.textContent = '');
    profileAssoc && (profileAssoc.textContent = '');
    profileState && (profileState.textContent = '');
    firstNameEl && (firstNameEl.textContent = '—');
    lastNameEl && (lastNameEl.textContent = '—');
    emailEl && (emailEl.textContent = 'Not signed in');
    phoneEl && (phoneEl.textContent = '—');
    bioEl && (bioEl.textContent = 'Sign in to manage your profile.');
    associationEl && (associationEl.textContent = '');
    stateEl && (stateEl.textContent = '');
    if (navAvatar) navAvatar.innerHTML = '<i class="fas fa-user"></i>';
    return;
  }

  try {
    const doc = await db.collection('users').doc(user.uid).get();
    currentUserDoc = doc.exists ? doc.data() : null;
  } catch (e) { console.warn('Error reading user doc', e); currentUserDoc = null; }

  const first = currentUserDoc?.firstName || (user.displayName ? user.displayName.split(' ')[0] : '') || '';
  const last = currentUserDoc?.lastName || (user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '') || '';
  const position = currentUserDoc?.position || '';
  const email = user.email || '';
  const phone = currentUserDoc?.phone || user.phoneNumber || '';
  const bio = currentUserDoc?.bio || '';
  const school = currentUserDoc?.schoolName || '';
  const year = currentUserDoc?.yearHeld || '';
  const assoc = currentUserDoc?.association || '';
  const state = currentUserDoc?.stateName || '';
  const imageUrl = currentUserDoc?.imageUrl || user.photoURL || null;

  profileFullname && (profileFullname.textContent = [first, last].filter(Boolean).join(' ') || (user.displayName || 'Member'));
  profilePosition && (profilePosition.textContent = position);
  profileSchool && (profileSchool.textContent = school);
  profileYear && (profileYear.textContent = year);
  profileAssoc && (profileAssoc.textContent = assoc);
  profileState && (profileState.textContent = state);

  firstNameEl && (firstNameEl.textContent = first || '—');
  lastNameEl && (lastNameEl.textContent = last || '—');
  emailEl && (emailEl.textContent = email || '—');
  phoneEl && (phoneEl.textContent = phone || '—');
  bioEl && (bioEl.textContent = bio || '—');
  associationEl && (associationEl.textContent = assoc || '—');
  stateEl && (stateEl.textContent = state || '—');

  // avatar
  if (imageUrl) {
    if (profileAvatar) {
      profileAvatar.innerHTML = '';
      const img = document.createElement('img'); img.src = imageUrl; img.alt = profileFullname?.textContent || 'avatar';
      img.className = 'h-full w-full object-cover'; img.loading = 'lazy';
      img.onerror = () => { profileAvatar.innerHTML = '<i class="fas fa-user text-2xl"></i>'; };
      profileAvatar.appendChild(img);
    }
    if (navAvatar) {
      navAvatar.innerHTML = '';
      const nimg = document.createElement('img'); nimg.src = imageUrl; nimg.alt = 'nav avatar';
      nimg.className = 'h-full w-full object-cover rounded-full'; nimg.loading = 'lazy';
      nimg.onerror = () => { navAvatar.innerHTML = '<i class="fas fa-user"></i>'; };
      navAvatar.appendChild(nimg);
    }
  } else {
    if (profileAvatar) profileAvatar.innerHTML = '<i class="fas fa-user text-2xl"></i>';
    if (navAvatar) navAvatar.innerHTML = '<i class="fas fa-user"></i>';
  }

  // populate edit form inputs (if present)
  if (inputFirst) inputFirst.value = currentUserDoc?.firstName || '';
  if (inputLast) inputLast.value = currentUserDoc?.lastName || '';
  if (inputPosition) inputPosition.value = currentUserDoc?.position || '';
  if (inputEmail) inputEmail.value = user.email || '';
  if (inputPhone) inputPhone.value = currentUserDoc?.phone || '';
  if (inputSchool) inputSchool.value = currentUserDoc?.schoolName || '';
  if (inputYear) inputYear.value = currentUserDoc?.yearHeld || '';
  if (inputAssoc) inputAssoc.value = currentUserDoc?.association || '';
  if (inputState) inputState.value = currentUserDoc?.stateName || '';
  if (inputBio) inputBio.value = currentUserDoc?.bio || '';
}

// ------------------------------ Edit form handlers ------------------------------
if (editBtn) {
  editBtn.addEventListener('click', () => {
    if (!auth || !auth.currentUser) { showToast('Please sign in to edit your profile', '#dc2626'); return; }
    openEditModal();
  });
}
if (closeEdit) closeEdit.addEventListener('click', closeEditModal);
if (cancelEdit) cancelEdit.addEventListener('click', (e)=>{ e.preventDefault(); closeEditModal(); });

if (inputImage) {
  inputImage.addEventListener('change', (e)=>{
    const f = e.target.files[0]; if (!f) { if (inputImageName) inputImageName.textContent = ''; uploadedImageFile = null; return; }
    if (inputImageName) inputImageName.textContent = `${f.name} (${Math.round(f.size/1024)} KB)`;
    uploadedImageFile = f;
  });
}

function openEditModal(){ if(!editModal) return; editModal.classList.remove('hidden'); editModal.classList.add('flex'); }
function closeEditModal(){ if(!editModal) return; editModal.classList.add('hidden'); editModal.classList.remove('flex'); uploadedImageFile = null; if (inputImage) inputImage.value = ''; if (inputImageName) inputImageName.textContent = ''; }

// image upload to Uploadcare (matches sign.js)
async function uploadToImageKitServer(file) {
  if (!UPLOADCARE_PUBLIC_KEY) throw new Error('Uploadcare public key not set');
  const form = new FormData();
  form.append('file', file);
  form.append('UPLOADCARE_PUB_KEY', UPLOADCARE_PUBLIC_KEY);
  form.append('UPLOADCARE_STORE', '1'); // store and make available on CDN

  const resp = await fetch(UPLOADCARE_BASE_UPLOAD, {
    method: 'POST',
    body: form
  });

  const data = await resp.json();
  if (!resp.ok) {
    const msg = data?.error?.message || data?.detail || data?.message || JSON.stringify(data);
    throw new Error('Uploadcare upload failed: ' + msg);
  }

  // data.file contains uuid/path. Build CDN URL.
  const fileId = (data && data.file) ? String(data.file).replace(/^\/+|\/+$/g, '') : null;
  if (!fileId) throw new Error('Uploadcare did not return file id');
  // Ensure trailing slash for consistent usage
  const cdnUrl = `${UPLOADCARE_CDN.replace(/\/+$/,'')}/${fileId}/`;
  return cdnUrl;
}

if (saveProfileBtn) {
  saveProfileBtn.addEventListener('click', async () => {
    if (!auth || !auth.currentUser) { showToast('Not signed in', '#dc2626'); return; }
    saveProfileBtn.disabled = true; const origText = saveProfileBtn.textContent; saveProfileBtn.textContent = 'Saving...';
    try {
      const uid = auth.currentUser.uid; const updates = {
        firstName: (inputFirst?.value || '').trim() || null,
        lastName: (inputLast?.value || '').trim() || null,
        position: (inputPosition?.value || '').trim() || null,
        phone: (inputPhone?.value || '').trim() || null,
        schoolName: (inputSchool?.value || '').trim() || null,
        yearHeld: (inputYear?.value || '').trim() || null,
        association: (inputAssoc?.value || '').trim() || null,
        stateName: (inputState?.value || '').trim() || null,
        bio: (inputBio?.value || '').trim() || null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (uploadedImageFile) {
        try { const imgUrl = await uploadToImageKitServer(uploadedImageFile); if (imgUrl) updates.imageUrl = imgUrl; } catch (err) { console.warn('Image upload failed', err); showToast('Image upload failed', '#dc2626'); }
      }

      await db.collection('users').doc(uid).set(updates, { merge: true });

      const displayName = [updates.firstName, updates.lastName].filter(Boolean).join(' ') || auth.currentUser.displayName;
      const profileUpdates = {};
      if (displayName) profileUpdates.displayName = displayName;
      if (updates.imageUrl) profileUpdates.photoURL = updates.imageUrl;
      if (Object.keys(profileUpdates).length) await auth.currentUser.updateProfile(profileUpdates);

      const freshDoc = await db.collection('users').doc(uid).get(); currentUserDoc = freshDoc.exists ? freshDoc.data() : null;
      await populateProfile(auth.currentUser);
      showToast('Profile updated.');
      closeEditModal();
    } catch (err) { console.error('Save profile error', err); showToast('Failed to save profile', '#dc2626'); }
    finally { saveProfileBtn.disabled = false; saveProfileBtn.textContent = origText; }
  });
}

// ------------------------------ Exports (PDF/Doc/vCard) ------------------------------
// collectProfilePayload, ensureJsPdf, exportProfileToPDF, exportProfileToDocx, vCard wiring
function collectProfilePayload() {
  if (!auth || !auth.currentUser) return null;
  return {
    uid: auth.currentUser.uid,
    email: auth.currentUser.email,
    displayName: auth.currentUser.displayName,
    firstName: currentUserDoc?.firstName || inputFirst?.value || '',
    lastName: currentUserDoc?.lastName || inputLast?.value || '',
    position: currentUserDoc?.position || inputPosition?.value || '',
    phone: currentUserDoc?.phone || inputPhone?.value || '',
    schoolName: currentUserDoc?.schoolName || inputSchool?.value || '',
    yearHeld: currentUserDoc?.yearHeld || inputYear?.value || '',
    association: currentUserDoc?.association || inputAssoc?.value || '',
    stateName: currentUserDoc?.stateName || inputState?.value || '',
    bio: currentUserDoc?.bio || inputBio?.value || '',
    imageUrl: currentUserDoc?.imageUrl || auth.currentUser.photoURL || null,
    exportedAt: new Date().toISOString()
  };
}

async function ensureJsPdf() {
  if (window.jspdf) return window.jspdf;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = () => { resolve(window.jspdf || window.jspdf?.jsPDF || window.jspdf); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function exportProfileToPDF() {
  if (!auth || !auth.currentUser) { showToast('Sign in to export', '#dc2626'); return; }
  const payload = collectProfilePayload();
  if (!payload) { showToast('No profile data', '#dc2626'); return; }
  try {
    const jspdfLib = await ensureJsPdf();
    const { jsPDF } = jspdfLib; const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginLeft = 40; let y = 40;
    doc.setFontSize(18); doc.text(payload.displayName || `${payload.firstName} ${payload.lastName}`, marginLeft, y); y += 22;
    doc.setFontSize(11);
    const lines = [ 
      `Email: ${payload.email||''}`,
      `Phone: ${payload.phone||''}`, 
      `Position: ${payload.position||''}`, 
      `Association: ${payload.association||''}`,
      `School: ${payload.schoolName||''} ${payload.yearHeld?('('+payload.yearHeld+')'):''}`, 
      `State: ${payload.stateName||''}`, '' ];

    lines.forEach(line=>{ doc.text(line, marginLeft, y); y+=16; });
    if (payload.bio) { 
      y+=4; doc.setFontSize(12);
      doc.text('Bio:', marginLeft, y); 
      y+=14; doc.setFontSize(10);
      const pageWidth = doc.internal.pageSize.getWidth();
      const usableWidth = pageWidth - marginLeft*2; 
      const bioLines = doc.splitTextToSize(payload.bio, usableWidth); 
      doc.text(bioLines, marginLeft, y);
      y += bioLines.length*12 + 8;
    }
    if (payload.imageUrl) {
      try {
        const res = await fetch(payload.imageUrl); 
        const blob = await res.blob();
        const dataUrl = await new Promise(res2=>{
          const r=new FileReader();
          r.onload=()=>res2(r.result);
          r.readAsDataURL(blob);
        });
        const imgProps = doc.getImageProperties(dataUrl);
        const iw = 120; const ih = (imgProps.height/imgProps.width)*iw; 
        const pageW = doc.internal.pageSize.getWidth(); 
        doc.addImage(dataUrl, 'JPEG', pageW - marginLeft - iw, 40, iw, ih);
      } catch (err) { console.warn('Failed to add image to PDF', err); }
    }
    doc.setFontSize(9); 
    doc.text(`Exported: ${new Date().toLocaleString()}`, marginLeft, doc.internal.pageSize.getHeight() - 30);
    const filename = `${(payload.displayName || payload.email || 'profile')}_profile.pdf`.replace(/\s+/g,'_'); 
    doc.save(filename); showToast('PDF exported.');
  } catch (err) {
    console.error('PDF export failed', err); showToast('PDF export failed', '#dc2626');
  }
}

function exportProfileToDocx() {
  if (!auth || !auth.currentUser) { showToast('Sign in to export', '#dc2626'); return; }
  const payload = collectProfilePayload(); if (!payload) { showToast('No profile data', '#dc2626'); return; }
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(payload.displayName || 'Profile')}</title><style>body{font-family:Arial,Helvetica,sans-serif;color:#111827;padding:24px;}h1{font-size:20px;margin-bottom:6px}.meta{margin-bottom:12px;font-size:13px;color:#374151}.section{margin-bottom:10px}.label{font-weight:bold;color:#111827}.bio{white-space:pre-wrap;margin-top:6px;color:#111827}.avatar{float:right;margin-left:12px;width:120px;height:120px;object-fit:cover;border-radius:6px}</style></head><body>${payload.imageUrl?`<img src="${payload.imageUrl}" class="avatar"/>`:''}<h1>${escapeHtml(payload.displayName || (payload.firstName+' '+payload.lastName))}</h1><div class="meta">${payload.position?`<div><span class="label">Position:</span> ${escapeHtml(payload.position)}</div>`:''}${payload.schoolName?`<div><span class="label">School:</span> ${escapeHtml(payload.schoolName)} ${payload.yearHeld?('('+escapeHtml(payload.yearHeld)+')'):''}</div>`:''}${payload.association?`<div><span class="label">Association:</span> ${escapeHtml(payload.association)}</div>`:''}${payload.stateName?`<div><span class="label">State:</span> ${escapeHtml(payload.stateName)}</div>`:''}${payload.phone?`<div><span class="label">Phone:</span> ${escapeHtml(payload.phone)}</div>`:''}${payload.email?`<div><span class="label">Email:</span> ${escapeHtml(payload.email)}</div>`:''}</div>${payload.bio?`<div class="section"><div class="label">Bio</div><div class="bio">${escapeHtml(payload.bio)}</div></div>`:''}<div style="margin-top:24px;font-size:11px;color:#6b7280;">Exported: ${new Date().toLocaleString()}</div></body></html>`;
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const filename = `${(payload.displayName || payload.email || 'profile')}_profile.docx`.replace(/\s+/g,'_');
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); showToast('Word document exported.');
}

if (exportVcardBtn) {
  exportVcardBtn.addEventListener('click', (e)=>{
    e.preventDefault(); if (!auth || !auth.currentUser) { showToast('Sign in to export', '#dc2626'); return; }
    const fullname = profileFullname?.textContent || '';
    const email = emailEl?.textContent || '';
    const phone = phoneEl?.textContent || '';
    const lines = ['BEGIN:VCARD','VERSION:3.0', `FN:${fullname}`, email?`EMAIL;TYPE=INTERNET:${email}`:'', phone?`TEL;TYPE=CELL:${phone}`:'', 'END:VCARD'].filter(Boolean).join('\r\n');
    const blob = new Blob([lines], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = (fullname?fullname.replace(/\s+/g,'_'):'contact') + '.vcf'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); showToast('vCard exported.');
  });
}

if (downloadBtn) {
  downloadBtn.addEventListener('click', async (e)=>{
    e.preventDefault(); if (!auth || !auth.currentUser) { showToast('Sign in to export', '#dc2626'); return; }
    const useDoc = confirm('Click OK to download as Word (.docx). Click Cancel to download as PDF.');
    if (useDoc) exportProfileToDocx(); else await exportProfileToPDF();
  });
}

// ------------------------------ Sign out / menu wiring ------------------------------
const signOutBtn = document.getElementById('desktop-sign-out');
if (signOutBtn) {
  signOutBtn.addEventListener('click', async (e)=>{ e.preventDefault(); try { if (window.CampusLeaders && typeof window.CampusLeaders.signOutNow === 'function') { window.CampusLeaders.signOutNow(); } else { await auth.signOut(); showToast('Signed out.'); window.location.href = '/index.html'; } } catch (err) { console.error('Sign out failed', err); showToast('Sign out failed', '#dc2626'); } });
}
const userMenuButton = document.getElementById('user-menu-button');
const userMenu = document.getElementById('user-menu');
if (userMenuButton) {
  userMenuButton.addEventListener('click', (e)=>{ e.stopPropagation(); if (userMenu) userMenu.classList.toggle('hidden'); });
  document.addEventListener('click', (e)=>{ if (userMenu && !userMenu.contains(e.target) && !userMenuButton.contains(e.target)) userMenu.classList.add('hidden'); });
}
if (typeof doSearch !== 'function') window.doSearch = async function(q) { if (!q) return; alert('Search not available here.'); };

// ------------------------------ fetchPostsByAuthor (robust) ------------------------------
/**
 * Robustly fetch posts by an author (tries multiple common author fields,
 * falls back to client-side filtering if Firestore index errors occur).
 *
 * @param {string|null} authorId - preferred user UID (may be null)
 * @param {string|null} authorEmail - optional email
 * @param {number} limit - maximum items to return
 * @returns {Promise<Array<Object>>}
 */
async function fetchPostsByAuthor(authorId, authorEmail = '', limit = 50) {
  if (!db) {
    console.warn('No Firestore (db) available in fetchPostsByAuthor');
    return [];
  }

  const POSTS_COLLECTION = 'posts';
  const resultsMap = new Map();
  const maxLimit = Math.max(1, Math.min(limit || 50, 1000));

  const pushSnap = (snap) => {
    if (!snap || !snap.docs) return;
    snap.docs.forEach(d => {
      const data = { id: d.id, ...d.data() };
      resultsMap.set(data.id, data);
    });
  };

  // candidate queries in order of preference
  const queriesToTry = [];
  if (authorId) {
    queriesToTry.push(() => db.collection(POSTS_COLLECTION).where('authorId','==',authorId).orderBy('createdAt','desc').limit(maxLimit).get());
    queriesToTry.push(() => db.collection(POSTS_COLLECTION).where('authorUid','==',authorId).orderBy('createdAt','desc').limit(maxLimit).get());
    queriesToTry.push(() => db.collection(POSTS_COLLECTION).where('uid','==',authorId).orderBy('createdAt','desc').limit(maxLimit).get());
  }
  if (authorEmail) {
    const lower = (authorEmail||'').toLowerCase();
    queriesToTry.push(() => db.collection(POSTS_COLLECTION).where('authorEmail','==', lower).orderBy('createdAt','desc').limit(maxLimit).get());
    queriesToTry.push(() => db.collection(POSTS_COLLECTION).where('authorEmail','==', authorEmail).orderBy('createdAt','desc').limit(maxLimit).get());
  }

  // execute sequentially until results found
  for (let qfn of queriesToTry) {
    try {
      const snap = await qfn();
      if (snap && snap.docs && snap.docs.length) {
        pushSnap(snap);
        if (resultsMap.size >= Math.min(maxLimit, 50)) break;
      }
    } catch (err) {
      console.warn('fetchPostsByAuthor query failed:', err && err.message ? err.message : err);
      // continue to next fallback
    }
  }

  if (resultsMap.size > 0) {
    const arr = Array.from(resultsMap.values());
    arr.sort((a,b)=>{
      const ta = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : (a.createdAt ? new Date(a.createdAt).getTime()/1000 : 0);
      const tb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : (b.createdAt ? new Date(b.createdAt).getTime()/1000 : 0);
      return tb - ta;
    });
    return arr.slice(0, maxLimit);
  }

  // final fallback: fetch recent and client-filter
  try {
    const snapAll = await db.collection(POSTS_COLLECTION).orderBy('createdAt','desc').limit(Math.max(100, maxLimit*5)).get();
    const all = snapAll.docs.map(d=>({ id: d.id, ...d.data() }));
    const lowerEmail = (authorEmail||'').toLowerCase();
    const filtered = all.filter(p => {
      if (!p) return false;
      if (authorId && ((p.authorId && p.authorId === authorId) || (p.authorUid && p.authorUid === authorId) || (p.uid && p.uid === authorId))) return true;
      if (authorEmail && ((p.authorEmail && (String(p.authorEmail).toLowerCase() === lowerEmail)) || (p.authorEmail === authorEmail))) return true;
      return false;
    });
    return filtered.slice(0, maxLimit);
  } catch (err) {
    console.warn('fetchPostsByAuthor final fallback failed:', err);
    return [];
  }
}

// ------------------------------ populateAuthorSideList (for modal sidebar) ------------------------------
/**
 * Fill the author sidebar inside a modal with recent posts by the same author.
 * - p: post object being displayed (should contain authorId/authorUid/authorEmail)
 * - modalCard: DOM element representing the modal root which contains #post-author-list
 */
async function populateAuthorSideList(p, modalCard) {
  if (!modalCard) return;
  const listEl = modalCard.querySelector('#post-author-list');
  if (!listEl) return;
  listEl.innerHTML = '<div class="text-sm text-gray-500">Loading...</div>';
  try {
    const authorId = p.authorId || p.authorUid || p.uid || null;
    const authorEmail = p.authorEmail || (p.author && p.author.email) || null;
    const otherPosts = await fetchPostsByAuthor(authorId, authorEmail, 10);
    listEl.innerHTML = '';
    if (!otherPosts || otherPosts.length === 0) {
      listEl.innerHTML = '<div class="text-sm text-gray-500">No other posts.</div>';
      return;
    }
    otherPosts.forEach(op => {
      const preview = document.createElement('div');
      preview.className = 'p-2 rounded hover:bg-gray-50 cursor-pointer';
      const title = escapeHtml(op.title || (op.body||'').slice(0,80));
      const createdAt = op.createdAt && op.createdAt.toDate ? op.createdAt.toDate() : (op.createdAt ? new Date(op.createdAt) : new Date());
      preview.innerHTML = `<div class="font-medium text-sm">${title}</div><div class="text-xs text-gray-500">${escapeHtml(timeSince(createdAt))}</div>`;
      preview.addEventListener('click', (ev) => {
        ev.preventDefault();
        // provide a global open function for posts (below)
        if (window.ProfilePosts && typeof window.ProfilePosts.open === 'function') {
          window.ProfilePosts.open(op.id);
        } else {
          console.warn('ProfilePosts.open not available - cannot open post by id');
        }
      });
      listEl.appendChild(preview);
    });
  } catch (err) {
    console.warn('Failed to load author posts for sidebar:', err);
    listEl.innerHTML = '<div class="text-sm text-gray-500">Failed to load.</div>';
  }
}

// ------------------------------ Posts Grid Module ------------------------------
(function PostsModule(){
  const grid = document.getElementById(POSTS_GRID_ID);
  const postsLoading = document.getElementById(POSTS_LOADING_ID);
  const noPostsEl = document.getElementById(NO_POSTS_ID);
  const refreshBtn = document.getElementById('refresh-posts-btn');

  const modal = document.getElementById('post-modal');
  const modalClose = document.getElementById('modal-close-btn');
  const modalDelete = document.getElementById('modal-delete-btn');
  const modalTitle = document.getElementById('modal-post-title');
  const modalMeta = document.getElementById('modal-post-meta');
  const modalImage = document.getElementById('modal-post-image');
  const modalBody = document.getElementById('modal-post-body');

  let postsCache = [];
  let currentDisplayedPost = null;

  function renderGrid(posts){
    postsCache = posts || [];
    if(!grid) return;
    grid.innerHTML = '';
    if(!posts || posts.length === 0){
      noPostsEl && noPostsEl.classList.remove('hidden');
      if(postsLoading) postsLoading.classList.add('hidden');
      return;
    }
    noPostsEl && noPostsEl.classList.add('hidden');
    if(postsLoading) postsLoading.classList.add('hidden');
    posts.forEach(p => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'relative rounded overflow-hidden aspect-square bg-gray-200 flex items-end justify-start p-2 focus:outline-none';
      tile.title = p.title || 'View post';
      const bg = p.imageUrl ? escapeHtml(normalizeImgurUrl(p.imageUrl)) : '';
      if (bg) {
        tile.style.backgroundImage = `url('${bg}')`;
        tile.style.backgroundSize = 'cover';
        tile.style.backgroundPosition = 'center';
        tile.style.backgroundRepeat = 'no-repeat';
      } else {
        tile.style.backgroundColor = '#f3f4f6';
      }
      const overlay = document.createElement('div');
      overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-2 flex items-end';
      overlay.style.pointerEvents = 'none';
      const titleWrap = document.createElement('div');
      titleWrap.className = 'text-xs text-white font-semibold truncate pointer-events-none';
      titleWrap.textContent = p.title || '';
      overlay.appendChild(titleWrap);
      tile.appendChild(overlay);
      tile.addEventListener('click', ()=> openModalForPost(p.id));
      grid.appendChild(tile);
    });
  }

  async function openModalForPost(postId){
    // try to find in cache
    const post = postsCache.find(x => x.id === postId);
    if(!post){
      try {
        const doc = await db.collection('posts').doc(postId).get();
        if(!doc.exists) return alert('Post not found');
        currentDisplayedPost = { id: doc.id, ...doc.data() };
      } catch (err) {
        console.error('Failed fetching post', err);
        return alert('Failed fetching post');
      }
    } else currentDisplayedPost = post;

    modalTitle && (modalTitle.textContent = currentDisplayedPost.title || '(no title)');
    const createdAt = currentDisplayedPost.createdAt && currentDisplayedPost.createdAt.seconds
      ? new Date(currentDisplayedPost.createdAt.seconds * 1000)
      : (currentDisplayedPost.createdAt ? new Date(currentDisplayedPost.createdAt) : null);
    modalMeta && (modalMeta.textContent = createdAt ? `${createdAt.toLocaleString()}` : '');
    if (modalImage) {
      modalImage.src = currentDisplayedPost.imageUrl ? normalizeImgurUrl(currentDisplayedPost.imageUrl) : '';
      modalImage.alt = currentDisplayedPost.title || 'post image';
    }
    modalBody && (modalBody.innerText = currentDisplayedPost.body || '');

    // show modal
    modal && modal.classList.remove('hidden');

    // populate author sidebar if present
    try {
      const modalCard = document.querySelector('#post-modal');
      if (modalCard) populateAuthorSideList(currentDisplayedPost, modalCard);
    } catch (e) { /* ignore sidebar failures */ }

    document.addEventListener('keydown', escToClose);
  }

  function closeModal(){ modal && modal.classList.add('hidden'); currentDisplayedPost = null; document.removeEventListener('keydown', escToClose); }
  function escToClose(e){ if(e.key === 'Escape') closeModal(); }

  async function deleteCurrentPost(){
    if(!currentDisplayedPost) return;
    if(!confirm('Delete this post permanently? This cannot be undone.')) return;
    const id = currentDisplayedPost.id;
    try{
      if(currentDisplayedPost.imagePath && storage){
        try{ await storage.refFromURL(currentDisplayedPost.imagePath).delete(); }catch(e){ try{ await storage.ref(currentDisplayedPost.imagePath).delete(); }catch(e2){ /* ignore */ } }
      }
      await db.collection('posts').doc(id).delete();
      showToast('Post deleted');
      closeModal();
      postsCache = postsCache.filter(p=>p.id !== id);
      renderGrid(postsCache);
    }catch(err){
      console.error('Failed deleting post', err);
      alert('Failed deleting post. Check console for details.');
    }
  }

  async function reloadUserPosts(forceEmailFallback = true, userOverride = null) {
    const localUser = userOverride || (auth ? auth.currentUser : null);
    if(!grid) return;
    if (postsLoading) postsLoading.classList.remove('hidden');
    noPostsEl && noPostsEl.classList.add('hidden');
    grid.innerHTML = '';
    if (!localUser) {
      grid.innerHTML = '<div class="col-span-3 p-4 text-sm text-gray-500">Sign in to view your posts.</div>';
      if (postsLoading) postsLoading.classList.add('hidden');
      return;
    }
    try {
      const authorId = localUser.uid;
      const authorEmail = localUser.email || null;
      const posts = await fetchPostsByAuthor(authorId, authorEmail, 200);
      renderGrid(posts);
    } catch (err) {
      console.error('reloadUserPosts failed', err);
      grid.innerHTML = '<div class="col-span-3 p-4 text-sm text-red-500">Unable to load your posts.</div>';
    } finally {
      if (postsLoading) postsLoading.classList.add('hidden');
    }
  }

  // wire modal and refresh handlers
  modalClose && modalClose.addEventListener('click', closeModal);
  modal && modal.addEventListener('click', (e)=>{ if (e.target === modal) closeModal(); });
  modalDelete && modalDelete.addEventListener('click', deleteCurrentPost);
  refreshBtn && refreshBtn.addEventListener('click', ()=> reloadUserPosts(true, auth ? auth.currentUser : null));

  // expose API
  window.ProfilePosts = {
    reload: reloadUserPosts,
    open: openModalForPost
  };
})(); // end PostsModule

// ------------------------------ Backwards-compatible legacy loader ------------------------------
async function loadProfilePostsLegacy(user) {
  if (!profileActivityPosts) return;
  profileActivityPosts.innerHTML = '<div class="text-sm text-gray-500">Loading your posts...</div>';
  try {
    let posts = [];
    if (user && db) {
      const queries = [];
      try { queries.push(db.collection('posts').where('authorId','==',user.uid).orderBy('createdAt','desc').limit(50).get()); } catch(e){}
      try { queries.push(db.collection('posts').where('authorUid','==',user.uid).orderBy('createdAt','desc').limit(50).get()); } catch(e){}
      try { queries.push(db.collection('posts').where('uid','==',user.uid).orderBy('createdAt','desc').limit(50).get()); } catch(e){}
      if (user.email) try { queries.push(db.collection('posts').where('authorEmail','==',user.email).orderBy('createdAt','desc').limit(50).get()); } catch(e){}

      if (queries.length === 0) {
        const snap = await db.collection('posts').orderBy('createdAt','desc').limit(50).get();
        posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } else {
        const snaps = await Promise.all(queries.map(p => p.catch(() => null)));
        const map = new Map();
        snaps.forEach(snap => { if (!snap) return; snap.docs.forEach(d => { const data = { id: d.id, ...d.data() }; if (!map.has(data.id)) map.set(data.id, data); }); });
        posts = Array.from(map.values()).sort((a,b)=>{
          const ta = a.createdAt ? (a.createdAt.seconds|| new Date(a.createdAt).getTime()/1000):0;
          const tb = b.createdAt ? (b.createdAt.seconds|| new Date(b.createdAt).getTime()/1000):0;
          return tb-ta;
        }).slice(0,50);
      }
    } else {
      const arr = JSON.parse(localStorage.getItem('campus_posts_v1') || '[]');
      posts = arr.filter(p => (currentUserDoc && currentUserDoc.firstName && (p.authorFirst === currentUserDoc.firstName)) || false).slice().reverse();
    }

    if (!posts || posts.length === 0) { profileActivityPosts.innerHTML = '<div class="text-sm text-gray-500">No posts yet.</div>'; return; }
    profileActivityPosts.innerHTML = '';
    posts.forEach(p => {
      try {
        const node = (typeof renderPost === 'function') ? renderPost(p) : null;
        if (node) {
          node.style.maxWidth = '360px'; node.style.margin = '0'; node.style.display = 'block';
          profileActivityPosts.appendChild(node);
        } else {
          const el = document.createElement('div'); el.className = 'p-3 border rounded'; el.textContent = p.title || (p.body||'').slice(0,120); el.style.maxWidth = '360px'; profileActivityPosts.appendChild(el);
        }
      } catch (err) { console.warn('Failed to render post preview', err); }
    });
  } catch (err) {
    console.error('Failed to load profile posts', err);
    profileActivityPosts.innerHTML = '<div class="text-sm text-gray-500">Failed to load posts.</div>';
  }
}

// ------------------------------ Top-level auth state wiring ------------------------------
if (auth) {
  auth.onAuthStateChanged(async (user) => {
    try { if (user) await populateProfile(user); else await populateProfile(null); } catch(e){ console.warn('populateProfile failed', e); }

    // primary: reload posts grid
    if (window.ProfilePosts && typeof window.ProfilePosts.reload === 'function') {
      try { await window.ProfilePosts.reload(true, user); } catch(e){ console.warn('ProfilePosts.reload failed', e); }
    } else {
      // fallback to legacy loader if grid not available
      try { await loadProfilePostsLegacy(user); } catch(e){ console.warn('legacy posts load failed', e); }
    }

    setTimeout(() => { try { populateProfile(user); } catch (e) {} }, 350);
  });
} else {
  console.warn('Firebase Auth not available - profile functionality limited.');
}

// ------------------------------ End of file ------------------------------
