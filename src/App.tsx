import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import SeatDemo from './components/SeatDemo';
import CommandPaletteDemo from './components/CommandPaletteDemo';
import Pricing from './components/Pricing';
import Portal from './components/Portal';
import Footer from './components/Footer';
import { X, LogIn, Chrome } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function App() {
  const [view, setView] = useState<'home' | 'portal'>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('pustak-theme');
    return (saved as 'light' | 'dark') || 'light';
  });

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    setIsLoggedIn(false);
    setUser(null);
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
              <p>Sign in with Google to view and manage your license keys.</p>
            </div>

            <div style={{ padding: '0 0.5rem', marginBottom: '1rem' }}>
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
          </div>
        </div>
      )}


    </>
  );
}
