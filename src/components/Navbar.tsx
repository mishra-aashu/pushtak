import { useState } from 'react';
import { Menu, X, Github, ExternalLink, Sun, Moon, LogIn, LogOut } from 'lucide-react';

interface NavbarProps {
  currentView: 'home' | 'portal';
  setView: (view: 'home' | 'portal') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  user: any;
  onLogout: () => void;
  onLoginClick: () => void;
}

export default function Navbar({ currentView, setView, theme, toggleTheme, user, onLogout, onLoginClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setView('home');
    setMobileMenuOpen(false);
    
    // Allow state transition to complete before scrolling
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); setView('home'); window.scrollTo({top:0, behavior:'smooth'}); }}>
          <img src="/pustak_os_logo.svg" alt="Pustak OS Logo" className="logo-img" />
          <span>Pustak <span className="gradient-text">OS</span></span>
        </a>

        {/* Desktop Menu */}
        <ul className="nav-links">
          {currentView === 'home' ? (
            <>
              <li><a href="#features" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavClick('features'); }}>Features</a></li>
              <li><a href="#seat-demo" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavClick('seat-demo'); }}>Live Seat Grid</a></li>
              <li><a href="#cmd-demo" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavClick('cmd-demo'); }}>Spotlight Demo</a></li>
              <li><a href="#pricing" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavClick('pricing'); }}>Pricing</a></li>
              {user && (
                <li>
                  <a 
                    href="#" 
                    className="nav-link" 
                    style={{ color: 'var(--primary)', fontWeight: 600 }}
                    onClick={(e) => { e.preventDefault(); setView('portal'); }}
                  >
                    Dashboard
                  </a>
                </li>
              )}
            </>
          ) : (
            <li>
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); setView('home'); }}>
                &larr; Back to Main Website
              </a>
            </li>
          )}
          <li>
            <a 
              href="https://github.com/mishra-aashu/pushtak" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="nav-link flex align-center gap-2"
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              <Github size={16} /> GitHub <ExternalLink size={12} style={{ opacity: 0.6 }} />
            </a>
          </li>
        </ul>

        {/* Desktop Actions */}
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={toggleTheme} 
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            style={{ padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--accent-light)', border: '1px solid var(--border-color)', padding: '0.35rem 0.75rem 0.35rem 0.35rem', borderRadius: '50px' }}>
              {user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="User Avatar" 
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--primary)' }} 
                />
              ) : (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {user.email?.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}
              </span>
              <button 
                onClick={onLogout} 
                title="Sign Out" 
                style={{ background: 'none', border: 'none', color: 'var(--text-dark)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-dark)')}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-secondary" 
              onClick={onLoginClick}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.15rem', fontSize: '0.85rem' }}
            >
              <LogIn size={14} />
              <span>Portal Sign In</span>
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="glass-card" style={{
          position: 'absolute',
          top: '80px',
          left: '1.5rem',
          right: '1.5rem',
          zIndex: 99,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          padding: '2rem',
          boxShadow: '0 15px 30px rgba(0,0,0,0.5)'
        }}>
          {currentView === 'home' ? (
            <>
              <a href="#features" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavClick('features'); }}>Features</a>
              <a href="#seat-demo" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavClick('seat-demo'); }}>Live Seat Grid</a>
              <a href="#cmd-demo" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavClick('cmd-demo'); }}>Spotlight Demo</a>
              <a href="#pricing" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavClick('pricing'); }}>Pricing</a>
              {user && (
                <a href="#" className="nav-link" style={{ color: 'var(--primary)', fontWeight: 600 }} onClick={(e) => { e.preventDefault(); setView('portal'); setMobileMenuOpen(false); }}>
                  Dashboard
                </a>
              )}
            </>
          ) : (
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); setView('home'); setMobileMenuOpen(false); }}>
              Back to Main Website
            </a>
          )}
          <a 
            href="https://github.com/mishra-aashu/pushtak" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="nav-link flex align-center gap-2"
          >
            <Github size={16} /> GitHub
          </a>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="User Avatar" 
                      style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--primary)' }} 
                    />
                  ) : (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      {user.email?.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
                      {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>
                      {user.email}
                    </span>
                  </div>
                </div>
                <button 
                  className="btn w-full" 
                  onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#ef4444', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--border-radius-sm)', padding: '0.65rem' }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-secondary w-full" 
                onClick={() => { onLoginClick(); setMobileMenuOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <LogIn size={16} /> Portal Sign In
              </button>
            )}
            
            <button 
              className="btn btn-secondary w-full" 
              onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {theme === 'light' ? <><Moon size={16} /> Dark Mode</> : <><Sun size={16} /> Light Mode</>}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
