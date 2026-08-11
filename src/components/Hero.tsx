import { Download, ArrowRight } from 'lucide-react';

interface HeroProps {
  onBuyClick: () => void;
  onDownloadClick: () => void;
}

export default function Hero({ onBuyClick, onDownloadClick }: HeroProps) {
  return (
    <section className="hero">
      <div className="container">
        {/* High-Converting Heading */}
        <h1>
          The High-Performance <br />
          <span className="gradient-text">Study Hall & Library OS</span>
        </h1>

        {/* Persuasive Subtext */}
        <p>
          Pustak OS is an ultra-fast, local-first administrative suite designed to manage seat grids, membership shifts, fees, and books. Zero server delays, zero internet dependency—sqlite performance built inside a sleek Tauri container.
        </p>

        {/* Call to Actions */}
        <div className="hero-cta">
          <button className="btn btn-primary" onClick={onDownloadClick}>
            <Download size={18} /> Download Desktop App
          </button>
          <button className="btn btn-accent" onClick={onBuyClick}>
            Buy Lifetime License <ArrowRight size={16} />
          </button>
        </div>

        {/* Feature Statistics */}
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-val">0ms</span>
            <span className="stat-lbl">Network Latency</span>
          </div>
          <div className="stat-item">
            <span className="stat-val">100%</span>
            <span className="stat-lbl">Offline Functionality</span>
          </div>
          <div className="stat-item">
            <span className="stat-val">&lt; 1ms</span>
            <span className="stat-lbl">SQLite Query Speed</span>
          </div>
          <div className="stat-item">
            <span className="stat-val">Multi-Shift</span>
            <span className="stat-lbl">Seat Mapping</span>
          </div>
        </div>
      </div>
    </section>
  );
}
