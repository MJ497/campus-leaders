// profile.js — cleaned and deduplicated
// Attach this file as profile.js (replace existing). Keeps your UI unchanged.

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDC3L5vruhYXfarn5O81cLld50oagYkmxE",
  authDomain: "campus-leaders.firebaseapp.com",
  projectId: "campus-leaders",
  storageBucket: "campus-leaders.firebasestorage.app",
  messagingSenderId: "445360528951",
  appId: "1:445360528951:web:712da8859c8ac4cb6129b2"
};

if (window.firebase && FIREBASE_CONFIG && FIREBASE_CONFIG.projectId) {
  try { if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG); } catch (e) { console.warn('Firebase init error', e); }
}

const auth = firebase.auth();
const db = firebase.firestore();

//////////////////// DOM refs ////////////////////
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
const profileActivityPosts = document.getElementById('profile-activity-posts');

let currentUser = null;
let currentUserDoc = null;
let uploadedImageFile = null;

//////////////////// helpers ////////////////////
function showToast(msg, bg = '#111827', ms = 2500) {
  if (!toast) { alert(msg); return; }
  toast.textContent = msg;
  toast.style.background = bg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), ms);
}

function openEditModal() { if (!editModal) return; editModal.classList.remove('hidden'); editModal.classList.add('flex'); }
function closeEditModal() { if (!editModal) return; editModal.classList.add('hidden'); editModal.classList.remove('flex'); uploadedImageFile = null; if (inputImage) inputImage.value = ''; if (inputImageName) inputImageName.textContent = ''; }

//////////////////// Populate UI ////////////////////
async function populateProfile(user) {
  currentUser = user;
  if (!user) {
    profileFullname.textContent = 'Guest';
    profilePosition.textContent = '';
    profileSchool.textContent = '';
    profileYear.textContent = '';
    profileAssoc.textContent = '';
    profileState.textContent = '';
    firstNameEl.textContent = '—';
    lastNameEl.textContent = '—';
    emailEl.textContent = 'Not signed in';
    phoneEl.textContent = '—';
    bioEl.textContent = 'Sign in to manage your profile.';
    associationEl.textContent = '';
    stateEl.textContent = '';
    if (navAvatar) navAvatar.innerHTML = '<i class="fas fa-user"></i>';
    return;
  }

  try {
    const doc = await db.collection('users').doc(user.uid).get();
    currentUserDoc = doc.exists ? doc.data() : null;
  } catch (e) { console.warn('Error reading user doc', e); currentUserDoc = null; }

  const first = currentUserDoc?.firstName || user.displayName?.split(' ')[0] || '';
  const last = currentUserDoc?.lastName || user.displayName?.split(' ').slice(1).join(' ') || '';
  const position = currentUserDoc?.position || '';
  const email = user.email || '';
  const phone = currentUserDoc?.phone || user.phoneNumber || '';
  const bio = currentUserDoc?.bio || '';
  const school = currentUserDoc?.schoolName || '';
  const year = currentUserDoc?.yearHeld || '';
  const assoc = currentUserDoc?.association || '';
  const state = currentUserDoc?.stateName || '';
  const imageUrl = currentUserDoc?.imageUrl || user.photoURL || null;

  profileFullname.textContent = [first, last].filter(Boolean).join(' ') || (user.displayName || 'Member');
  profilePosition.textContent = position;
  profileSchool.textContent = school;
  profileYear.textContent = year;
  profileAssoc.textContent = assoc;
  profileState.textContent = state;

  firstNameEl.textContent = first || '—';
  lastNameEl.textContent = last || '—';
  emailEl.textContent = email || '—';
  phoneEl.textContent = phone || '—';
  bioEl.textContent = bio || '—';
  associationEl.textContent = assoc || '—';
  stateEl.textContent = state || '—';

  // avatar
  if (imageUrl) {
    if (profileAvatar) {
      profileAvatar.innerHTML = '';
      const img = document.createElement('img'); img.src = imageUrl; img.alt = profileFullname.textContent || 'avatar';
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

auth.onAuthStateChanged(async (user) => {
  if (user) await populateProfile(user);
  else await populateProfile(null);
  loadProfilePosts(user);
  setTimeout(() => { try { populateProfile(user); } catch (e) {} }, 350);
});

//////////////////// Profile posts (lightweight) ////////////////////
async function loadProfilePosts(user) {
  if (!profileActivityPosts) return;
  profileActivityPosts.innerHTML = '<div class="text-sm text-gray-500">Loading your posts...</div>';
  try {
    let posts = [];
    if (user && db) {
      // robust multi-field query fallback
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
        posts = Array.from(map.values()).sort((a,b)=>{ const ta = a.createdAt ? (a.createdAt.seconds||new Date(a.createdAt).getTime()/1000):0; const tb = b.createdAt ? (b.createdAt.seconds||new Date(b.createdAt).getTime()/1000):0; return tb-ta; }).slice(0,50);
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

//////////////////// Image upload helper ////////////////////
async function uploadToImageKitServer(file) {
  if (!file) return null;
  try {
    const fd = new FormData(); fd.append('file', file);
    const resp = await fetch('/imagekit-upload', { method: 'POST', body: fd });
    if (!resp.ok) { const text = await resp.text().catch(()=>''); throw new Error('Upload failed: '+resp.status+' '+text); }
    const data = await resp.json(); return data.url || null;
  } catch (err) { console.error('ImageKit upload error', err); throw err; }
}

//////////////////// Edit form handlers ////////////////////
if (editBtn) {
  editBtn.addEventListener('click', () => {
    if (!auth.currentUser) { showToast('Please sign in to edit your profile', '#dc2626'); return; }
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

if (saveProfileBtn) {
  saveProfileBtn.addEventListener('click', async () => {
    if (!auth.currentUser) { showToast('Not signed in', '#dc2626'); return; }
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

//////////////////// Export helpers ////////////////////
function collectProfilePayload() {
  if (!auth.currentUser) return null;
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

// jsPDF loader
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
  if (!auth.currentUser) { showToast('Sign in to export', '#dc2626'); return; }
  const payload = collectProfilePayload(); if (!payload) { showToast('No profile data', '#dc2626'); return; }
  try {
    const jspdfLib = await ensureJsPdf(); const { jsPDF } = jspdfLib; const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginLeft = 40; let y = 40;
    doc.setFontSize(18); doc.text(payload.displayName || `${payload.firstName} ${payload.lastName}`, marginLeft, y); y += 22;
    doc.setFontSize(11);
    const lines = [ `Email: ${payload.email||''}`, `Phone: ${payload.phone||''}`, `Position: ${payload.position||''}`, `Association: ${payload.association||''}`, `School: ${payload.schoolName||''} ${payload.yearHeld?('('+payload.yearHeld+')'):''}`, `State: ${payload.stateName||''}`, '' ];
    lines.forEach(line=>{ doc.text(line, marginLeft, y); y+=16; });
    if (payload.bio) { y+=4; doc.setFontSize(12); doc.text('Bio:', marginLeft, y); y+=14; doc.setFontSize(10); const pageWidth = doc.internal.pageSize.getWidth(); const usableWidth = pageWidth - marginLeft*2; const bioLines = doc.splitTextToSize(payload.bio, usableWidth); doc.text(bioLines, marginLeft, y); y += bioLines.length*12 + 8; }
    if (payload.imageUrl) {
      try {
        const res = await fetch(payload.imageUrl); const blob = await res.blob(); const dataUrl = await new Promise(res2=>{ const r=new FileReader(); r.onload=()=>res2(r.result); r.readAsDataURL(blob); });
        const imgProps = doc.getImageProperties(dataUrl); const iw = 120; const ih = (imgProps.height/imgProps.width)*iw; const pageW = doc.internal.pageSize.getWidth(); doc.addImage(dataUrl, 'JPEG', pageW - marginLeft - iw, 40, iw, ih);
      } catch (err) { console.warn('Failed to add image to PDF', err); }
    }
    doc.setFontSize(9); doc.text(`Exported: ${new Date().toLocaleString()}`, marginLeft, doc.internal.pageSize.getHeight() - 30);
    const filename = `${(payload.displayName || payload.email || 'profile')}_profile.pdf`.replace(/\s+/g,'_'); doc.save(filename); showToast('PDF exported.');
  } catch (err) { console.error('PDF export failed', err); showToast('PDF export failed', '#dc2626'); }
}

function exportProfileToDocx() {
  if (!auth.currentUser) { showToast('Sign in to export', '#dc2626'); return; }
  const payload = collectProfilePayload(); if (!payload) { showToast('No profile data', '#dc2626'); return; }
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(payload.displayName || 'Profile')}</title><style>body{font-family:Arial,Helvetica,sans-serif;color:#111827;padding:24px;}h1{font-size:20px;margin-bottom:6px}.meta{margin-bottom:12px;font-size:13px;color:#374151}.section{margin-bottom:10px}.label{font-weight:bold;color:#111827}.bio{white-space:pre-wrap;margin-top:6px;color:#111827}.avatar{float:right;margin-left:12px;width:120px;height:120px;object-fit:cover;border-radius:6px}</style></head><body>${payload.imageUrl?`<img src="${payload.imageUrl}" class="avatar"/>`:''}<h1>${escapeHtml(payload.displayName || (payload.firstName+' '+payload.lastName))}</h1><div class="meta">${payload.position?`<div><span class="label">Position:</span> ${escapeHtml(payload.position)}</div>`:''}${payload.schoolName?`<div><span class="label">School:</span> ${escapeHtml(payload.schoolName)} ${payload.yearHeld?('('+escapeHtml(payload.yearHeld)+')'):''}</div>`:''}${payload.association?`<div><span class="label">Association:</span> ${escapeHtml(payload.association)}</div>`:''}${payload.stateName?`<div><span class="label">State:</span> ${escapeHtml(payload.stateName)}</div>`:''}${payload.phone?`<div><span class="label">Phone:</span> ${escapeHtml(payload.phone)}</div>`:''}${payload.email?`<div><span class="label">Email:</span> ${escapeHtml(payload.email)}</div>`:''}</div>${payload.bio?`<div class="section"><div class="label">Bio</div><div class="bio">${escapeHtml(payload.bio)}</div></div>`:''}<div style="margin-top:24px;font-size:11px;color:#6b7280;">Exported: ${new Date().toLocaleString()}</div></body></html>`;
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const filename = `${(payload.displayName || payload.email || 'profile')}_profile.docx`.replace(/\s+/g,'_');
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); showToast('Word document exported.');
}

function escapeHtml(s) { if (!s && s !== 0) return ''; return String(s).replace(/[&<>"']/g, (m)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[m]); }

//////////////////// vCard export ////////////////////
if (exportVcardBtn) {
  exportVcardBtn.addEventListener('click', (e)=>{
    e.preventDefault(); if (!auth.currentUser) { showToast('Sign in to export', '#dc2626'); return; }
    const fullname = profileFullname?.textContent || '';
    const email = emailEl?.textContent || '';
    const phone = phoneEl?.textContent || '';
    const lines = ['BEGIN:VCARD','VERSION:3.0', `FN:${fullname}`, email?`EMAIL;TYPE=INTERNET:${email}`:'', phone?`TEL;TYPE=CELL:${phone}`:'', 'END:VCARD'].filter(Boolean).join('\r\n');
    const blob = new Blob([lines], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = (fullname?fullname.replace(/\s+/g,'_'):'contact') + '.vcf'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); showToast('vCard exported.');
  });
}

//////////////////// Wire Download button to present choice ////////////////////
if (downloadBtn) {
  downloadBtn.addEventListener('click', async (e)=>{
    e.preventDefault(); if (!auth.currentUser) { showToast('Sign in to export', '#dc2626'); return; }
    // Small, non-UI-changing prompt to pick format
    const useDoc = confirm('Click OK to download as Word (.docx). Click Cancel to download as PDF.');
    if (useDoc) exportProfileToDocx(); else await exportProfileToPDF();
  });
}

//////////////////// Sign out & nav handlers ////////////////////
const signOutBtn = document.getElementById('desktop-sign-out');
if (signOutBtn) {
  signOutBtn.addEventListener('click', async (e)=>{ e.preventDefault(); try { if (window.CampusLeaders && typeof window.CampusLeaders.signOutNow === 'function') { window.CampusLeaders.signOutNow(); } else { await auth.signOut(); showToast('Signed out.'); window.location.href = '/index.html'; } } catch (err) { console.error('Sign out failed', err); showToast('Sign out failed', '#dc2626'); } });
}

// user menu toggle
const userMenuButton = document.getElementById('user-menu-button');
const userMenu = document.getElementById('user-menu');
if (userMenuButton) {
  userMenuButton.addEventListener('click', (e)=>{ e.stopPropagation(); if (userMenu) userMenu.classList.toggle('hidden'); });
  document.addEventListener('click', (e)=>{ if (userMenu && !userMenu.contains(e.target) && !userMenuButton.contains(e.target)) userMenu.classList.add('hidden'); });
}

// small helper to keep compatibility if global search integration expects doSearch
if (typeof doSearch !== 'function') window.doSearch = async function(q) { if (!q) return; alert('Search not available here.'); };

// End of profile.js
