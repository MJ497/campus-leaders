// news-loader.js - loads top news items into elements with class "trending-news-list"
(async function(){
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDC3L5vruhYXfarn5O81cLld50oagYkmxE",
    authDomain: "campus-leaders.firebaseapp.com",
    projectId: "campus-leaders",
    storageBucket: "campus-leaders.firebasestorage.app",
    messagingSenderId: "445360528951",
    appId: "1:445360528951:web:712da8859c8ac4cb6129b2"
  };
  try { if (!window.firebase.apps || window.firebase.apps.length===0) firebase.initializeApp(FIREBASE_CONFIG); } catch(e){}
  const db = firebase.firestore();
  async function load(){
    try{
      const snap = await db.collection('news').orderBy('createdAt','desc').limit(6).get();
      const items = snap.docs.map(d=>({id:d.id, ...d.data()}));
      const lists = document.querySelectorAll('.trending-news-list');
      lists.forEach(list=>{
        list.innerHTML = '';
        if(items.length===0) { list.innerHTML = '<div class="text-sm text-gray-500 p-2">No news</div>'; return; }
        items.forEach(n=>{
          const a = document.createElement('a');
          a.href = '/news.html?id='+encodeURIComponent(n.id);
          a.className = 'block text-sm py-2 hover:bg-gray-50 px-2';
          a.innerHTML = `<div class="font-medium">${escapeHtml(n.title||'Untitled')}</div><div class="text-xs text-gray-500">${escapeHtml(n.summary||'')}</div>`;
          list.appendChild(a);
        });
      });
    }catch(err){ console.warn('news-loader failed', err); }
  }
  function escapeHtml(s){ if(!s) return ''; return s.toString().replace(/[&<>\"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  document.addEventListener('DOMContentLoaded', load);
})();
