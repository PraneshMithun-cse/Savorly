'use client';
import Script from 'next/script';
import { useState, useEffect, useCallback } from 'react';

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAbOyzOi3xqyXNLWrmkL7pqMrxk_opjW1I",
    authDomain: "savorly-d2e63.firebaseapp.com",
    projectId: "savorly-d2e63",
    storageBucket: "savorly-d2e63.firebasestorage.app",
    messagingSenderId: "820941077673",
    appId: "1:820941077673:web:feffe61f09d5970c477db8",
    measurementId: "G-E3YQ1VSL75"
};

async function syncUserWithBackend(user: any) {
    try {
        // Transfer any localStorage addresses on login
        const localAddresses = JSON.parse(localStorage.getItem('savourlyAddresses') || '[]');
        const response = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uid: user.uid, email: user.email,
                displayName: user.displayName, photoURL: user.photoURL, phone: user.phoneNumber,
                localAddresses: localAddresses.length > 0 ? localAddresses : undefined
            })
        });
        if (!response.ok) throw new Error('Sync failed');
        const data = await response.json();
        // Clear localStorage addresses after successful transfer
        if (localAddresses.length > 0 && data.data?.addresses?.length) {
            localStorage.setItem('savourlyAddresses', JSON.stringify(data.data.addresses));
        }
        return data.data;
    } catch {
        return { id: user.uid, firebaseUid: user.uid, email: user.email, name: user.displayName || user.email?.split('@')[0], profilePic: user.photoURL || '', role: 'user' };
    }
}

function ensureFirebaseInit() {
    const fb = (window as any).firebase;
    if (fb && !fb.apps.length) {
        fb.initializeApp(FIREBASE_CONFIG);
    }
    return fb && fb.apps.length > 0;
}

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [firebaseReady, setFirebaseReady] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    useEffect(() => {
        const check = () => {
            if (typeof window !== 'undefined' && (window as any).firebase) {
                ensureFirebaseInit();
                if ((window as any).firebase.apps.length > 0) {
                    setFirebaseReady(true);
                    return true;
                }
            }
            return false;
        };
        if (!check()) {
            const interval = setInterval(() => { if (check()) clearInterval(interval); }, 150);
            const timeout = setTimeout(() => clearInterval(interval), 10000);
            return () => { clearInterval(interval); clearTimeout(timeout); };
        }
    }, []);

    const doRedirect = (dbUser: any) => {
        const form = document.getElementById('loginForm');
        const success = document.getElementById('successMsg');
        if (form) form.style.display = 'none';
        if (success) {
            success.classList.add('show');
            const p = success.querySelector('p');
            if (p) p.textContent = dbUser.role === 'admin' ? 'Redirecting to Admin Dashboard...' : dbUser.role === 'delivery' ? 'Redirecting to Delivery App...' : 'Redirecting to Home...';
        }
        const redirect = new URLSearchParams(window.location.search).get('redirect');
        setTimeout(() => {
            window.location.href = redirect || (dbUser.role === 'admin' ? '/admin' : dbUser.role === 'delivery' ? '/delivery-partner' : '/');
        }, 1500);
    };

    const handleGoogleLogin = useCallback(async () => {
        if (loading || !firebaseReady) return;
        const fb = (window as any).firebase;
        setLoading(true);
        try {
            const provider = new fb.auth.GoogleAuthProvider();
            const result = await fb.auth().signInWithPopup(provider);
            const dbUser = await syncUserWithBackend(result.user);
            localStorage.setItem('savourlyUser', JSON.stringify(dbUser));
            doRedirect(dbUser);
        } catch (error: any) {
            if (error.code === 'auth/popup-closed-by-user') {
                // User closed popup — silently handle
            } else if (error.code === 'auth/network-request-failed') {
                showToast('Network error. Please check your connection and try again.', 'error');
            } else {
                showToast('Sign-in failed. Please try again.', 'error');
            }
            setLoading(false);
        }
    }, [loading, firebaseReady]);

    const handleEmailLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firebaseReady) return;
        const fb = (window as any).firebase;
        const email = (document.getElementById('email') as HTMLInputElement)?.value.trim();
        const password = (document.getElementById('password') as HTMLInputElement)?.value;
        if (!email || !password) {
            showToast('Please enter both email and password.', 'error');
            return;
        }
        setLoading(true);
        try {
            const result = await fb.auth().signInWithEmailAndPassword(email, password);
            const user = result.user;

            // Force refresh to get latest emailVerified status
            await user.reload();

            // Sync with backend first to get role
            const dbUser = await syncUserWithBackend(user);

            // Email verification check — skip for admin/delivery accounts
            const isAdminOrDelivery = dbUser.role === 'admin' || dbUser.role === 'delivery';
            if (!user.emailVerified && !isAdminOrDelivery) {
                showToast('Please verify your email before logging in. Check your inbox for the verification link.', 'error');
                try {
                    await user.sendEmailVerification({
                        url: window.location.origin + '/profile',
                        handleCodeInApp: false
                    });
                    showToast('Verification email sent! Please check your inbox and verify your email.', 'info');
                } catch {
                    // Already sent recently
                }
                await fb.auth().signOut();
                setLoading(false);
                return;
            }

            localStorage.setItem('savourlyUser', JSON.stringify(dbUser));
            doRedirect(dbUser);
        } catch (error: any) {
            // Clean error messages — no raw Firebase errors
            const errorMap: Record<string, string> = {
                'auth/wrong-password': 'Incorrect password. Please try again.',
                'auth/user-not-found': 'No account found with this email.',
                'auth/invalid-email': 'Please enter a valid email address.',
                'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
                'auth/user-disabled': 'This account has been disabled.',
                'auth/invalid-credential': 'Invalid email or password. Please try again.',
                'auth/network-request-failed': 'Network error. Please check your connection.',
            };
            showToast(errorMap[error.code] || 'Sign-in failed. Please try again.', 'error');
            setLoading(false);
        }
    }, [firebaseReady]);

    return (
        <>
            <Script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js" strategy="beforeInteractive" />
            <Script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js" strategy="beforeInteractive" />

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9999, maxWidth: 420, width: '90%',
                    padding: '14px 20px', borderRadius: 12,
                    background: toast.type === 'success' ? '#ECFDF5' : toast.type === 'info' ? '#EFF6FF' : '#FEF2F2',
                    color: toast.type === 'success' ? '#047857' : toast.type === 'info' ? '#1D4ED8' : '#B91C1C',
                    border: `1px solid ${toast.type === 'success' ? '#A7F3D0' : toast.type === 'info' ? '#BFDBFE' : '#FECACA'}`,
                    fontSize: 14, fontWeight: 500, lineHeight: 1.5,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    animation: 'slideDown 0.3s ease'
                }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>
                        {toast.type === 'success' ? '✓' : toast.type === 'info' ? 'ℹ' : '!'}
                    </span>
                    <span>{toast.message}</span>
                    <button onClick={() => setToast(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.6, flexShrink: 0 }}>×</button>
                </div>
            )}
            <style>{`@keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>

            <div className="login-container">
                <div className="login-card">
                    <div className="logo">
                        <a href="/"><img src="/assets/images/savourly-logo-new.png" alt="Savourly" /></a>
                    </div>

                    <div id="loginForm">
                        <div className="login-header">
                            <h1>Welcome</h1>
                            <p>Sign in to continue to Savourly</p>
                        </div>

                        <form id="loginFormNative" onSubmit={handleEmailLogin}>
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input type="email" id="email" placeholder="Enter your email" required autoComplete="email" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input type="password" id="password" placeholder="Enter your password" required autoComplete="current-password" />
                            </div>
                            <div className="remember-row">
                                <label className="remember-check">
                                    <input type="checkbox" id="remember" />
                                    <span>Remember me</span>
                                </label>
                                <a href="#" className="forgot-link" onClick={async (e) => {
                                    e.preventDefault();
                                    const email = (document.getElementById('email') as HTMLInputElement)?.value.trim();
                                    if (!email) { showToast('Please enter your email address first.', 'error'); return; }
                                    try {
                                        const fb = (window as any).firebase;
                                        await fb.auth().sendPasswordResetEmail(email);
                                        showToast('Password reset email sent! Check your inbox.', 'success');
                                    } catch { showToast('Failed to send reset email. Check your email address.', 'error'); }
                                }}>Forgot password?</a>
                            </div>
                            <button type="submit" className="login-btn" disabled={loading || !firebaseReady}>
                                {loading ? 'Signing in...' : !firebaseReady ? 'Loading...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="divider"><span>or continue with</span></div>

                        <div className="social-btns">
                            <button className="social-btn" onClick={handleGoogleLogin} disabled={loading || !firebaseReady}
                                style={{ opacity: (!firebaseReady || loading) ? 0.6 : 1, cursor: (!firebaseReady || loading) ? 'not-allowed' : 'pointer' }}>
                                <svg viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {loading ? 'Signing in...' : !firebaseReady ? 'Loading...' : 'Google'}
                            </button>
                        </div>

                        <p className="signup-link">
                            Don&apos;t have an account? <a href="/signin">Sign up</a>
                        </p>
                    </div>

                    <div className="success-msg" id="successMsg">
                        <div className="success-icon" style={{ fontSize: 32 }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00C9A7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        </div>
                        <h2>Signed In Successfully</h2>
                        <p>Redirecting...</p>
                    </div>
                </div>
                <div className="back-home"><a href="/">← Back to Home</a></div>
            </div>
        </>
    );
}
