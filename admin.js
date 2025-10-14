// admin.js - Minimal admin console to manage posts, users and news
(function(){
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDC3L5vruhYXfarn5O81cLld50oagYkmxE",
    authDomain: "campus-leaders.firebaseapp.com",
    projectId: "campus-leaders",
    storageBucket: "campus-leaders.firebasestorage.app",
    messagingSenderId: "445360528951",
    appId: "1:445360528951:web:712da8859c8ac4cb6129b2"
  };

  try { if (!window.firebase.apps || window.firebase.apps.length===0) firebase.initializeApp(FIREBASE_CONFIG); } catch(e){}
  const auth = firebase.auth();
  const db = firebase.firestore();

  // Basic auth guard: ensure logged in and has admin email from sign.js's ADMIN_EMAILS or claim
  async function ensureAdmin(){
    return new Promise((res, rej) => {
      const off = auth.onAuthStateChanged(async (u)=>{
        off();
        if(!u) return rej(new Error('Not signed in'));
        const email = (u.email||'').toLowerCase();
        // try custom claim
        try{
          const token = await u.getIdTokenResult();
          if(token.claims && token.claims.admin) return res(u);
        }catch(e){}
  // fallback: allow if email matches ADMIN_EMAILS injected by sign.js
  const adminList = window.ADMIN_EMAILS || (window.CampusLeaders && window.CampusLeaders.ADMIN_EMAILS) || [];
  if(Array.isArray(adminList) && adminList.length>0 && adminList.includes(email)) return res(u);
  // otherwise deny
  return rej(new Error('Not an admin'));
      });
    });
  }

  // DOM refs
  const tabs = Array.from(document.querySelectorAll('.tab-btn'));
  const adminTabs = Array.from(document.querySelectorAll('.admin-tab'));
  const signOutBtn = document.getElementById('sign-out');

  signOutBtn && signOutBtn.addEventListener('click', ()=>{ if(window.CampusLeaders && typeof window.CampusLeaders.signOutNow==='function') window.CampusLeaders.signOutNow(); else auth.signOut().then(()=>location.href='/index.html'); });

  function showTab(name){
    adminTabs.forEach(el=>el.classList.add('hidden'));
    const el = document.getElementById('tab-'+name);
    if(el) el.classList.remove('hidden');
  }
  tabs.forEach(t=> t.addEventListener('click', ()=>{ tabs.forEach(x=>x.classList.remove('bg-two','text-white')); t.classList.add('bg-two','text-white'); showTab(t.dataset.tab);}));

  // POSTS
  const postsTableBody = document.querySelector('#posts-table tbody');
  const postsSearch = document.getElementById('posts-search');
  const refreshPosts = document.getElementById('refresh-posts');

  async function loadPosts(){
    if(!db) return;
    postsTableBody.innerHTML = '<tr><td colspan="4" class="p-4 text-sm text-gray-500">Loading…</td></tr>';
    try{
      const snap = await db.collection('posts').orderBy('createdAt','desc').limit(500).get();
      renderPosts(Array.from(snap.docs).map(d=>({id:d.id, ...d.data()})));
    }catch(err){
      postsTableBody.innerHTML = '<tr><td colspan="4" class="p-4 text-sm text-red-500">Failed loading posts</td></tr>';
      console.error(err);
    }
  }

  function renderPosts(list){
    const q = (postsSearch.value||'').toLowerCase().trim();
    postsTableBody.innerHTML = '';
    for(const p of list){
      const body = (p.body||'').replace(/\s+/g,' ').slice(0,180);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="p-2">${new Date(p.createdAt?.seconds ? p.createdAt.seconds*1000 : (p.createdAt||Date.now())).toLocaleString()}</td>
        <td class="p-2">${escapeHtml((p.authorFirst||'')+' '+(p.authorLast||''))}<div class="text-xs text-gray-500">${escapeHtml(p.authorEmail||'')}</div></td>
        <td class="p-2">${escapeHtml(p.title||'')}<div class="text-xs text-gray-600">${escapeHtml(body)}</div></td>
        <td class="p-2 text-center"><button data-id="${p.id}" class="delete-post px-2 py-1 text-sm text-red-600">Delete</button></td>`;
      // filter by search
      if(q){
        const hay = (p.title+' '+p.body+' '+(p.authorFirst||'')+' '+(p.authorLast||'')+' '+(p.authorEmail||'')).toLowerCase();
        if(!hay.includes(q)) continue;
      }
      postsTableBody.appendChild(tr);
    }
    // wire delete buttons
    postsTableBody.querySelectorAll('.delete-post').forEach(btn=>btn.addEventListener('click', async (ev)=>{
      const id = btn.dataset.id; if(!id) return;
      if(!confirm('Delete this post permanently?')) return;
      try{ await db.collection('posts').doc(id).delete(); alert('Deleted'); loadPosts(); }catch(err){ console.error(err); alert('Failed to delete'); }
    }));
  }

  refreshPosts && refreshPosts.addEventListener('click', loadPosts);
  postsSearch && postsSearch.addEventListener('input', ()=> loadPosts());

  // USERS
  const usersTableBody = document.querySelector('#users-table tbody');
  const usersSearch = document.getElementById('users-search');
  const filterSchool = document.getElementById('filter-school');
  const refreshUsers = document.getElementById('refresh-users');

  async function loadUsers(){
    if(!db) return;
    usersTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-sm text-gray-500">Loading…</td></tr>';
    try{
      const snap = await db.collection('users').orderBy('createdAt','desc').limit(1000).get();
      const users = snap.docs.map(d=>({id:d.id, ...d.data()}));
      // populate filter schools
      const schools = Array.from(new Set(users.map(u=>u.schoolName).filter(Boolean))).sort();
      filterSchool.innerHTML = '<option value="">All schools</option>' + schools.map(s=>`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
      renderUsers(users);
    }catch(err){ usersTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-sm text-red-500">Failed loading users</td></tr>'; console.error(err); }
  }

  function renderUsers(list){
    const q = (usersSearch.value||'').toLowerCase().trim();
    const schoolFilter = (filterSchool.value||'').toLowerCase().trim();
    usersTableBody.innerHTML = '';
    for(const u of list){
      if(schoolFilter && (u.schoolName||'').toLowerCase() !== schoolFilter) continue;
      const hay = ((u.firstName||'')+' '+(u.lastName||'')+' '+(u.email||'')+' '+(u.schoolName||'')+' '+(u.association||'')).toLowerCase();
      if(q && !hay.includes(q)) continue;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="p-2">${escapeHtml((u.firstName||'')+' '+(u.lastName||''))}</td>
        <td class="p-2">${escapeHtml(u.email||'')}</td>
        <td class="p-2">${escapeHtml(u.phone||'')}</td>
        <td class="p-2">${escapeHtml(u.schoolName||'')}</td>
        <td class="p-2">${escapeHtml(u.association||'')}</td>
        <td class="p-2 text-center"><button data-id="${u.id}" class="view-user px-2 py-1 text-sm text-blue-600">View</button></td>`;
      usersTableBody.appendChild(tr);
    }
    usersTableBody.querySelectorAll('.view-user').forEach(b=>b.addEventListener('click', (ev)=>{
      const id = b.dataset.id; if(!id) return; showUserDetail(id);
    }));
  }

  async function showUserDetail(uid){
    try{
      const doc = await db.collection('users').doc(uid).get();
      if(!doc.exists) return alert('User not found');
      const d = doc.data();
      const s = `Name: ${d.firstName||''} ${d.lastName||''}\nEmail: ${d.email||''}\nPhone: ${d.phone||''}\nSchool: ${d.schoolName||''}\nAssoc: ${d.association||''}\nBio: ${d.bio||''}`;
      alert(s);
    }catch(err){ console.error(err); alert('Failed fetching user'); }
  }

  refreshUsers && refreshUsers.addEventListener('click', loadUsers);
  usersSearch && usersSearch.addEventListener('input', ()=> loadUsers());
  filterSchool && filterSchool.addEventListener('change', ()=> loadUsers());

  // NEWS
  const newsForm = document.getElementById('news-form');
  const newsTableBody = document.querySelector('#news-table tbody');
  const newsTitle = document.getElementById('news-title');
  const newsSummary = document.getElementById('news-summary');
  const newsBody = document.getElementById('news-body');
  const newsImage = document.getElementById('news-image');
  const newsImageFile = document.getElementById('news-image-file');
  const newsImagePreview = document.getElementById('news-image-preview');
  const saveNews = document.getElementById('save-news');
  const clearNews = document.getElementById('clear-news');

  // Uploadcare settings (reuse values from sign.js in your repo)
  const UPLOADCARE_PUBLIC_KEY = '2683b7806064b3db73e3';
  const UPLOADCARE_BASE_UPLOAD = 'https://upload.uploadcare.com/base/';
  const UPLOADCARE_CDN = 'https://12hsb3bgrj.ucarecd.net/';

  async function uploadImageToUploadcare(file){
    if(!file) throw new Error('No file');
  const form = new FormData();
  form.append('file', file);
  // include the public key so Uploadcare accepts the upload
  form.append('UPLOADCARE_PUB_KEY', UPLOADCARE_PUBLIC_KEY);
  form.append('UPLOADCARE_STORE', '1');
    const resp = await fetch(UPLOADCARE_BASE_UPLOAD, { method: 'POST', body: form });
    const data = await resp.json();
    if(!resp.ok) throw new Error('Upload failed: '+JSON.stringify(data));
    const fileId = (data && data.file) ? String(data.file).replace(/^\/+|\/+$/g,'') : null;
    if(!fileId) throw new Error('Uploadcare returned no file id');
    return `${UPLOADCARE_CDN.replace(/\/+$/,'')}/${fileId}/`;
  }

  // preview chosen file
  if(newsImageFile){
    newsImageFile.addEventListener('change', async (e)=>{
      const f = e.target.files && e.target.files[0];
      if(!f){ newsImagePreview.classList.add('hidden'); newsImagePreview.src=''; return; }
      const reader = new FileReader();
      reader.onload = () => { newsImagePreview.src = reader.result; newsImagePreview.classList.remove('hidden'); };
      reader.readAsDataURL(f);
    });
  }

  async function loadNews(){
    if(!db) return;
    newsTableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-sm text-gray-500">Loading…</td></tr>';
    try{
      const snap = await db.collection('news').orderBy('createdAt','desc').limit(200).get();
      newsTableBody.innerHTML = '';
      snap.forEach(d=>{
        const n = {id:d.id, ...d.data()};
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="p-2">${new Date(n.createdAt?.seconds ? n.createdAt.seconds*1000 : Date.now()).toLocaleString()}</td>
          <td class="p-2">${escapeHtml(n.title||'')}</td>
          <td class="p-2 text-center"><button data-id="${n.id}" class="delete-news text-red-600 px-2 py-1">Delete</button></td>`;
        newsTableBody.appendChild(tr);
      });
      newsTableBody.querySelectorAll('.delete-news').forEach(b=>b.addEventListener('click', async (ev)=>{
        const id = b.dataset.id; if(!confirm('Delete this news item?')) return; try{ await db.collection('news').doc(id).delete(); loadNews(); }catch(err){console.error(err); alert('Failed');}
      }));
    }catch(err){ newsTableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-sm text-red-500">Failed loading news</td></tr>'; console.error(err); }
  }

  newsForm && newsForm.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    if(!newsTitle.value.trim()) return alert('Title required');
    try{
      // if a file is selected, upload it first
      let imageUrlVal = (newsImage.value && newsImage.value.trim()) ? newsImage.value.trim() : null;
      if(newsImageFile && newsImageFile.files && newsImageFile.files[0]){
        try{
          imageUrlVal = await uploadImageToUploadcare(newsImageFile.files[0]);
        }catch(uerr){ console.warn('Uploadcare upload failed, falling back to URL field', uerr); }
      }
      // save plain text body preserving paragraphs
      const bodyText = (newsBody.value || '').trim();
      await db.collection('news').add({ title: newsTitle.value.trim(), summary: newsSummary.value.trim()||null, body: bodyText||null, imageUrl: imageUrlVal||null, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      alert('Saved'); newsTitle.value=''; newsSummary.value=''; newsBody.value=''; newsImage.value=''; if(newsImagePreview) { newsImagePreview.src=''; newsImagePreview.classList.add('hidden'); } loadNews();
    }catch(err){ console.error(err); alert('Failed saving news'); }
  });
  clearNews && clearNews.addEventListener('click', ()=>{ newsTitle.value=''; newsSummary.value=''; newsBody.value=''; newsImage.value=''; });

  // --- SUPPORT / CHAT (admin) ---
  const supportList = document.getElementById('support-list');
  const supportThread = document.getElementById('support-thread');
  const supportThreadTitle = document.getElementById('support-thread-title');
  const supportMsgInput = document.getElementById('support-msg-input');
  const supportSendBtn = document.getElementById('support-send-btn');

  let currentSupportConv = null;
  let supportMsgUnsub = null;

  async function loadSupportConversations(){
    if(!db || !supportList) return;
    supportList.innerHTML = '<div class="p-3 text-sm text-gray-500">Loading…</div>';
    try{
      const snap = await db.collection('support_conversations').orderBy('lastAt','desc').limit(200).get();
      supportList.innerHTML = '';
      snap.forEach(d=>{
        const s = d.data();
        const id = d.id;
        const el = document.createElement('button');
        el.className = 'w-full text-left p-3 border-b bghover';
        el.innerHTML = `<div class="font-medium">${escapeHtml(s.userDisplayName||'Guest')}</div><div class="text-xs text-gray-600">${escapeHtml(s.userEmail||'')}</div><div class="text-xs text-gray-500">${s.lastMessage ? escapeHtml(s.lastMessage.slice(0,120)) : ''}</div>`;
        el.addEventListener('click', ()=> openSupportConversation(id, s));
        supportList.appendChild(el);
      });
    }catch(err){ supportList.innerHTML = '<div class="p-3 text-sm text-red-500">Failed loading</div>'; console.error(err); }
  }

  async function openSupportConversation(convId, meta){
    if(!db) return;
    currentSupportConv = convId;
    if(supportMsgUnsub) supportMsgUnsub();
    supportThread.innerHTML = '<div class="p-3 text-sm text-gray-500">Loading messages…</div>';
    supportThreadTitle.textContent = (meta && (meta.userDisplayName||meta.userEmail)) || convId;
    // listen to messages
    supportMsgUnsub = db.collection('support_conversations').doc(convId).collection('messages').orderBy('createdAt').onSnapshot(snap=>{
      supportThread.innerHTML = '';
      snap.forEach(doc=>{
        const m = doc.data();
        const wrap = document.createElement('div');
        wrap.className = 'p-2';
        if(m.from==='admin'){
          wrap.innerHTML = `<div class="text-xs text-gray-500">Admin</div><div class="mt-1 p-2 bg-blue-50 rounded">${escapeHtml(m.text)}</div>`;
          wrap.classList.add('text-right');
        }else{
          wrap.innerHTML = `<div class="text-xs text-gray-500">${escapeHtml(m.displayName||'User')}</div><div class="mt-1 p-2 bg-gray-50 rounded">${escapeHtml(m.text)}</div>`;
        }
        supportThread.appendChild(wrap);
      });
      supportThread.scrollTop = supportThread.scrollHeight;
    });
  }

  if(supportSendBtn){
    supportSendBtn.addEventListener('click', async ()=>{
      const text = (supportMsgInput.value||'').trim(); if(!text || !currentSupportConv) return;
      try{
        await db.collection('support_conversations').doc(currentSupportConv).collection('messages').add({ from: 'admin', text, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        await db.collection('support_conversations').doc(currentSupportConv).update({ lastMessage: text, lastAt: firebase.firestore.FieldValue.serverTimestamp() });
        supportMsgInput.value = '';
      }catch(err){ console.error('Failed sending admin reply', err); alert('Failed to send'); }
    });
  }

  // expose loader for admin UI
  window.__admin_loadSupport = loadSupportConversations;

  // helpers
  function escapeHtml(s){ if(!s) return ''; return s.toString().replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  // init
  (async function init(){
    try{ await ensureAdmin(); }catch(err){ alert('Access denied: Admins only'); location.href='/index.html'; return; }
    // default tab
    showTab('posts');
    tabs[0] && tabs[0].classList.add('bg-two','text-white');
    loadPosts(); loadUsers(); loadNews();
    // load support conversations if admin support UI exists
    try{ if(typeof window.__admin_loadSupport === 'function') window.__admin_loadSupport(); }catch(e){ /* ignore */ }
  })();

})();
