// news-loader.js - loads top news items into elements with class "trending-news-list"
// Also populates #news-carousel with an image/title/subtitle carousel which links to news pages.

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

  // Helpers
  function escapeHtml(s){ if(s === undefined || s === null) return ''; return s.toString().replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

  function normalizeImgurUrl(url){
    if(!url) return url;
    try{
      const u = url.trim();
      if(/^https?:\/\/i\.imgur\.com\//i.test(u)) return u;
      const m = u.match(/imgur\.com\/(?:a\/|gallery\/)?([A-Za-z0-9]+)/i);
      if(m && m[1]) return 'https://i.imgur.com/' + m[1] + '.jpg';
      return u;
    }catch(e){ return url; }
  }

  function makeImgElement(src, classes, alt){
    const img = document.createElement('img');
    img.className = classes || '';
    img.loading = 'lazy';
    img.alt = alt || 'news image';
    img.src = normalizeImgurUrl(src || '');
    img.onerror = function(){
      const m = this.src.match(/i\.imgur\.com\/([A-Za-z0-9]+)(\.[a-z]+)?$/i);
      if(m && m[1] && !m[2]){ this.src = 'https://i.imgur.com/' + m[1] + '.jpg'; return; }
      // fallback placeholder SVG
      this.src = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-size="28">Image not available</text></svg>');
    };
    return img;
  }

  // Carousel logic
  function createCarousel(items){
    const slidesContainer = document.getElementById('carousel-slides');
    const indicatorsContainer = document.getElementById('carousel-indicators');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    if(!slidesContainer) return;

    slidesContainer.innerHTML = '';
    indicatorsContainer && (indicatorsContainer.innerHTML = '');

    if(!items || items.length === 0){
      slidesContainer.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500 p-6">No news to show</div>';
      prevBtn && (prevBtn.style.display = 'none');
      nextBtn && (nextBtn.style.display = 'none');
      return;
    }

    // create slides
    items.forEach((n, idx) => {
      const a = document.createElement('a');
      a.href = '/news.html?id=' + encodeURIComponent(n.id);
      a.className = 'carousel-slide absolute inset-0 transition-opacity duration-500';
      // Initially hide; show will remove hidden class
      if(idx !== 0) a.style.opacity = '0'; else a.style.opacity = '1';
      a.style.pointerEvents = (idx === 0) ? 'auto' : 'none';

      // image
      const imgWrap = document.createElement('div');
      imgWrap.className = 'w-full h-full';
      const img = makeImgElement(n.imageUrl || n.image || '', 'w-full h-full object-cover', n.title || 'news image');
      imgWrap.appendChild(img);
      a.appendChild(imgWrap);

      // gradient + text overlay
      const overlay = document.createElement('div');
      overlay.className = 'absolute inset-x-0 bottom-0 p-4 sm:p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent text-white';
      overlay.innerHTML = `<h3 class="text-sm sm:text-lg font-semibold mb-1">${escapeHtml(n.title || 'Untitled')}</h3>
                           <p class="hidden sm:block text-xs opacity-90">${escapeHtml(n.summary || '')}</p>`;
      a.appendChild(overlay);

      slidesContainer.appendChild(a);

      // indicator
      if(indicatorsContainer){
        const dot = document.createElement('button');
        dot.className = 'w-2 h-2 rounded-full bg-white/60 hover:bg-white active:scale-95';
        dot.setAttribute('aria-label','Go to slide ' + (idx+1));
        dot.dataset.index = idx;
        indicatorsContainer.appendChild(dot);
      }
    });

    // controls visibility
    if(items.length <= 1){
      prevBtn && (prevBtn.style.display = 'none');
      nextBtn && (nextBtn.style.display = 'none');
      indicatorsContainer && (indicatorsContainer.style.display = 'none');
      return;
    } else {
      prevBtn && (prevBtn.style.display = '');
      nextBtn && (nextBtn.style.display = '');
      indicatorsContainer && (indicatorsContainer.style.display = 'flex');
    }

    // carousel state & behavior
    let current = 0;
    let autoTimer = null;
    const slides = Array.from(slidesContainer.querySelectorAll('.carousel-slide'));
    const dots = indicatorsContainer ? Array.from(indicatorsContainer.children) : [];

    function show(i){
      i = (i + slides.length) % slides.length;
      slides.forEach((s, idx) => {
        if(idx === i){
          s.style.opacity = '1';
          s.style.pointerEvents = 'auto';
        } else {
          s.style.opacity = '0';
          s.style.pointerEvents = 'none';
        }
      });
      dots.forEach((d, idx) => d.style.opacity = (idx === i) ? '1' : '0.6');
      current = i;
    }

    function next(){ show(current + 1); }
    function prev(){ show(current - 1); }

    // event listeners
    nextBtn && nextBtn.addEventListener('click', (e) => { e.preventDefault(); stopAuto(); next(); startAuto(); });
    prevBtn && prevBtn.addEventListener('click', (e) => { e.preventDefault(); stopAuto(); prev(); startAuto(); });

    if(dots.length){
      dots.forEach(d => {
        d.addEventListener('click', (e) => {
          e.preventDefault();
          stopAuto();
          const idx = parseInt(d.dataset.index, 10) || 0;
          show(idx);
          startAuto();
        });
      });
    }

    // pause on hover
    slidesContainer.addEventListener('mouseenter', stopAuto);
    slidesContainer.addEventListener('mouseleave', startAuto);

    function startAuto(){
      stopAuto();
      autoTimer = setInterval(next, 5000);
    }
    function stopAuto(){
      if(autoTimer) clearInterval(autoTimer);
      autoTimer = null;
    }

    // set initial styles for indicators
    dots.forEach((d, idx) => {
      d.style.width = '10px';
      d.style.height = '10px';
      d.style.borderRadius = '9999px';
      d.style.padding = '0';
      d.style.opacity = (idx === 0) ? '1' : '0.6';
    });

    startAuto();
    show(0);
  }

  // original trending list population (keeps your previous behavior)
  async function populateTrendingList(items){
    const lists = document.querySelectorAll('.trending-news-list');
    lists.forEach(list=>{
      list.innerHTML = '';
      if(!items || items.length === 0){ list.innerHTML = '<div class="text-sm text-gray-500 p-2">No news</div>'; return; }
      items.forEach(n=>{
        const a = document.createElement('a');
        a.href = '/news.html?id='+encodeURIComponent(n.id);
        a.className = 'block text-sm py-2 hover:bg-gray-50 px-2';
        a.innerHTML = `<div class="font-medium">${escapeHtml(n.title||'Untitled')}</div><div class="text-xs text-gray-500">${escapeHtml(n.summary||'')}</div>`;
        list.appendChild(a);
      });
    });
  }

  // fetch news and populate both trending list and carousel
  async function load(){
    try{
      const snap = await db.collection('news').orderBy('createdAt','desc').limit(6).get();
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // populate trending list
      populateTrendingList(items);
      // populate carousel
      createCarousel(items);
    }catch(err){
      console.warn('news-loader failed', err);
      // show errors gracefully
      document.querySelectorAll('.trending-news-list').forEach(l => l.innerHTML = '<div class="text-sm text-gray-500 p-2">Unable to load news</div>');
      const slidesContainer = document.getElementById('carousel-slides');
      if(slidesContainer) slidesContainer.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500 p-6">Unable to load news</div>';
    }
  }

  // ensure the script runs after DOM ready. If DOMContentLoaded already fired, call load immediately.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    // DOM already ready (deferred scripts often land here); run immediately
    setTimeout(load, 0);
  }
})();
