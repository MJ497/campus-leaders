
const firebaseConfig = {
   apiKey: "AIzaSyDC3L5vruhYXfarn5O81cLld50oagYkmxE",
  authDomain: "campus-leaders.firebaseapp.com",
  projectId: "campus-leaders",
  storageBucket: "campus-leaders.firebasestorage.app",
  messagingSenderId: "445360528951",
  appId: "1:445360528951:web:712da8859c8ac4cb6129b2"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const sectionId = this.getAttribute('data-section');
                showSection(sectionId);
                
                // Update active tab
                document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active-tab'));
                this.classList.add('active-tab');
            });
        });
        
        // Admin tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.getAttribute('data-admin-tab');
                
                // Update active tab
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active-tab'));
                this.classList.add('active-tab');
                
                // Show corresponding content
                document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.add('hidden'));
                document.getElementById(`admin-${tabId}`).classList.remove('hidden');
            });
        });
        
        // Settings tabs
        document.querySelectorAll('[data-settings-tab]').forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                const tabId = this.getAttribute('data-settings-tab');
                
                // Update active tab
                document.querySelectorAll('[data-settings-tab]').forEach(t => {
                    t.classList.remove('bg-gray-100');
                    t.classList.add('hover:bg-gray-100');
                });
                this.classList.add('bg-gray-100');
                this.classList.remove('hover:bg-gray-100');
                
                // Show corresponding content
                document.querySelectorAll('.settings-tab-content').forEach(content => content.classList.add('hidden'));
                document.getElementById(`settings-${tabId}`).classList.remove('hidden');
            });
        });
        
        // User menu
        document.getElementById('user-menu-button').addEventListener('click', function() {
            document.getElementById('user-menu').classList.toggle('hidden');
        });
        
        // Show section function
        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show requested section
            document.getElementById(sectionId).classList.add('active');
            
            // Special cases
            if (sectionId === 'courses') {
                document.getElementById('course-detail').classList.add('hidden');
            }
            
            // Close user menu if open
            document.getElementById('user-menu').classList.add('hidden');
            
            // Scroll to top
            window.scrollTo(0, 0);
        }
        
        // Course detail navigation
        document.querySelectorAll('[data-section="course-detail"]').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                document.getElementById('courses').classList.remove('active');
                document.getElementById('course-detail').classList.remove('hidden');
                window.scrollTo(0, 0);
            });
        });
        
        // Initialize with dashboard
        showSection('dashboard');
        
        // Initialize settings tab
        // document.querySelector('[data-settings-tab="profile"]').click();
        
     

        // coures script

          // Toggle course content sections
        document.querySelectorAll('.border-b button').forEach(btn => {
            btn.addEventListener('click', function() {
                const content = this.nextElementSibling;
                content.classList.toggle('hidden');
                
                // Rotate icon if present
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-chevron-down');
                    icon.classList.toggle('fa-chevron-up');
                }
            });
        });
        
        // Join live class functionality
        document.querySelectorAll('.join-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (this.textContent.trim() === 'Join Now') {
                    // Simulate joining a live class
                    this.textContent = 'Joined!';
                    this.classList.remove('bg-black', 'hover:bg-gray-800');
                    this.classList.add('bg-green-500', 'hover:bg-green-600');
                    
                    // Show confirmation
                    const toast = document.createElement('div');
                    toast.className = 'fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg';
                    toast.textContent = 'You have joined the live class!';
                    document.body.appendChild(toast);
                    
                    setTimeout(() => {
                        toast.remove();
                    }, 3000);
                }
            });
        });
        
        // Course card hover effect
        document.querySelectorAll('.course-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = '';
                this.style.boxShadow = '';
            });
        });
        
        // Tab switching
        document.querySelectorAll('.flex.border-b button').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.flex.border-b button').forEach(t => {
                    t.classList.remove('tab-active');
                });
                this.classList.add('tab-active');
            });
        });
        
        // Simulate navigation
        document.querySelectorAll('[href="#"]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
            });
        });

        document.addEventListener('DOMContentLoaded', () => {
    loadPublicFeeds();
});

async function loadPublicFeeds() {
    const feedContainer = document.getElementById('posts-feed');
    if (!feedContainer) return;

    feedContainer.innerHTML = '<p class="text-gray-500">Loading feeds...</p>';

    try {
        const snapshot = await db
            .collection('posts')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        feedContainer.innerHTML = '';

        if (snapshot.empty) {
            feedContainer.innerHTML = '<p class="text-gray-400">No posts yet.</p>';
            return;
        }

    snapshot.forEach(doc => {
    const post = doc.data();
 
    const postEl = renderPostCard(post, { readOnly: true });
    feedContainer.appendChild(postEl);
});


    } catch (err) {
        console.error('Feed load failed:', err);
        feedContainer.innerHTML =
            '<p class="text-red-500">Failed to load feeds.</p>';
    }
}

function formatMultilineText(text = '') {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function renderPostCard(post, options = {}) {
  const { readOnly = false } = options;

  const author =
    `${post.authorFirst || ''} ${post.authorLast || ''}`.trim() || 'Anonymous';

  const wrapper = document.createElement('div');
  wrapper.className = 'bg-white border border-gray-200 rounded-xl shadow-sm';

 wrapper.innerHTML = `
  <!-- header -->
  <div class="flex items-center gap-3 p-4">
    <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
      <i class="fas fa-user text-gray-500"></i>
    </div>
    <div>
      <div class="font-semibold leading-tight">${author}</div>
      <div class="text-xs text-gray-500">
        ${post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ''}
      </div>
    </div>
  </div>

  <!-- image -->
  ${post.imageUrl ? `
    <img
      src="${post.imageUrl}"
      class="w-full max-h-[520px] object-cover border-y border-gray-200"
    >
  ` : ''}

  <!-- content -->
  <div class="px-4 py-3">
    ${post.title ? `<h4 class="font-medium mb-1">${post.title}</h4>` : ''}
    ${post.body ? `
      <p class="text-gray-700 whitespace-pre-line">
        ${formatMultilineText(post.body)}
      </p>
    ` : ''}
  </div>

  <!-- actions -->
  <div class="flex justify-between items-center px-4 py-3 border-t text-sm text-gray-600">
    <div class="flex gap-6">
      <button class="flex items-center gap-2 ${readOnly ? 'cursor-not-allowed opacity-60' : ''}">
        <i class="far fa-heart"></i> Like
      </button>
      <button class="flex items-center gap-2 ${readOnly ? 'cursor-not-allowed opacity-60' : ''}">
        <i class="far fa-comment"></i> Comment
      </button>
    </div>
    ${readOnly ? `<span class="text-xs text-gray-400">Login to interact</span>` : ''}
  </div>
`;


  return wrapper;
}

