import { useState } from 'react';
import { Menu, X, Github, ExternalLink, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  currentView: 'home' | 'portal';
  setView: (view: 'home' | 'portal') => void;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function Navbar({ currentView, setView, isLoggedIn, onLoginClick, onLogoutClick, theme, toggleTheme }: NavbarProps) {
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
        <div className="nav-actions">
          <button 
            className="btn btn-secondary" 
            onClick={toggleTheme} 
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            style={{ padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
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
