import { Database, Zap, BookOpen, Keyboard, ShieldCheck, CreditCard } from 'lucide-react';

export default function Features() {
  const list = [
    {
      icon: <Database size={24} />,
      title: 'SQLite Offline Engine',
      desc: 'Powered by SQLite via Rust. The database is stored completely locally on your hardware, ensuring zero delay, zero cloud costs, and robust offline stability.'
    },
    {
      icon: <Zap size={24} />,
      title: 'Sub-Millisecond Query Speed',
      desc: 'Built in Rust using Tauri v2. Queries execute locally in less than 1 millisecond. No network calls, loading spinners, or offline sync issues.'
    },
    {
      icon: <Keyboard size={24} />,
      title: '100% Keyboard-Driven',
      desc: 'Includes global search, custom hotkeys (F2-F5, Alt+1-7), and rapid form traversal. Input registrations and library circulation without ever touching your mouse.'
    },
    {
      icon: <BookOpen size={24} />,
      title: 'ISBN Book Cataloguer',
      desc: 'Quickly catalog books by scanning or inputting ISBN numbers. Automatically manages stock allocations, loans issued, and return operations.'
    },
    {
      icon: <CreditCard size={24} />,
      title: 'Fee Ledger & Subscriptions',
      desc: 'Track student admission records, valid-from and valid-to membership dates, payment modes (UPI, Cash), invoices, and automatic overdue fine tallies.'
    },
    {
      icon: <ShieldCheck size={24} />,
      title: 'HWID Hardened Licensing',
      desc: 'Secure local verification. The software bounds to the machine Hardware ID (HWID) of the library server, ensuring robust licensing compliance and data security.'
    }
  ];

  return (
    <section id="features" className="features-section">
      <div className="container">
        <div className="section-header">
          <div className="badge mb-4">Core Architecture</div>
          <h2>Designed for High Performance</h2>
          <p>
            Pustak OS departs from slow web panels. It is compiled natively for your operating system, delivering desktop-level speed and security.
          </p>
        </div>

        <div className="features-grid">
          {list.map((item, idx) => (
            <div key={idx} className="glass-card text-left">
              <div className="feature-icon-wrapper">
                {item.icon}
              </div>
              <h3 className="feature-title">{item.title}</h3>
              <p style={{ fontSize: '0.92rem', lineHeight: '1.6' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
