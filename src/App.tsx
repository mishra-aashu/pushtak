import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import SeatDemo from './components/SeatDemo';
import CommandPaletteDemo from './components/CommandPaletteDemo';
import Pricing from './components/Pricing';
import Portal from './components/Portal';
import Footer from './components/Footer';
import { X, LogIn, ExternalLink, ShieldCheck } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'home' | 'portal'>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('pustak-theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pustak-theme', theme);
  }, [theme]);

  
  // Registration / license key info
  const [licenseKey, setLicenseKey] = useState('');
  const [libraryName, setLibraryName] = useState('');

  // Login form credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      alert('Please fill out all credentials.');
      return;
    }

    // Allow default login as admin/admin OR the newly generated key
    const isDefaultAdmin = username.toLowerCase() === 'admin' && password.toLowerCase() === 'admin';
    const isGeneratedLicense = username.toLowerCase() === 'admin' && licenseKey && password === licenseKey;

    if (isDefaultAdmin || isGeneratedLicense) {
      if (isDefaultAdmin && !libraryName) {
        setLibraryName('Apex Reading Hall (Demo)');
        setLicenseKey('POS-LIFETIME-DEMO-99FF');
      }
      setIsLoggedIn(true);
      setShowLoginModal(false);
      setView('portal');
      setUsername('');
      setPassword('');
    } else {
      alert('Invalid login credentials. Hint: Use username "admin" and password "admin", or buy a lifetime license to generate a custom key!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setView('home');
  };

  const handleSuccessPurchase = (generatedKey: string) => {
    setLicenseKey(generatedKey);
    setLibraryName('My Study Hall');
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
        isLoggedIn={isLoggedIn}
        onLoginClick={() => setShowLoginModal(true)}
        onLogoutClick={handleLogout}
        theme={theme}
        toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
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
          <Pricing onSuccessPurchase={handleSuccessPurchase} />
        </main>
      ) : (
        <Portal 
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
              <p>Sign in to register machine HWIDs and download license.json</p>
            </div>

            <form className="checkout-form" onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>Admin Username</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Password (Activation / License Key)</label>
                <input 
                  type="password" 
                  required 
                  className="form-input" 
                  placeholder="admin or your license key"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {licenseKey && (
                <div style={{ fontSize: '0.8rem', background: 'rgba(16,185,129,0.05)', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399' }}>
                  <ShieldCheck size={14} />
                  <span>Detected License Key: <strong>{licenseKey}</strong></span>
                </div>
              )}

              <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)', marginTop: '0.25rem' }}>
                💡 <strong>Hint:</strong> Use username <code style={{ padding: '2px 4px' }}>admin</code> and password <code style={{ padding: '2px 4px' }}>admin</code> to log in as a demo user.
              </div>

              <button type="submit" className="btn btn-primary mt-2 w-full">
                Authenticate Admin
              </button>
            </form>
          </div>
        </div>
      )}


    </>
  );
}
