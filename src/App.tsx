import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import SeatDemo from './components/SeatDemo';
import CommandPaletteDemo from './components/CommandPaletteDemo';
import Pricing from './components/Pricing';
import Portal from './components/Portal';
import Footer from './components/Footer';
import { X, LogIn, Eye, EyeOff, Lock, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function App() {
  const [view, setView] = useState<'home' | 'portal'>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Email Auth States
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');

  // Password Setup States (for Google users)
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [setupDismissed, setSetupDismissed] = useState(false);
  const [setupSuccessMessage, setSetupSuccessMessage] = useState('');

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('pustak-theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (user) {
      const isGoogleUser = user.app_metadata?.provider === 'google' || user.identities?.some((id: any) => id.provider === 'google');
      const hasPassword = user.user_metadata?.has_password === true;
      if (isGoogleUser && !hasPassword && !setupDismissed) {
        setShowPasswordSetup(true);
      } else {
        setShowPasswordSetup(false);
      }
    } else {
      setShowPasswordSetup(false);
    }
  }, [user, setupDismissed]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pustak-theme', theme);
  }, [theme]);

  // Supabase Auth listener
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) {
        setIsLoggedIn(true);
        // Only redirect to portal if not in middle of a checkout flow
        if (!localStorage.getItem('pustak_checkout_plan')) {
          setView('portal');
        }
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) {
        setIsLoggedIn(true);
        // Only redirect to portal if not in middle of a checkout flow
        if (!localStorage.getItem('pustak_checkout_plan')) {
          setView('portal');
        }
      } else if (!activeUser && isLoggedIn && event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setView('home');
      }
    });

    return () => subscription.unsubscribe();
  }, [isLoggedIn]);

  useEffect(() => {
    // Session state check to ensure proper state usage
    const sessionActive = isLoggedIn;
    if (sessionActive) {
      console.debug('Admin session activated.');
    }
  }, [isLoggedIn]);

  
  // Registration / license key info
  const [licenseKey, setLicenseKey] = useState('');
  const [libraryName, setLibraryName] = useState('');

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google login failed:', err);
      alert('Failed to connect to Google Auth: ' + err.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      setAuthError('Please enter both email and password.');
      return;
    }
    setIsSigningIn(true);
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordInput.trim(),
      });
      if (error) throw error;
      
      setEmailInput('');
      setPasswordInput('');
      setShowLoginModal(false);
    } catch (err: any) {
      console.error('Email login failed:', err);
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPassword.length < 6) {
      setSetupError('Password must be at least 6 characters.');
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      setSetupError('Passwords do not match.');
      return;
    }
    setIsSettingPassword(true);
    setSetupError('');
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: setupPassword,
        data: { has_password: true }
      });
      if (error) throw error;
      
      if (data.user) {
        setUser(data.user);
      }
      setSetupSuccessMessage('Password configured successfully! You can now log in using your email and password.');
      setTimeout(() => {
        setShowPasswordSetup(false);
        setSetupSuccessMessage('');
        setSetupPassword('');
        setSetupConfirmPassword('');
      }, 3000);
    } catch (err: any) {
      console.error('Password setup failed:', err);
      setSetupError(err.message || 'Failed to update password.');
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    setIsLoggedIn(false);
    setUser(null);
    setSetupDismissed(false);
    setView('home');
  };

  const handleSuccessPurchase = (generatedKey: string, library: string) => {
    setLicenseKey(generatedKey);
    setLibraryName(library || 'My Study Hall');
    setView('portal');
  };

  return (
    <>
      {/* Background decorations */}
      <div className="bg-grid-overlay"></div>
      <div className="bg-glow-orb-1"></div>
      <div className="bg-glow-orb-2"></div>

      {/* Main Navigation */}
      <Navbar 
        currentView={view} 
        setView={setView} 
        theme={theme}
        toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        user={user}
        onLogout={handleLogout}
        onLoginClick={() => setShowLoginModal(true)}
      />

      {/* Dynamic View Swapper */}
      {view === 'home' ? (
        <main style={{ flexGrow: 1 }}>
          <Hero 
            onBuyClick={() => {
              document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onDownloadClick={() => {
              document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          <Features />
          <SeatDemo />
          <CommandPaletteDemo />
          <Pricing user={user} onSuccessPurchase={handleSuccessPurchase} />
        </main>
      ) : (
        <Portal 
          user={user}
          licenseKey={licenseKey} 
          libraryName={libraryName} 
          onLogout={handleLogout} 
        />
      )}

      {/* Global Footer */}
      <Footer setView={setView} />

      {/* ADMIN LOGIN MODAL */}
      {showLoginModal && (
        <div className="checkout-modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="checkout-box" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowLoginModal(false)}>
              <X size={20} />
            </button>

            <div className="checkout-header">
              <div className="success-icon-ring" style={{ width: '56px', height: '56px', borderColor: 'var(--primary)', background: 'var(--accent-light)', color: 'var(--primary)', marginBottom: '1rem' }}>
                <LogIn size={22} />
              </div>
              <h3>Admin Activation Portal</h3>
              <p>Sign in to view and manage your registered license keys.</p>
            </div>

            {authError && (
              <div className="alert alert-danger" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                  <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                  <span>{authError}</span>
                </div>
                {(authError.toLowerCase().includes('invalid') || authError.toLowerCase().includes('not found')) && (
                  <div style={{ fontSize: '0.8rem', color: '#ef4444', opacity: 0.85, paddingLeft: '1.4rem' }}>
                     New user? Use Google below to register.
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-dark)' }}>Email Address</label>
                <div className="input-with-icon-wrapper">
                  <span className="input-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="name@library.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-dark)' }}>Password</label>
                <div className="input-with-icon-wrapper">
                  <span className="input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-input"
                    placeholder="Enter password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isSigningIn} className="btn btn-primary w-full" style={{ padding: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {isSigningIn ? 'Processing...' : 'Sign In with Email'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <div style={{ flexGrow: 1, height: '1px', background: 'var(--border-color)' }}></div>
              <span style={{ padding: '0 0.75rem', fontWeight: 500, letterSpacing: '0.05em' }}>OR</span>
              <div style={{ flexGrow: 1, height: '1px', background: 'var(--border-color)' }}></div>
            </div>

            <div style={{ padding: '0 0.5rem', marginBottom: '0.5rem' }}>
              <button 
                type="button" 
                className="btn w-full" 
                onClick={handleGoogleLogin}
                style={{ 
                  background: '#ffffff', 
                  color: '#1e293b', 
                  border: '1px solid #e2e8f0', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.75rem', 
                  fontWeight: 600,
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--border-radius-sm)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, border-color 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-3.41-4.53-6.19-4.53z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
            
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem', lineHeight: '1.4' }}>
              💡 Google accounts automatic validation bypasses the email check.
            </p>
          </div>
        </div>
      )}

      {/* PASSWORD SETUP MODAL FOR GOOGLE USERS */}
      {showPasswordSetup && (
        <div className="checkout-modal-overlay">
          <div className="checkout-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="checkout-header">
              <div className="success-icon-ring" style={{ width: '56px', height: '56px', borderColor: 'var(--primary)', background: 'var(--accent-light)', color: 'var(--primary)', marginBottom: '1rem' }}>
                <Lock size={22} />
              </div>
              <h3>Secure Your Account</h3>
              <p>Configure a password so you can also log in directly using your email (<strong>{user?.email}</strong>) next time.</p>
            </div>

            {setupSuccessMessage ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginBottom: '1rem' }}>
                  <CheckCircle2 size={24} />
                </div>
                <p style={{ fontSize: '0.95rem', color: '#10b981', fontWeight: 600 }}>{setupSuccessMessage}</p>
              </div>
            ) : (
              <>
                {setupError && (
                  <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.85rem' }}>
                    <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                    <span>{setupError}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSetup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-dark)' }}>Create Password</label>
                    <div className="input-with-icon-wrapper">
                      <span className="input-icon">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showSetupPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        className="form-input"
                        placeholder="Choose at least 6 characters"
                        value={setupPassword}
                        onChange={(e) => setSetupPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowSetupPassword(!showSetupPassword)}
                        tabIndex={-1}
                      >
                        {showSetupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-dark)' }}>Confirm Password</label>
                    <div className="input-with-icon-wrapper">
                      <span className="input-icon">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showSetupPassword ? 'text' : 'password'}
                        required
                        className="form-input"
                        placeholder="Re-enter your password"
                        value={setupConfirmPassword}
                        onChange={(e) => setSetupConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={isSettingPassword} className="btn btn-primary w-full" style={{ padding: '0.8rem', fontWeight: 600 }}>
                    {isSettingPassword ? 'Setting password...' : 'Save Password & Continue'}
                  </button>
                </form>

                <div style={{ textAlign: 'center' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary w-full"
                    onClick={() => {
                      setSetupDismissed(true);
                      setShowPasswordSetup(false);
                    }}
                    style={{ padding: '0.75rem', fontWeight: 500 }}
                  >
                    Setup Password Later
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}


    </>
  );
}
