import { useState } from 'react';
import { Armchair, CheckCircle2, Copy, Download, FileText, Info, Key, LayoutDashboard, LogOut, Monitor } from 'lucide-react';

interface PortalProps {
  licenseKey: string;
  libraryName: string;
  onLogout: () => void;
}

interface Machine {
  hwid: string;
  activatedAt: string;
  status: 'active';
  os: 'linux' | 'windows' | 'macos';
}

export default function Portal({ licenseKey, libraryName, onLogout }: PortalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'hwid' | 'downloads' | 'docs'>('overview');
  const [hwidInput, setHwidInput] = useState('');
  const [activatedMachines, setActivatedMachines] = useState<Machine[]>([
    { hwid: 'A4F8-12D9-C10B-3DE2', activatedAt: '2026-08-10', status: 'active', os: 'linux' }
  ]);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [generatedActivationCode, setGeneratedActivationCode] = useState('');

  const currentLicense = licenseKey || 'POS-LIFETIME-TRIAL-KEY-1234';
  const currentLibrary = libraryName || 'Apex Reading Rooms & Library';

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleActivateHwid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwidInput.trim()) {
      alert('Please enter a valid Hardware ID.');
      return;
    }

    // Add machine
    const osType = hwidInput.toLowerCase().includes('win') ? 'windows' : 
                   hwidInput.toLowerCase().includes('mac') ? 'macos' : 'linux';
    
    const newMachine: Machine = {
      hwid: hwidInput.toUpperCase(),
      activatedAt: new Date().toISOString().split('T')[0],
      status: 'active',
      os: osType as any
    };

    setActivatedMachines([...activatedMachines, newMachine]);

    // Generate activation code
    const token = btoa(JSON.stringify({
      license: currentLicense,
      library: currentLibrary,
      hwid: hwidInput.toUpperCase(),
      timestamp: Date.now()
    })).substring(0, 32).toUpperCase();

    setGeneratedActivationCode(token);
    setHwidInput('');
  };

  // Trigger client-side download of license.json
  const handleDownloadLicenseJson = (machine: Machine) => {
    const licenseData = {
      licenseKey: currentLicense,
      libraryName: currentLibrary,
      machineId: machine.hwid,
      activationCode: generatedActivationCode || 'ACT-DEFAULT-KEY-SIGNATURE-A3BF',
      activatedDate: machine.activatedAt,
      version: '2.0.0',
      developer: 'Mishra Aashu',
      repository: 'https://github.com/mishra-aashu/pushtak'
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(licenseData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `license-${machine.hwid.substring(0, 8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="portal-wrapper">
      <div className="portal-grid">
        {/* Portal Sidebar */}
        <aside className="portal-sidebar">
          <ul className="portal-menu">
            <li 
              className={`portal-menu-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <LayoutDashboard size={18} />
              <span>License Overview</span>
            </li>
            <li 
              className={`portal-menu-item ${activeTab === 'hwid' ? 'active' : ''}`}
              onClick={() => setActiveTab('hwid')}
            >
              <Key size={18} />
              <span>HWID Activator</span>
            </li>
            <li 
              className={`portal-menu-item ${activeTab === 'downloads' ? 'active' : ''}`}
              onClick={() => setActiveTab('downloads')}
            >
              <Download size={18} />
              <span>Software Downloads</span>
            </li>
            <li 
              className={`portal-menu-item ${activeTab === 'docs' ? 'active' : ''}`}
              onClick={() => setActiveTab('docs')}
            >
              <FileText size={18} />
              <span>Activation Guide</span>
            </li>
          </ul>

          <div className="portal-user-footer">
            <div className="portal-avatar">
              {currentLibrary.substring(0, 2).toUpperCase()}
            </div>
            <div className="portal-user-info" style={{ flexGrow: 1 }}>
              <span className="portal-username">{currentLibrary.substring(0, 18)}...</span>
              <span className="portal-user-email">admin@pustakos.com</span>
            </div>
            <button className="copy-cmd-btn" onClick={onLogout} title="Log Out">
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        {/* Portal Main Content */}
        <main className="portal-content text-left">
          {activeTab === 'overview' && (
            <div>
              <div className="portal-header-row">
                <div>
                  <h2>License Dashboard</h2>
                  <p>Manage machines, seats, and updates for your institution.</p>
                </div>
                <div className="badge" style={{ textTransform: 'none' }}>
                  License: {currentLicense.substring(0, 16)}...
                </div>
              </div>

              {/* Stats Panel */}
              <div className="portal-stats-row">
                <div className="portal-stat-card">
                  <div className="portal-stat-icon">
                    <Key size={20} />
                  </div>
                  <div>
                    <div className="portal-stat-num">Pro</div>
                    <div className="portal-stat-desc">Subscription Class</div>
                  </div>
                </div>
                <div className="portal-stat-card">
                  <div className="portal-stat-icon">
                    <Monitor size={20} />
                  </div>
                  <div>
                    <div className="portal-stat-num">{activatedMachines.length}</div>
                    <div className="portal-stat-desc">Activated Machines</div>
                  </div>
                </div>
                <div className="portal-stat-card">
                  <div className="portal-stat-icon">
                    <Armchair size={20} />
                  </div>
                  <div>
                    <div className="portal-stat-num">Unlimited</div>
                    <div className="portal-stat-desc">Study Hall Seats</div>
                  </div>
                </div>
              </div>

              {/* Activated Machines List */}
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.25rem' }}>Active Machine Verifications</h3>
                <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  These machines are registered to run Pustak OS locally under this license key. Use the HWID Activator to bind additional machines.
                </p>

                <table className="activated-keys-table">
                  <thead>
                    <tr>
                      <th>Machine HWID</th>
                      <th>Registered On</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activatedMachines.map((m, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#a78bfa' }}>
                          {m.hwid}
                        </td>
                        <td>{m.activatedAt}</td>
                        <td>
                          <span className="badge-status active">Active</span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-accent" 
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                            onClick={() => handleDownloadLicenseJson(m)}
                          >
                            <Download size={12} /> Download license.json
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'hwid' && (
            <div>
              <div className="portal-header-row">
                <div>
                  <h2>Hardware Activation Portal</h2>
                  <p>Register machine Hardware IDs to generate activation tokens.</p>
                </div>
              </div>

              <div className="portal-grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', minHeight: 'auto' }}>
                {/* Activation Form */}
                <div className="license-activator-card">
                  <h3 style={{ marginBottom: '1rem' }}>Register Machine Hardware ID</h3>
                  <p className="hwid-instruction">
                    Provide the Unique Hardware Identifier (HWID) of the server/computer where Pustak OS is installed. You can fetch this UUID by running the following command on that computer:
                  </p>

                  <div className="hwid-command-box">
                    <span>sudo dmidecode -s system-uuid</span>
                    <button className="copy-cmd-btn" onClick={() => copyCommand('sudo dmidecode -s system-uuid')}>
                      {copiedCmd ? 'Copied' : <Copy size={14} />}
                    </button>
                  </div>

                  <form onSubmit={handleActivateHwid} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label>Machine HWID / System UUID</label>
                      <input 
                        type="text" 
                        required
                        className="form-input" 
                        placeholder="e.g. F00A-994B-12C9-D4BF"
                        value={hwidInput}
                        onChange={(e) => setHwidInput(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Register & Activate Machine
                    </button>
                  </form>
                </div>

                {/* Right Side Token Display */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3>Activation Output</h3>
                  
                  {generatedActivationCode ? (
                    <div style={{ marginTop: '1.5rem' }}>
                      <div className="success-icon-ring" style={{ width: '48px', height: '48px', color: '#10b981', borderColor: '#10b981', background: 'rgba(16,185,129,0.05)', margin: '0 0 1rem' }}>
                        <CheckCircle2 size={24} />
                      </div>
                      <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Machine registered successfully! Click below to download your offline licensing key file. Put this `license.json` file inside the desktop app config folder or settings menu.
                      </p>

                      <div style={{ background: '#07090e', border: '1px dashed rgba(139,92,246,0.3)', borderRadius: '6px', padding: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Activation Token</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all', color: '#a78bfa' }}>
                          {generatedActivationCode}
                        </div>
                      </div>

                      <button 
                        className="btn btn-primary w-full" 
                        onClick={() => handleDownloadLicenseJson(activatedMachines[activatedMachines.length - 1])}
                      >
                        <Download size={14} /> Download license.json
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-dark)' }}>
                      <Info size={32} style={{ margin: '0 auto 1rem', display: 'block' }} />
                      <p>Enter a Hardware ID on the left to generate activation files.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'downloads' && (
            <div>
              <div className="portal-header-row">
                <div>
                  <h2>Desktop Release Packages</h2>
                  <p>Download cross-platform desktop builds of Pustak OS.</p>
                </div>
              </div>

              <div className="download-releases-list">
                {/* Linux Card */}
                <div className="download-release-card">
                  <div className="release-info">
                    <div className="release-icon-circle">🐧</div>
                    <div>
                      <div className="release-version">Pustak OS v2.0.0 (Linux Build)</div>
                      <div className="release-date">Released: August 11, 2026 &bull; Stable Build</div>
                    </div>
                  </div>
                  <div className="release-actions">
                    <a href="https://github.com/mishra-aashu/pushtak/releases" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      <Download size={14} /> Download .deb
                    </a>
                    <a href="https://github.com/mishra-aashu/pushtak/releases" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                      Download .AppImage
                    </a>
                  </div>
                </div>

                {/* Windows Card */}
                <div className="download-release-card">
                  <div className="release-info">
                    <div className="release-icon-circle">🪟</div>
                    <div>
                      <div className="release-version">Pustak OS v2.0.0 (Windows Build)</div>
                      <div className="release-date">Released: August 11, 2026 &bull; Stable Build</div>
                    </div>
                  </div>
                  <div className="release-actions">
                    <a href="https://github.com/mishra-aashu/pushtak/releases" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      <Download size={14} /> Download .msi Installer
                    </a>
                  </div>
                </div>

                {/* macOS Card */}
                <div className="download-release-card">
                  <div className="release-info">
                    <div className="release-icon-circle">🍎</div>
                    <div>
                      <div className="release-version">Pustak OS v2.0.0 (macOS Intel/Silicon)</div>
                      <div className="release-date">Released: August 11, 2026 &bull; Apple Silicon Support</div>
                    </div>
                  </div>
                  <div className="release-actions">
                    <a href="https://github.com/mishra-aashu/pushtak/releases" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      <Download size={14} /> Download DMG (Universal)
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div>
              <div className="portal-header-row">
                <div>
                  <h2>Activation Guide & documentation</h2>
                  <p>Follow these details to activate your desktop application container.</p>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3>Offline activation steps:</h3>
                
                <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
                  <li>
                    <strong>Install Pustak OS:</strong> Download the release file corresponding to your operating system from the <strong>Software Downloads</strong> tab and install it.
                  </li>
                  <li>
                    <strong>Find system Hardware ID:</strong> Open the Pustak OS desktop application on your server system. Navigate to the <em>Settings & License</em> panel (or press <kbd>Alt + 7</kbd>) to view your computer's Hardware ID (HWID). Alternatively, copy the CLI command from the <em>HWID Activator</em> tab on this website to query the terminal.
                  </li>
                  <li>
                    <strong>Register machine ID:</strong> Navigate to the <strong>HWID Activator</strong> tab in this Portal. Paste the system UUID in the input form and click <strong>Register & Activate Machine</strong>.
                  </li>
                  <li>
                    <strong>Download License Configuration:</strong> Click the <strong>Download license.json</strong> button. This downloads a local verification configuration.
                  </li>
                  <li>
                    <strong>Configure desktop app:</strong> Open your Pustak OS app directories (usually under <code>~/.config/pustak-os/</code> on Linux or <code>%APPDATA%/pustak-os/</code> on Windows), paste the downloaded <code>license.json</code> file inside, and restart the app.
                  </li>
                  <li>
                    <strong>Confirm Activation:</strong> Pustak OS will detect the file and unlock the dashboard for unlimited usage with zero offline limitations.
                  </li>
                </ol>

                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem', alignItems: 'flex-start', marginTop: '1rem' }}>
                  <Info size={16} className="gradient-text" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                  <p>
                    Having trouble with offline activation? Contact developers via Mishra Aashu's GitHub repository or submit an issue in the official code repository.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
