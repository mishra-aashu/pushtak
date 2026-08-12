import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Book, Users, CreditCard, Armchair, Settings, HelpCircle, CornerDownLeft } from 'lucide-react';

interface CommandItem {
  title: string;
  category: string;
  shortcut: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function CommandPaletteDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const commandItems: CommandItem[] = [
    { title: 'Add New Student Admission', category: 'Members', shortcut: 'F2', icon: <Users size={16} />, action: () => alert('Mock Action: Open "Add Member" Drawer') },
    { title: 'Collect Member Shift Fee Renewal', category: 'Subscriptions', shortcut: 'F3', icon: <CreditCard size={16} />, action: () => alert('Mock Action: Open "Fee Payment" Dialogue') },
    { title: 'Register New Book in Inventory', category: 'Catalogue', shortcut: 'F4', icon: <Book size={16} />, action: () => alert('Mock Action: Open "Add Book" Form') },
    { title: 'Issue/Return Circulation Panel', category: 'Loans', shortcut: 'F5', icon: <Book size={16} />, action: () => alert('Mock Action: Redirect to Book Circulation Screen') },
    { title: 'Open Reading Hall Seat Matrix', category: 'Study Desk', shortcut: 'Alt + 2', icon: <Armchair size={16} />, action: () => { document.getElementById('seat-demo')?.scrollIntoView({ behavior: 'smooth' }); setIsOpen(false); } },
    { title: 'System Security & Settings', category: 'Preferences', shortcut: 'Alt + 7', icon: <Settings size={16} />, action: () => alert('Mock Action: Open Hardware License Configuration') },
    { title: 'Keyboard Shortcuts Cheat Sheet', category: 'General', shortcut: '?', icon: <HelpCircle size={16} />, action: () => alert('Mock Action: Show Hotkeys Guide') },
  ];

  // Filter commands based on search text
  const filteredItems = commandItems.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Monitor Ctrl+K global press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setSearch('');
        setSelectedIndex(0);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation within the list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!filteredItems.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filteredItems[selectedIndex].action();
    }
  };

  // Scroll selected item into view inside the list
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <section id="cmd-demo" className="features-section" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-dark-accent)' }}>
      <div className="container">
        <div className="section-header">
          <div className="badge mb-4">Productivity Feature</div>
          <h2>No-Mouse Command Palette</h2>
          <p>
            Pustak OS is completely keyboard-driven. Search students, check books, issue loans, or switch modules instantly in under 5 milliseconds. Press the hotkey below to test the simulator.
          </p>
        </div>

        {/* Live Clickable Trigger Box */}
        <div 
          className="glass-card" 
          onClick={() => { setIsOpen(true); setSearch(''); setSelectedIndex(0); }}
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            padding: '1.75rem 2rem',
            cursor: 'pointer',
            textAlign: 'center',
            border: '1px dashed var(--primary)',
            borderRadius: 'var(--border-radius-lg)',
          }}
        >
          <div className="success-icon-ring" style={{ width: '48px', height: '48px', color: 'var(--primary)', borderColor: 'var(--border-color)', background: 'var(--accent-light)', marginBottom: '1rem' }}>
            <Command size={20} />
          </div>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Trigger Command Palette</h3>
          <p style={{ marginBottom: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Press <kbd>Ctrl + K</kbd> (or <kbd>⌘ + K</kbd>) on your keyboard, or click this block to open the live search drawer.
          </p>
          <button className="btn btn-primary" style={{ pointerEvents: 'none', padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}>
            Open Spotlight Search
          </button>
        </div>

        {/* Command Palette Modal Overlay */}
        {isOpen && (
          <div className="cmd-palette-overlay" onClick={() => setIsOpen(false)}>
            <div 
              className="cmd-palette-box" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cmd-search-wrapper">
                <Search className="cmd-search-icon" size={20} />
                <input
                  ref={inputRef}
                  type="text"
                  className="cmd-input"
                  placeholder="Type a command or query..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0); }}
                  onKeyDown={handleKeyDown}
                />
                <span className="cmd-hint-esc">ESC</span>
              </div>

              <ul ref={listRef} className="cmd-results-list">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, idx) => (
                    <li
                      key={idx}
                      className={`cmd-item ${selectedIndex === idx ? 'selected' : ''}`}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => {
                        item.action();
                      }}
                    >
                      <div className="cmd-item-left">
                        <div className="cmd-item-icon">{item.icon}</div>
                        <div>
                          <div className="cmd-item-title">{item.title}</div>
                          <div className="cmd-item-category">{item.category}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="cmd-shortcut">{item.shortcut}</span>
                        {selectedIndex === idx && <CornerDownLeft size={12} style={{ color: '#8b5cf6' }} />}
                      </div>
                    </li>
                  ))
                ) : (
                  <li style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-dark)' }}>
                    No commands matching "{search}" found.
                  </li>
                )}
              </ul>
              
              <div style={{
                background: 'var(--bg-highlight)',
                borderTop: '1px solid var(--border-color)',
                padding: '0.75rem 1.25rem',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to select</span>
                <span>Pustak OS Engine v2.0</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
