// reset.js — standalone: initializes Firebase compat if needed, provides forgot+reset handlers
// It also provides a minimal modal with showLoading/showSuccess/showError.
//
// Update FIREBASE_CONFIG if you want to override in-page window.FIREBASE_CONFIG.

const FIREBASE_CONFIG = window.FIREBASE_CONFIG || {
  apiKey: "AIzaSyDC3L5vruhYXfarn5O81cLld50oagYkmxE",
  authDomain: "campus-leaders.firebaseapp.com",
  projectId: "campus-leaders",
  storageBucket: "campus-leaders.firebasestorage.app",
  messagingSenderId: "445360528951",
  appId: "1:445360528951:web:712da8859c8ac4cb6129b2"
};

// wait for compat SDK to be available
async function waitForFirebaseSDK(timeoutMs = 6000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.firebase && firebase.auth && firebase.app) return true;
    await new Promise(r => setTimeout(r, 100));
  }
  return false;
}

// Minimal modal (re-usable)
function createModal() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.left = 0;
  overlay.style.top = 0;
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.display = 'none';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = 9999;
  overlay.style.backdropFilter = 'blur(3px)';
  overlay.style.background = 'rgba(0,0,0,0.25)';

  const card = document.createElement('div');
  card.style.background = 'white';
  card.style.padding = '20px';
  card.style.borderRadius = '12px';
  card.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
  card.style.maxWidth = '420px';
  card.style.width = '90%';
  card.style.textAlign = 'center';

  const title = document.createElement('div');
  title.style.fontWeight = 700;
  title.style.marginBottom = '8px';
  const body = document.createElement('div');
  body.style.fontSize = '14px';
  body.style.color = '#374151';
  body.style.marginBottom = '12px';
  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.justifyContent = 'center';
  actions.style.gap = '8px';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.padding = '8px 12px';
  closeBtn.style.borderRadius = '8px';
  closeBtn.style.border = 'none';
  closeBtn.style.cursor = 'pointer';
  closeBtn.addEventListener('click', () => hide());

  actions.appendChild(closeBtn);
  card.appendChild(title);
  card.appendChild(body);
  card.appendChild(actions);
  overlay.appendChild(card);

  function showLoading(message = 'Loading...') {
    title.textContent = 'Please wait';
    body.textContent = message;
    actions.innerHTML = '';
    actions.appendChild(closeBtn);
    overlay.style.display = 'flex';
  }
  function showSuccess(message = 'Success') {
    title.textContent = 'Success';
    body.textContent = message;
    actions.innerHTML = '';
    const ok = document.createElement('button');
    ok.textContent = 'OK';
    ok.style.padding = '8px 12px';
    ok.style.borderRadius = '8px';
    ok.style.border = 'none';
    ok.style.cursor = 'pointer';
    ok.addEventListener('click', () => hide());
    actions.appendChild(ok);
    overlay.style.display = 'flex';
  }
  function showError(message = 'Error') {
    title.textContent = 'Error';
    body.textContent = message;
    actions.innerHTML = '';
    const ok = document.createElement('button');
    ok.textContent = 'OK';
    ok.style.padding = '8px 12px';
    ok.style.borderRadius = '8px';
    ok.style.border = 'none';
    ok.style.cursor = 'pointer';
    ok.addEventListener('click', () => hide());
    actions.appendChild(ok);
    overlay.style.display = 'flex';
  }
  function addActionButton(text, cb) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.padding = '8px 12px';
    btn.style.borderRadius = '8px';
    btn.style.border = 'none';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', cb);
    actions.appendChild(btn);
    overlay.style.display = 'flex';
    return btn;
  }
  function hide() { overlay.style.display = 'none'; }

  return { el: overlay, showLoading, showSuccess, showError, hide, addActionButton };
}

// Main init + handlers
(async function main() {
  const ok = await waitForFirebaseSDK(6000);
  const modal = createModal();
  document.body.appendChild(modal.el);

  if (!ok) {
    console.error('Firebase compat SDK not found within timeout. Reset functionality will not work.');
    // If you want, show a modal informing the user
    modal.showError('Internal error: Firebase not available. Try again later.');
    return;
  }

  try {
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(FIREBASE_CONFIG);
      console.log('Firebase initialized by reset.js');
    } else {
      console.log('Firebase already initialized');
    }
  } catch (err) {
    console.warn('Firebase init warning:', err);
  }

  function getAuth() {
    if (typeof firebase !== 'undefined' && firebase.auth) return firebase.auth();
    return null;
  }

  async function sendPasswordResetEmailHelper(email, actionUrl = null) {
    const auth = getAuth();
    if (!auth) throw new Error('Firebase Auth not initialized.');
    const actionCodeSettings = actionUrl ? { url: actionUrl, handleCodeInApp: false } : undefined;
    return auth.sendPasswordResetEmail(email, actionCodeSettings);
  }

  async function confirmPasswordResetHelper(oobCode, newPassword) {
    const auth = getAuth();
    if (!auth) throw new Error('Firebase Auth not initialized.');
    return auth.confirmPasswordReset(oobCode, newPassword);
  }

  async function verifyPasswordResetCodeHelper(oobCode) {
    const auth = getAuth();
    if (!auth) throw new Error('Firebase Auth not initialized.');
    return auth.verifyPasswordResetCode(oobCode);
  }

  // DOM handlers
  document.addEventListener('DOMContentLoaded', () => {
    // Forgot form
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
      const emailInput = document.getElementById('forgot-email');
      const msgEl = document.getElementById('forgot-msg');
      const submitBtn = document.getElementById('forgot-submit');

      forgotForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        msgEl.textContent = ''; msgEl.style.color = '';
        const email = (emailInput.value || '').trim();
        if (!email) { msgEl.style.color='crimson'; msgEl.textContent = 'Please enter your email.'; return; }

        try {
          modal.showLoading('Sending password reset email...');
          // use reset page as continueUrl so user ends up on reset-password.html
          const continueUrl = window.location.origin + '/reset-password.html';
          await sendPasswordResetEmailHelper(email, continueUrl);
          modal.showSuccess('Reset email sent. Check your inbox (and spam).');
          msgEl.style.color = 'green';
          msgEl.textContent = 'Reset email sent. Check your inbox (and spam).';
          // optional: clear form
          emailInput.value = '';
        } catch (err) {
          console.error('sendPasswordResetEmail error', err);
          modal.showError(err && err.message ? err.message : 'Failed to send reset email.');
          msgEl.style.color = 'crimson';
          if (err && err.code === 'auth/user-not-found') msgEl.textContent = 'No account found with that email.';
          else if (err && err.code === 'auth/invalid-email') msgEl.textContent = 'Invalid email address.';
          else msgEl.textContent = err.message || 'Failed to send reset email.';
        }
      });
    }

    // Reset form (confirm password)
    const resetForm = document.getElementById('reset-form');
    if (resetForm) {
      const msgEl = document.getElementById('reset-msg');
      const emailEl = document.getElementById('reset-email');
      const passwordInput = document.getElementById('reset-password');
      const confirmInput = document.getElementById('reset-password-confirm');
      const submitBtn = document.getElementById('reset-submit');

      const params = new URLSearchParams(window.location.search);
      const oobCode = params.get('oobCode') || params.get('oobcode') || params.get('code');

      if (!oobCode) {
        msgEl.style.color = 'crimson';
        msgEl.textContent = 'Invalid or missing reset code. Open the link from your email.';
        resetForm.querySelectorAll('input,button').forEach(i=>i.disabled=true);
        return;
      }

      (async () => {
        try {
          modal.showLoading('Verifying reset link...');
          const email = await verifyPasswordResetCodeHelper(oobCode);
          modal.hide();
          if (emailEl) emailEl.textContent = email;
        } catch (err) {
          console.error('verifyPasswordResetCode error', err);
          modal.showError(err && err.message ? err.message : 'Invalid or expired reset link.');
          msgEl.style.color = 'crimson';
          if (err && err.code === 'auth/expired-action-code') msgEl.textContent = 'This reset link has expired.';
          else if (err && err.code === 'auth/invalid-action-code') msgEl.textContent = 'Invalid reset link.';
          else msgEl.textContent = err.message || 'Could not verify reset link.';
          resetForm.querySelectorAll('input,button').forEach(i=>i.disabled=true);
        }
      })();

      resetForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        msgEl.textContent = ''; msgEl.style.color = '';
        const p1 = (passwordInput.value || '').trim();
        const p2 = (confirmInput.value || '').trim();
        if (!p1 || !p2) { msgEl.style.color='crimson'; msgEl.textContent = 'Please fill both password fields.'; return; }
        if (p1 !== p2) { msgEl.style.color='crimson'; msgEl.textContent = 'Passwords do not match.'; return; }
        if (p1.length < 6) { msgEl.style.color='crimson'; msgEl.textContent = 'Password should be at least 6 characters.'; return; }

        try {
          modal.showLoading('Updating password...');
          await confirmPasswordResetHelper(oobCode, p1);
          modal.showSuccess('Password updated — you can now sign in.');
          msgEl.style.color = 'green';
          msgEl.textContent = 'Password updated. Redirecting to login...';
          setTimeout(()=>{ window.location.href = '/index.html'; }, 1500);
        } catch (err) {
          console.error('confirmPasswordReset error', err);
          modal.showError(err && err.message ? err.message : 'Failed to reset password.');
          msgEl.style.color = 'crimson';
          if (err && err.code === 'auth/weak-password') msgEl.textContent = 'Password is too weak.';
          else if (err && err.code === 'auth/expired-action-code') msgEl.textContent = 'Reset link expired.';
          else if (err && err.code === 'auth/invalid-action-code') msgEl.textContent = 'Invalid reset link.';
          else msgEl.textContent = err.message || 'Failed to reset password.';
        }
      });
    }

  }); // DOMContentLoaded
})(); 
