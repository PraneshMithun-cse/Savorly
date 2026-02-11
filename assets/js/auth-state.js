/**
 * auth-state.js — Firebase Auth State Persistence for Navbar
 * 
 * This script listens for Firebase auth state changes and updates the navbar:
 * - Logged in:  Replace "Login" button with a profile icon dropdown (My Orders / Logout)
 * - Logged out: Show the "Login" button
 * 
 * Include this script on every page that has the navbar (index.html, etc.)
 * AFTER the Firebase SDK scripts.
 */

(function () {
  'use strict';

  // Wait for Firebase to be ready
  function waitForFirebase(callback) {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      callback();
    } else {
      setTimeout(() => waitForFirebase(callback), 100);
    }
  }

  waitForFirebase(function () {
    const auth = firebase.auth();

    // Inject profile dropdown CSS
    const style = document.createElement('style');
    style.textContent = `
      .user-profile-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
      }
      .user-profile-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid #00C9A7;
        background: linear-gradient(135deg, #00C9A7, #00e6be);
        color: #fff;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        overflow: hidden;
        padding: 0;
      }
      .user-profile-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 201, 167, 0.3);
      }
      .user-profile-btn img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
      }
      .user-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        border: 1px solid #eee;
        min-width: 200px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-8px);
        transition: all 0.2s ease;
        z-index: 1000;
        overflow: hidden;
      }
      .user-dropdown.show {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
      .user-dropdown-header {
        padding: 14px 16px;
        border-bottom: 1px solid #f0f0f0;
      }
      .user-dropdown-header .user-name {
        font-size: 14px;
        font-weight: 600;
        color: #111;
        margin-bottom: 2px;
      }
      .user-dropdown-header .user-email {
        font-size: 12px;
        color: #888;
        word-break: break-all;
      }
      .user-dropdown-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        text-decoration: none;
        color: #333;
        font-size: 14px;
        font-weight: 500;
        transition: background 0.15s;
        cursor: pointer;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        font-family: inherit;
      }
      .user-dropdown-item:hover {
        background: #f8f9fa;
      }
      .user-dropdown-item svg {
        width: 18px;
        height: 18px;
        color: #666;
      }
      .user-dropdown-item.logout-item {
        border-top: 1px solid #f0f0f0;
        color: #ef4444;
      }
      .user-dropdown-item.logout-item svg {
        color: #ef4444;
      }
      /* Mobile: also replace the login link inside mobile menu */
      .mobile-nav-actions .user-profile-wrapper {
        width: 100%;
        justify-content: center;
      }
    `;
    document.head.appendChild(style);

    auth.onAuthStateChanged(function (user) {
      if (user) {
        // User is logged in — replace Login buttons with profile icon
        replaceLoginWithProfile(user);
      } else {
        // User is logged out — restore Login buttons (default state)
        restoreLoginButtons();
      }
    });

    function getInitials(user) {
      if (user.displayName) {
        return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      }
      if (user.email) {
        return user.email[0].toUpperCase();
      }
      return 'U';
    }

    function replaceLoginWithProfile(user) {
      // Desktop login button
      const desktopLogin = document.querySelector('.nav-actions .btn.btn-outline.desktop-only');
      if (desktopLogin) {
        const wrapper = createProfileDropdown(user, 'desktop');
        desktopLogin.replaceWith(wrapper);
      }

      // Mobile menu login link
      const mobileLogin = document.querySelector('.mobile-nav-actions .btn.btn-outline');
      if (mobileLogin) {
        const wrapper = createProfileDropdown(user, 'mobile');
        mobileLogin.replaceWith(wrapper);
      }
    }

    function createProfileDropdown(user, variant) {
      const wrapper = document.createElement('div');
      wrapper.className = 'user-profile-wrapper';
      wrapper.setAttribute('data-auth-element', variant);

      // Profile button
      const btn = document.createElement('button');
      btn.className = 'user-profile-btn';
      btn.setAttribute('aria-label', 'User profile');

      if (user.photoURL) {
        btn.innerHTML = `<img src="${user.photoURL}" alt="Profile" referrerpolicy="no-referrer">`;
      } else {
        btn.textContent = getInitials(user);
      }

      // Dropdown
      const dropdown = document.createElement('div');
      dropdown.className = 'user-dropdown';

      const displayName = user.displayName || user.email.split('@')[0];

      dropdown.innerHTML = `
        <div class="user-dropdown-header">
          <div class="user-name">${displayName}</div>
          <div class="user-email">${user.email}</div>
        </div>
        <a href="profile.html" class="user-dropdown-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          My Profile & Orders
        </a>
        <button class="user-dropdown-item logout-item" id="logoutBtn-${variant}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      `;

      wrapper.appendChild(btn);
      wrapper.appendChild(dropdown);

      // Toggle dropdown
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });

      // Close on outside click
      document.addEventListener('click', function () {
        dropdown.classList.remove('show');
      });

      // Logout handler
      dropdown.querySelector(`#logoutBtn-${variant}`).addEventListener('click', function () {
        auth.signOut().then(() => {
          localStorage.removeItem('savourlyUser');
          localStorage.removeItem('savourlyAuthToken');
          window.location.href = 'index.html';
        });
      });

      return wrapper;
    }

    function restoreLoginButtons() {
      // Restore desktop login
      const desktopProfile = document.querySelector('.nav-actions [data-auth-element="desktop"]');
      if (desktopProfile) {
        const loginLink = document.createElement('a');
        loginLink.href = 'login.html';
        loginLink.className = 'btn btn-outline desktop-only';
        loginLink.textContent = 'Login';
        desktopProfile.replaceWith(loginLink);
      }

      // Restore mobile login
      const mobileProfile = document.querySelector('[data-auth-element="mobile"]');
      if (mobileProfile) {
        const loginLink = document.createElement('a');
        loginLink.href = 'login.html';
        loginLink.className = 'btn btn-outline';
        loginLink.textContent = 'Login';
        mobileProfile.replaceWith(loginLink);
      }
    }
  });
})();
