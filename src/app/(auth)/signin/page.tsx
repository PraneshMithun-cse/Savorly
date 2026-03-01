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
        return (await response.json()).data;
    } catch {
        return { id: user.uid, firebaseUid: user.uid, email: user.email, name: user.displayName || user.email?.split('@')[0], profilePic: user.photoURL || '', role: 'user' };
    }
}

function ensureFirebaseInit() {
    const fb = (window as any).firebase;
    if (fb && !fb.apps.length) fb.initializeApp(FIREBASE_CONFIG);
    return fb && fb.apps.length > 0;
}

export default function SignInPage() {
    const [loading, setLoading] = useState(false);
    const [firebaseReady, setFirebaseReady] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [verificationSent, setVerificationSent] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 6000);
    };

    useEffect(() => {
        const check = () => {
            if (typeof window !== 'undefined' && (window as any).firebase) {
                ensureFirebaseInit();
                if ((window as any).firebase.apps.length > 0) { setFirebaseReady(true); return true; }
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
        const form = document.getElementById('signinForm');
        const success = document.getElementById('successMsg');
        if (form) form.style.display = 'none';
        if (success) success.classList.add('show');
        const redirect = new URLSearchParams(window.location.search).get('redirect');
        setTimeout(() => { window.location.href = redirect || (dbUser.role === 'admin' ? '/admin' : dbUser.role === 'delivery' ? '/delivery-partner' : '/'); }, 1500);
    };

    const handleGoogleLogin = useCallback(async () => {
        if (loading || !firebaseReady) return;
        setLoading(true);
        try {
            const fb = (window as any).firebase;
            const result = await fb.auth().signInWithPopup(new fb.auth.GoogleAuthProvider());
            const dbUser = await syncUserWithBackend(result.user);
            localStorage.setItem('savourlyUser', JSON.stringify(dbUser));
            doRedirect(dbUser);
        } catch (error: any) {
            if (error.code === 'auth/popup-closed-by-user') {
                // Silently handle
            } else if (error.code === 'auth/network-request-failed') {
                showToast('Network error. Please check your connection.', 'error');
            } else {
                showToast('Sign-in failed. Please try again.', 'error');
            }
            setLoading(false);
        }
    }, [loading, firebaseReady]);

    const handleEmailSignUp = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firebaseReady) return;
        const email = (document.getElementById('email') as HTMLInputElement)?.value.trim();
        const password = (document.getElementById('password') as HTMLInputElement)?.value;
        if (!email || !password) {
            showToast('Please fill in all fields.', 'error');
            return;
        }

        // Password policy
        if (password.length < 8) {
            showToast('Password must be at least 8 characters long.', 'error');
            return;
        }
        if (!/[A-Z]/.test(password)) {
            showToast('Password must contain at least one uppercase letter.', 'error');
            return;
        }
        if (!/[0-9]/.test(password)) {
            showToast('Password must contain at least one number.', 'error');
            return;
        }

        setLoading(true);
        try {
            const fb = (window as any).firebase;
            const result = await fb.auth().createUserWithEmailAndPassword(email, password);
            const user = result.user;

            // Send verification email
            await user.sendEmailVerification({
                url: window.location.origin + '/login',
                handleCodeInApp: false
            });

            // Sync with backend
            await syncUserWithBackend(user);

            // Sign out — user must verify email first
            await fb.auth().signOut();

            setVerificationSent(true);
            setLoading(false);
        } catch (error: any) {
            const errorMap: Record<string, string> = {
                'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
                'auth/invalid-email': 'Please enter a valid email address.',
                'auth/weak-password': 'Password is too weak. Use at least 8 characters with uppercase and numbers.',
                'auth/network-request-failed': 'Network error. Please check your connection.',
                'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
            };
            showToast(errorMap[error.code] || 'Sign-up failed. Please try again.', 'error');
            setLoading(false);
        }
    }, [firebaseReady]);

    return (
        <>
            <Script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js" strategy="beforeInteractive" />
            <Script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js" strategy="beforeInteractive" />

            {/* Toast */}
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

                    {verificationSent ? (
                        /* Verification Email Sent Screen */
                        <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                            </div>
                            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Verify Your Email</h2>
                            <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                                We&apos;ve sent a verification link to your email address.
                                Please check your inbox and click the link to activate your account.
                            </p>
                            <a href="/login" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 12, background: '#00C9A7', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                                Go to Sign In
                            </a>
                            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 16 }}>
                                Didn&apos;t receive the email? Check your spam folder.
                            </p>
                        </div>
                    ) : (
                        <div id="signinForm">
                            <div className="login-header">
                                <h1>Create Account</h1>
                                <p>Sign up to get started with Savourly</p>
                            </div>
                            <form onSubmit={handleEmailSignUp}>
                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input type="email" id="email" placeholder="Enter your email" required autoComplete="email" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <input type="password" id="password" placeholder="Min 8 chars, 1 uppercase, 1 number" required minLength={8} autoComplete="new-password" />
                                </div>
                                <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.5 }}>
                                    Password must be at least 8 characters with 1 uppercase letter and 1 number.
                                </p>
                                <button type="submit" className="login-btn" disabled={loading || !firebaseReady}>
                                    {loading ? 'Creating account...' : !firebaseReady ? 'Loading...' : 'Sign Up'}
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
                            <p className="signup-link">Already have an account? <a href="/login">Sign in</a></p>
                        </div>
                    )}

                    <div className="success-msg" id="successMsg">
                        <div className="success-icon" style={{ fontSize: 32 }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00C9A7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        </div>
                        <h2>Welcome to Savourly!</h2>
                        <p>Redirecting...</p>
                    </div>
                </div>
                <div className="back-home"><a href="/">← Back to Home</a></div>
            </div>
        </>
    );
}
