// news.js - render a single news item from Firestore (collection: news)
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
  function qParam(name){ const u = new URL(location.href); return u.searchParams.get(name); }
  const id = qParam('id');
  const container = document.getElementById('news-container');
  if(!id){ container.innerHTML = '<div class="p-6 text-red-500">No news id provided.</div>'; return; }
  container.innerHTML = '<div class="p-6 text-gray-500">Loading…</div>';
  try{
    const doc = await db.collection('news').doc(id).get();
    if(!doc.exists){ container.innerHTML = '<div class="p-6 text-red-500">News not found.</div>'; return; }
    const n = doc.data();
    // normalize image URL: remove trailing slash if present
    let img = n.imageUrl || null;
    if(img && img.endsWith('/')) img = img.slice(0, -1);
    // render body preserving paragraphs (split on double-newline)
    const rawBody = n.body || n.summary || '';
    const paragraphs = rawBody.split(/\n\s*\n/).map(p=>escapeHtml(p.trim())).filter(Boolean).map(p=>`<p>${p.replace(/\n/g,'<br/>')}</p>`).join('');

    // Build elements dynamically so we can attach diagnostics and onerror fallbacks for the image
    container.innerHTML = '';
    const titleEl = document.createElement('h1'); titleEl.className='text-2xl font-bold mb-2'; titleEl.textContent = n.title || 'Untitled';
    const dateEl = document.createElement('p'); dateEl.className='text-sm text-gray-500 mb-4'; dateEl.textContent = new Date(n.createdAt?.seconds ? n.createdAt.seconds*1000 : Date.now()).toLocaleString();
    container.appendChild(titleEl);
    container.appendChild(dateEl);

    if(img){
      const imgEl = document.createElement('img');
      imgEl.className = 'w-full rounded mb-4';
      // diagnostic: log original url
      console.log('news.js: news image url (raw):', n.imageUrl, 'normalized:', img);
      let tried = 0;
      const tryVariants = async () => {
        tried++;
        // attempt order handled by onerror
      };
      // helper to extract a plausible file id (UUID-like) from url
      function extractFileId(u){
        if(!u) return null;
        // common Uploadcare uuid pattern: hex and dash groups or alnum
        const m = u.match(/([0-9a-f]{8}[-]?[0-9a-f]{4}[-]?[0-9a-f]{4}[-]?[0-9a-f]{4}[-]?[0-9a-f]{12}|[0-9a-zA-Z]{20,})/i);
        return m ? m[1] : null;
      }
      const fileId = extractFileId(img) || extractFileId(n.imageUrl);

      const fallbackUrls = [];
      // original normalized
      fallbackUrls.push(img);
      // try with trailing slash
      if(!img.endsWith('/')) fallbackUrls.push(img + '/');
      // try format auto transform (Uploadcare)
      fallbackUrls.push((img || '') + '/-/format/auto/');
      // construct using common ucaredn domain if fileId looks like a uuid
      if(fileId){
        fallbackUrls.push('https://ucarecdn.com/' + fileId + '/');
        // also try custom CDN base used in this project
        fallbackUrls.push('https://12hsb3bgrj.ucarecd.net/' + fileId + '/');
      }

      let idx = 0;
      imgEl.onerror = function(){
        console.warn('news.js: image load failed for', imgEl.src);
        idx++;
        if(idx < fallbackUrls.length){
          imgEl.src = fallbackUrls[idx];
        } else {
          // final fallback: remove image element
          imgEl.remove();
        }
      };
      // start with first variant
      imgEl.src = fallbackUrls[0];
      container.appendChild(imgEl);
    }

    const contentWrap = document.createElement('div'); contentWrap.className = 'prose max-w-none text-gray-800';
    contentWrap.innerHTML = paragraphs || '<p>No content</p>';
    container.appendChild(contentWrap);

    // ------- like / comment / share actions -------
    const actionsRow = document.createElement('div'); actionsRow.className = 'flex items-center gap-4 mt-4 text-sm text-gray-600';
    const likeBtn = document.createElement('button'); likeBtn.className = 'flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50';
    const commentToggleBtn = document.createElement('button'); commentToggleBtn.className = 'flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50';
    const shareBtn = document.createElement('button'); shareBtn.className = 'flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50';
    likeBtn.innerHTML = '<i class="far fa-thumbs-up"></i> <span class="ml-1 like-count">'+(n.likeCount||0)+'</span>';
    commentToggleBtn.innerHTML = '<i class="far fa-comment"></i> <span class="ml-1 comment-count">'+(n.commentCount||0)+'</span>';
    shareBtn.innerHTML = '<i class="fas fa-share"></i> <span class="ml-1 share-count">'+(n.shareCount||0)+'</span>';
    actionsRow.appendChild(likeBtn); actionsRow.appendChild(commentToggleBtn); actionsRow.appendChild(shareBtn);
    container.appendChild(actionsRow);

    const newsRef = db.collection('news').doc(id);
    const likesRef = (uid)=> newsRef.collection('likes').doc(uid);
    const commentsRef = newsRef.collection('comments');

    // comment area
    const commentArea = document.createElement('div'); commentArea.className='mt-4';
    const commentList = document.createElement('div'); commentList.className='space-y-3 mb-3';
    const commentFormWrap = document.createElement('div');
    const commentInput = document.createElement('textarea'); commentInput.className='w-full border rounded px-3 py-2'; commentInput.rows = 2; commentInput.placeholder = 'Add a comment...';
    const commentSubmit = document.createElement('button'); commentSubmit.className='mt-2 px-3 py-2 bg-two text-white rounded'; commentSubmit.textContent = 'Post comment';
    commentFormWrap.appendChild(commentInput); commentFormWrap.appendChild(commentSubmit);
    commentArea.appendChild(commentList); commentArea.appendChild(commentFormWrap);
    commentArea.style.display = 'none';
    container.appendChild(commentArea);

    // helper to refresh counts shown
    async function refreshCounts(){
      const snap = await newsRef.get();
      const data = snap.exists ? snap.data() : {};
      actionsRow.querySelector('.like-count').textContent = data.likeCount || 0;
      actionsRow.querySelector('.comment-count').textContent = data.commentCount || 0;
      actionsRow.querySelector('.share-count').textContent = data.shareCount || 0;
    }

    // get current user id (fallback to guest id stored locally)
    function getCurrentUid(){
      try{
        if(window.firebase && firebase.auth && firebase.auth().currentUser){
          const u = firebase.auth().currentUser;
          if(u && u.uid) return { uid: u.uid, displayName: u.displayName || u.email || 'User', isGuest: false };
        }
      }catch(e){ /* firebase not available or not initialized */ }
      // guest fallback: stable id in localStorage
      let gid = localStorage.getItem('campus_guest_id');
      if(!gid){ gid = 'guest_' + Math.random().toString(36).slice(2,10); localStorage.setItem('campus_guest_id', gid); }
      return { uid: gid, displayName: 'Guest', isGuest: true };
    }

    // like: toggle with transaction and track per-user like in subcollection
    async function toggleLike(){
      const userObj = getCurrentUid();
      if(!userObj) return alert('Unable to identify user');
      const uid = userObj.uid;
      try{
        await db.runTransaction(async (tx)=>{
          const docSnap = await tx.get(newsRef);
          const likeDocRef = likesRef(uid);
          const likeSnap = await tx.get(likeDocRef);
          const currentCount = docSnap.exists ? (docSnap.data().likeCount||0) : 0;
          if(likeSnap.exists){
            tx.delete(likeDocRef);
            tx.update(newsRef, { likeCount: Math.max(0, currentCount-1) });
          } else {
            tx.set(likeDocRef, { uid: uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            tx.update(newsRef, { likeCount: (currentCount||0)+1 });
          }
        });
        await refreshCounts();
      }catch(err){ console.error('Like toggle failed', err); alert('Failed to update like'); }
    }

  likeBtn.addEventListener('click', toggleLike);

    // comments: load and render
    async function loadComments(){
      commentList.innerHTML = '<div class="text-sm text-gray-500">Loading comments…</div>';
      try{
        const snap = await commentsRef.orderBy('createdAt','asc').limit(500).get();
        commentList.innerHTML = '';
        snap.forEach(doc=>{
          const c = doc.data();
          const el = document.createElement('div');
          el.className = 'p-2 border rounded bg-gray-50';
          el.innerHTML = `<div class="text-sm font-medium">${escapeHtml(c.name||c.displayName||'Anonymous')}</div><div class="text-sm text-gray-700">${escapeHtml((c.text||'').replace(/\n/g,'<br/>'))}</div><div class="text-xs text-gray-400">${new Date(c.createdAt?.seconds?c.createdAt.seconds*1000:Date.now()).toLocaleString()}</div>`;
          commentList.appendChild(el);
        });
      }catch(err){ console.error(err); commentList.innerHTML = '<div class="text-sm text-red-500">Failed loading comments</div>'; }
    }

    commentToggleBtn.addEventListener('click', async ()=>{
      if(commentArea.style.display === 'none'){
        commentArea.style.display = 'block';
        await loadComments();
      } else {
        commentArea.style.display = 'none';
      }
    });

    commentSubmit.addEventListener('click', async ()=>{
      const text = (commentInput.value||'').trim();
      if(!text) return alert('Please type a comment');
      const userObj = getCurrentUid();
      try{
        const data = { text, uid: userObj.uid, displayName: userObj.displayName || 'Guest', createdAt: firebase.firestore.FieldValue.serverTimestamp() };
        await commentsRef.add(data);
        // increment commentCount atomically
        await newsRef.update({ commentCount: firebase.firestore.FieldValue.increment(1) });
        commentInput.value = '';
        await loadComments();
        await refreshCounts();
      }catch(err){ console.error('Failed posting comment', err); alert('Failed to post comment'); }
    });

    // share: try native share then copy link; increment shareCount
    shareBtn.addEventListener('click', async ()=>{
      const shareUrl = location.origin + location.pathname + '?id=' + encodeURIComponent(id);
      try{
        if(navigator.share){ await navigator.share({ title: n.title || 'News', text: (n.summary||''), url: shareUrl }); }
        // increment share count
        await newsRef.update({ shareCount: firebase.firestore.FieldValue.increment(1) });
        await refreshCounts();
      }catch(err){
        // fallback: copy to clipboard
        try{ await navigator.clipboard.writeText(shareUrl); alert('Link copied to clipboard'); await newsRef.update({ shareCount: firebase.firestore.FieldValue.increment(1) }); await refreshCounts(); }catch(e){ alert('Share failed'); }
      }
    });

    // initial counts refresh and comments load (if any)
    refreshCounts();
    // show comments area collapsed initially
  }catch(err){ console.error(err); container.innerHTML = '<div class="p-6 text-red-500">Failed loading news.</div>'; }
  function escapeHtml(s){ if(!s) return ''; return s.toString().replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
})();
