let auth;
function waitForFirebase(callback) {
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        auth = firebase.auth();
        callback();
    } else {
        setTimeout(() => waitForFirebase(callback), 100);
    }
}

async function syncUserWithBackend(user) {
    try {
        const response = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                phone: user.phoneNumber
            })
        });
        if (!response.ok) throw new Error('Sync failed');
        const data = await response.json();
        return data.data; // Return synced MongoDB user
    } catch (err) {
        console.warn('Backend sync failed, using client-side data:', err);
        return {
            id: user.uid,
            firebaseUid: user.uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            profilePic: user.photoURL || '',
            role: 'user'
        };
    }
}

waitForFirebase(() => {
    window.handleLogin = async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const successMsg = document.getElementById('successMsg');
        const formContainer = document.getElementById('loginForm') || document.getElementById('signinForm');

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Quick and dirty way to find the submit btn
        const btn = document.querySelector('button[type="submit"]') || document.querySelector('.login-btn');
        const originalBtnText = btn ? btn.innerText : 'Sign In';

        const isSignUpPage = window.location.pathname.includes('signin') || window.location.pathname.includes('signup');

        try {
            if (btn) {
                btn.disabled = true;
                btn.innerText = 'Processing...';
            }

            let userCredential;

            if (isSignUpPage) {
                // Sign Up
                userCredential = await auth.createUserWithEmailAndPassword(email, password);
            } else {
                // Sign In
                userCredential = await auth.signInWithEmailAndPassword(email, password);
            }

            const user = userCredential.user;

            // Sync with backend
            let dbUser = await syncUserWithBackend(user);

            // Store minimal info in localStorage for UI updates
            localStorage.setItem('savourlyUser', JSON.stringify(dbUser));

            // Show success UI
            if (formContainer) formContainer.style.display = 'none';
            if (successMsg) {
                successMsg.classList.add('show');
                const redirectP = successMsg.querySelector('p');
                if (dbUser.role === 'admin') {
                    if (redirectP) redirectP.textContent = 'Redirecting to Admin Dashboard...';
                } else if (dbUser.role === 'delivery') {
                    if (redirectP) redirectP.textContent = 'Redirecting to Delivery App...';
                } else {
                    if (redirectP) redirectP.textContent = 'Redirecting to Home...';
                }
            }

            // Redirect
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect');

            setTimeout(() => {
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else if (dbUser.role === 'admin') {
                    window.location.href = '/admin';
                } else if (dbUser.role === 'delivery') {
                    window.location.href = '/delivery';
                } else {
                    window.location.href = '/';
                }
            }, 1500);

        } catch (error) {
            console.error(error);
            alert(error.message);
            if (btn) {
                btn.disabled = false;
                btn.innerText = originalBtnText;
            }
        }
    };

    window.handleSignIn = window.handleLogin; // Map handleSignIn to the same robust function

    // Social Login
    window.socialLogin = async (providerName) => {
        try {
            let provider;
            if (providerName === 'Google') {
                provider = new firebase.auth.GoogleAuthProvider();
            } else {
                alert(`${providerName} login not implemented specific demo.`);
                return;
            }

            const result = await auth.signInWithPopup(provider);
            const user = result.user;

            // Sync with backend
            let dbUser = await syncUserWithBackend(user);

            // Store user info
            localStorage.setItem('savourlyUser', JSON.stringify(dbUser));

            // Redirect
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect');

            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else {
                window.location.href = '/';
            }

        } catch (error) {
            if (error.code !== 'auth/popup-closed-by-user') {
                console.error(error);
                alert(error.message);
            }
        }
    };
});
