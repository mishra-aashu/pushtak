import { Github, Globe } from 'lucide-react';

interface FooterProps {
  setView: (view: 'home' | 'portal') => void;
}

export default function Footer({ setView }: FooterProps) {
  const handleNavClick = (id: string) => {
    setView('home');
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <footer className="footer text-left">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand">
            <a href="#" className="footer-brand-title" onClick={(e) => { e.preventDefault(); setView('home'); window.scrollTo({top:0, behavior:'smooth'}); }}>
              <img src="/pustak_os_logo.svg" alt="Pustak OS Logo" style={{ width: '30px', height: '30px' }} />
              <span>Pustak <span style={{ color: '#8b5cf6' }}>OS</span></span>
            </a>
            <p className="footer-desc">
              Pustak OS is a local-first study desk mapping, subscription fee renewals, and book circulation suite compiled natively via Rust & Tauri.
            </p>
          </div>

          {/* Links Column 1 */}
          <div className="footer-col">
            <h4>Product</h4>
            <ul className="footer-links">
              <li><a href="#features" onClick={(e) => { e.preventDefault(); handleNavClick('features'); }} className="footer-link">Features</a></li>
              <li><a href="#seat-demo" onClick={(e) => { e.preventDefault(); handleNavClick('seat-demo'); }} className="footer-link">Seat Simulator</a></li>
              <li><a href="#cmd-demo" onClick={(e) => { e.preventDefault(); handleNavClick('cmd-demo'); }} className="footer-link">Command Palette</a></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="footer-col">
            <h4>Licensing</h4>
            <ul className="footer-links">
              <li><a href="#pricing" onClick={(e) => { e.preventDefault(); handleNavClick('pricing'); }} className="footer-link">Pricing Plans</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setView('portal'); }} className="footer-link">License Key Generator</a></li>
              <li><a href="https://github.com/mishra-aashu/pushtak" target="_blank" rel="noopener noreferrer" className="footer-link">Desktop Releases</a></li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div className="footer-col">
            <h4>Developers</h4>
            <ul className="footer-links">
              <li><a href="https://github.com/mishra-aashu" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub Profile</a></li>
              <li><a href="https://github.com/mishra-aashu/pushtak" target="_blank" rel="noopener noreferrer" className="footer-link">Repository Source</a></li>
              <li><a href="https://github.com/mishra-aashu/pushtak/issues" target="_blank" rel="noopener noreferrer" className="footer-link">Report Issues</a></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} Pustak OS. All rights reserved. Developed by <a href="https://github.com/mishra-aashu" target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', fontWeight: 600 }}>Mishra Aashu</a>.
          </div>
          <div className="footer-socials">
            <a href="https://github.com/mishra-aashu/pushtak" target="_blank" rel="noopener noreferrer" className="social-icon-btn">
              <Github size={20} />
            </a>
            <a href="#" className="social-icon-btn">
              <Globe size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
