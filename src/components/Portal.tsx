import { useState, useEffect } from 'react';
import { Armchair, CheckCircle2, Copy, Download, FileText, Info, Key, LayoutDashboard, LogOut, Monitor, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PortalProps {
  user: any;
  licenseKey: string;
  libraryName: string;
  onLogout: () => void;
}

interface Machine {
  id: string;
  hwid: string;
  device_name: string;
  activated_at: string;
}

export default function Portal({ user, licenseKey, libraryName, onLogout }: PortalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'hwid' | 'downloads' | 'docs'>('overview');
  const [hwidInput, setHwidInput] = useState('');
  const [deviceNameInput, setDeviceNameInput] = useState('');
  
  // Real database state
  const [licenses, setLicenses] = useState<any[]>([]);
  const [selectedLicense, setSelectedLicense] = useState<any>(null);
  const [activations, setActivations] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [showLicenseKey, setShowLicenseKey] = useState(false);
  const [copiedLicense, setCopiedLicense] = useState(false);

  // Mock state fallbacks for offline demo bypass (admin/admin)
  const [mockActivations, setMockActivations] = useState<Machine[]>([
    { id: 'mock-1', hwid: 'A4F8-12D9-C10B-3DE2', device_name: 'Apex Reception PC', activated_at: '2026-08-10T12:00:00Z' }
  ]);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [generatedActivationCode, setGeneratedActivationCode] = useState('');

  const currentLicense = selectedLicense ? selectedLicense.license_key : (licenseKey || 'POS-LIFETIME-DEMO-99FF');
  const currentLibrary = libraryName || (user ? `${user.user_metadata?.full_name || user.email?.split('@')[0]}'s Study Hall` : 'Apex Reading Hall (Demo)');

  const fetchLicenses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_email', user.email);
      
      if (error) throw error;
      
      setLicenses(data || []);
      if (data && data.length > 0) {
        // If we have a newly generated license key matching the licenseKey prop, select it; otherwise select the first one
        const matched = data.find(l => l.license_key === licenseKey);
        setSelectedLicense(matched || data[0]);
      }
    } catch (err: any) {
      console.error('Error fetching user licenses:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivations = async () => {
    if (!selectedLicense) return;
    try {
      const { data, error } = await supabase
        .from('license_activations')
        .select('*')
        .eq('license_id', selectedLicense.id);
      
      if (error) throw error;
      setActivations(data || []);
    } catch (err: any) {
      console.error('Error fetching license activations:', err.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLicenses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedLicense) {
      fetchActivations();
    }
  }, [selectedLicense]);

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleActivateHwid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwidInput.trim()) {
      alert('Please enter a valid Hardware ID.');
      return;
    }

    const cleanHwid = hwidInput.trim().toUpperCase();
    const cleanDeviceName = deviceNameInput.trim() || 'Study Hall PC';

    if (user && selectedLicense) {
      setActivating(true);
      try {
        const { error } = await supabase
          .from('license_activations')
          .insert({
            license_id: selectedLicense.id,
            hwid: cleanHwid,
            device_name: cleanDeviceName,
            activated_at: new Date().toISOString(),
            last_validated_at: new Date().toISOString()
          })
          .select();

        if (error) throw error;

        // Generate activation code signature
        const token = btoa(JSON.stringify({
          license: selectedLicense.license_key,
          library: currentLibrary,
          hwid: cleanHwid,
          timestamp: Date.now()
        })).substring(0, 32).toUpperCase();

        setGeneratedActivationCode(token);
        setHwidInput('');
        setDeviceNameInput('');
        fetchActivations();
      } catch (err: any) {
        console.error('Error activating HWID:', err.message);
        alert('Failed to register device activation: ' + err.message);
      } finally {
        setActivating(false);
      }
    } else {
      // Demo/mock fallback path
      const newMachine = {
        id: Math.random().toString(),
        hwid: cleanHwid,
        device_name: cleanDeviceName,
        activated_at: new Date().toISOString()
      };
      setMockActivations([...mockActivations, newMachine]);

      const token = btoa(JSON.stringify({
        license: currentLicense,
        library: currentLibrary,
        hwid: cleanHwid,
        timestamp: Date.now()
      })).substring(0, 32).toUpperCase();

      setGeneratedActivationCode(token);
      setHwidInput('');
      setDeviceNameInput('');
    }
  };

  const handleDeactivateHwid = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this device? It will stop functioning on the local computer.')) {
      return;
    }
    if (user && selectedLicense) {
      try {
        const { error } = await supabase
          .from('license_activations')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchActivations();
      } catch (err: any) {
        console.error('Error deactivating HWID:', err.message);
        alert('Failed to deactivate device: ' + err.message);
      }
    } else {
      setMockActivations(mockActivations.filter(m => m.id !== id));
    }
  };

  // Trigger client-side download of license.json
  const handleDownloadLicenseJson = (machine: Machine) => {
    const licenseData = {
      licenseKey: currentLicense,
      libraryName: currentLibrary,
      machineId: machine.hwid,
      activationCode: generatedActivationCode || 'ACT-DEFAULT-KEY-SIGNATURE-A3BF',
      activatedDate: machine.activated_at,
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

  const activeList = user ? activations : mockActivations;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.25rem', color: 'var(--text-dark)' }}>
        <Loader2 size={36} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--primary)' }} />
        <p style={{ fontWeight: 500 }}>Syncing licensing database...</p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

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
              {user ? user.email?.substring(0, 2).toUpperCase() : currentLibrary.substring(0, 2).toUpperCase()}
            </div>
            <div className="portal-user-info" style={{ flexGrow: 1 }}>
              <span className="portal-username" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px', display: 'block' }}>
                {user ? (user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]) : currentLibrary}
              </span>
              <span className="portal-user-email" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px', display: 'block' }}>
                {user ? user.email : 'admin@pustakos.com'}
              </span>
            </div>
            <button className="copy-cmd-btn" onClick={onLogout} title="Log Out">
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        {/* Portal Main Content */}
        <main className="portal-content text-left">
          {user && licenses.length === 0 ? (
            <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '3rem auto' }}>
              <Key size={48} style={{ color: 'var(--primary)', marginBottom: '1.5rem', opacity: 0.6 }} />
              <h3 style={{ marginBottom: '0.75rem' }}>No Licenses Found</h3>
              <p style={{ color: 'var(--text-dark)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.6' }}>
                We couldn't find any Pustak OS licenses registered to your Google account (<strong>{user.email}</strong>).
                Purchase a license on the homepage to unlock your dashboard!
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => onLogout()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Return to Homepage
              </button>
            </div>
          ) : (
            <>
              {/* Dynamic License Selector for Authenticated User */}
              {user && licenses.length > 0 && (
                <div style={{ marginBottom: '2rem', background: 'var(--accent-light)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Key size={20} style={{ color: 'var(--primary)' }} />
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>Active Portal License</h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dark)' }}>Select which subscription key you want to configure</p>
                    </div>
                  </div>
                  <select
                    value={selectedLicense?.id || ''}
                    onChange={(e) => {
                      const found = licenses.find(l => l.id === e.target.value);
                      if (found) setSelectedLicense(found);
                    }}
                    style={{
                      background: 'var(--bg-main)',
                      color: 'var(--text)',
                      border: '1px solid var(--border-color)',
                      padding: '0.6rem 1.25rem',
                      borderRadius: 'var(--border-radius-sm)',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      minWidth: '220px',
                      cursor: 'pointer'
                    }}
                  >
                    {licenses.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.license_key} ({l.validity})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === 'overview' && (
                <div>
                  <div className="portal-header-row">
                    <div>
                      <h2>License Dashboard</h2>
                      <p>Manage machines, seats, and updates for your institution.</p>
                    </div>
                    <div 
                      className="badge" 
                      style={{ 
                        textTransform: 'none', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        padding: '0.35rem 0.75rem',
                        background: 'var(--accent-light)',
                        border: '1px solid rgba(139, 92, 246, 0.2)'
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>License:</span>
                      <code style={{ 
                        fontFamily: 'monospace', 
                        letterSpacing: showLicenseKey ? 'normal' : '0.15em', 
                        color: 'var(--primary)',
                        fontWeight: 'bold',
                        fontSize: '0.85rem'
                      }}>
                        {showLicenseKey 
                          ? currentLicense 
                          : `${currentLicense.substring(0, 13)}••••-••••`}
                      </code>
                      
                      <button
                        onClick={() => setShowLicenseKey(!showLicenseKey)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px',
                          borderRadius: '4px',
                          transition: 'color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        title={showLicenseKey ? "Hide License Key" : "Show License Key"}
                      >
                        {showLicenseKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(currentLicense);
                          setCopiedLicense(true);
                          setTimeout(() => setCopiedLicense(false), 2000);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px',
                          borderRadius: '4px',
                          transition: 'color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        title="Copy License Key"
                      >
                        {copiedLicense ? <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 'bold' }}>Copied!</span> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Stats Panel */}
                  <div className="portal-stats-row">
                    <div className="portal-stat-card">
                      <div className="portal-stat-icon">
                        <Key size={20} />
                      </div>
                      <div>
                        <div className="portal-stat-num" style={{ textTransform: 'uppercase' }}>
                          {selectedLicense ? selectedLicense.validity : 'Lifetime'}
                        </div>
                        <div className="portal-stat-desc">Subscription Class</div>
                      </div>
                    </div>
                    <div className="portal-stat-card">
                      <div className="portal-stat-icon">
                        <Monitor size={20} />
                      </div>
                      <div>
                        <div className="portal-stat-num">{activeList.length}</div>
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

                    <div style={{ overflowX: 'auto' }}>
                      <table className="activated-keys-table">
                        <thead>
                          <tr>
                            <th>Machine HWID</th>
                            <th>Device Label</th>
                            <th>Registered On</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeList.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dark)' }}>
                                No active machines registered. Go to HWID Activator to activate a machine.
                              </td>
                            </tr>
                          ) : (
                            activeList.map((m, idx) => (
                              <tr key={m.id || idx}>
                                <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#a78bfa' }}>
                                  {m.hwid}
                                </td>
                                <td>{m.device_name || 'Study Hall PC'}</td>
                                <td>{m.activated_at ? new Date(m.activated_at).toLocaleDateString() : 'N/A'}</td>
                                <td>
                                  <span className="badge-status active">Active</span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button 
                                      className="btn btn-accent" 
                                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                      onClick={() => handleDownloadLicenseJson(m)}
                                    >
                                      <Download size={12} /> Download JSON
                                    </button>
                                    <button 
                                      className="btn" 
                                      style={{ padding: '0.35rem', fontSize: '0.8rem', border: '1px solid #ef4444', color: '#ef4444', background: 'rgba(239,68,68,0.02)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}
                                      onClick={() => handleDeactivateHwid(m.id)}
                                      title="Deactivate Device"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
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
                        <div className="form-group">
                          <label>Device Label (Optional)</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Main Desk PC"
                            value={deviceNameInput}
                            onChange={(e) => setDeviceNameInput(e.target.value)}
                          />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={activating}>
                          {activating ? 'Activating Device...' : 'Register & Activate Machine'}
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
                            Machine registered successfully! Click below to download your offline licensing key file. Put this `license.json` file inside the desktop app config folder.
                          </p>

                          <div style={{ background: '#07090e', border: '1px dashed rgba(139,92,246,0.3)', borderRadius: '6px', padding: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Activation Token</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all', color: '#a78bfa' }}>
                              {generatedActivationCode}
                            </div>
                          </div>

                          <button 
                            className="btn btn-primary w-full" 
                            onClick={() => {
                              if (activeList.length > 0) {
                                handleDownloadLicenseJson(activeList[activeList.length - 1]);
                              } else {
                                alert('No active machines registered.');
                              }
                            }}
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
                        <div className="release-icon-circle" style={{ background: '#fef3c7', color: '#d97706' }}>
                          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 01.016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 01-.448-.067 3.566 3.566 0 01-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.043c-.06-.003-.12 0-.18 0h-.016c.151-.467-.182-.825-1.065-1.224-.915-.4-1.646-.336-1.77.465-.008.043-.013.066-.018.135-.068.023-.139.053-.209.064-.43.268-.662.669-.793 1.187-.13.533-.17 1.156-.205 1.869v.003c-.02.334-.17.838-.319 1.35-1.5 1.072-3.58 1.538-5.348.334a2.645 2.645 0 00-.402-.533 1.45 1.45 0 00-.275-.333c.182 0 .338-.03.465-.067a.615.615 0 00.314-.334c.108-.267 0-.697-.345-1.163-.345-.467-.931-.995-1.788-1.521-.63-.4-.986-.87-1.15-1.396-.165-.534-.143-1.085-.015-1.645.245-1.07.873-2.11 1.274-2.763.107-.065.037.135-.408.974-.396.751-1.14 2.497-.122 3.854a8.123 8.123 0 01.647-2.876c.564-1.278 1.743-3.504 1.836-5.268.048.036.217.135.289.202.218.133.38.333.59.465.21.201.477.335.876.335.039.003.075.006.11.006.412 0 .73-.134.997-.268.29-.134.52-.334.74-.4h.005c.467-.135.835-.402 1.044-.7zm2.185 8.958c.037.6.343 1.245.882 1.377.588.134 1.434-.333 1.791-.765l.211-.01c.315-.007.577.01.847.268l.003.003c.208.199.305.53.391.876.085.4.154.78.409 1.066.486.527.645.906.636 1.14l.003-.007v.018l-.003-.012c-.015.262-.185.396-.498.595-.63.401-1.746.712-2.457 1.57-.618.737-1.37 1.14-2.036 1.191-.664.053-1.237-.2-1.574-.898l-.005-.003c-.21-.4-.12-1.025.056-1.69.176-.668.428-1.344.463-1.897.037-.714.076-1.335.195-1.814.12-.465.308-.797.641-.984l.045-.022zm-10.814.049h.01c.053 0 .105.005.157.014.376.055.706.333 1.023.752l.91 1.664.003.003c.243.533.754 1.064 1.189 1.637.434.598.77 1.131.729 1.57v.006c-.057.744-.48 1.148-1.125 1.294-.645.135-1.52.002-2.395-.464-.968-.536-2.118-.469-2.857-.602-.369-.066-.61-.2-.723-.4-.11-.2-.113-.602.123-1.23v-.004l.002-.003c.117-.334.03-.752-.027-1.118-.055-.401-.083-.71.043-.94.16-.334.396-.4.69-.533.294-.135.64-.202.915-.47h.002v-.002c.256-.268.445-.601.668-.838.19-.201.38-.336.663-.336zm7.159-9.074c-.435.201-.945.535-1.488.535-.542 0-.97-.267-1.28-.466-.154-.134-.28-.268-.373-.335-.164-.134-.144-.333-.074-.333.109.016.129.134.199.2.096.066.215.2.36.333.292.2.68.467 1.167.467.485 0 1.053-.267 1.398-.466.195-.135.445-.334.648-.467.156-.136.149-.267.279-.267.128.016.034.134-.147.332a8.097 8.097 0 01-.69.468zm-1.082-1.583V5.64c-.006-.02.013-.042.029-.05.074-.043.18-.027.26.004.063 0 .16.067.15.135-.006.049-.085.066-.135.066-.055 0-.092-.043-.141-.068-.052-.018-.146-.008-.163-.065zm-.551 0c-.02.058-.113.049-.166.066-.047.025-.086.068-.14.068-.05 0-.13-.02-.136-.068-.01-.066.088-.133.15-.133.08-.031.184-.047.259-.005.019.009.036.03.03.05v.02h.003z" />
                          </svg>
                        </div>
                        <div>
                          <div className="release-version">Pustak OS v2.0.0 (Linux Build)</div>
                          <div className="release-date">Released: August 11, 2026 &bull; Stable Build</div>
                        </div>
                      </div>
                      <div className="release-actions">
                        <a href="https://github.com/mishra-aashu/pushtak/releases" target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">
                          <Download size={14} /> Download .deb
                        </a>
                        <a href="https://github.com/mishra-aashu/pushtak/releases" target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full">
                          Download .AppImage
                        </a>
                      </div>
                    </div>

                    {/* Windows Card */}
                    <div className="download-release-card">
                      <div className="release-info">
                        <div className="release-icon-circle" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.1zM10.95 1.95L24 0v11.55H10.95V1.95zM10.95 12.45H24v11.55l-13.05-1.95v-9.6z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="release-version">Pustak OS v2.0.0 (Windows Build)</div>
                          <div className="release-date">Released: August 11, 2026 &bull; Stable Build</div>
                        </div>
                      </div>
                      <div className="release-actions">
                        <a href="https://github.com/mishra-aashu/pushtak/releases" target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">
                          <Download size={14} /> Download .msi Installer
                        </a>
                      </div>
                    </div>

                    {/* macOS Card */}
                    <div className="download-release-card">
                      <div className="release-info">
                        <div className="release-icon-circle" style={{ background: '#f3f4f6', color: '#1f2937' }}>
                          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.17.67-2.88 1.49-.62.72-1.16 1.87-1.01 2.97 1.12.09 2.24-.59 2.9-1.4"/>
                          </svg>
                        </div>
                        <div>
                          <div className="release-version">Pustak OS v2.0.0 (macOS Intel/Silicon)</div>
                          <div className="release-date">Released: August 11, 2026 &bull; Apple Silicon Support</div>
                        </div>
                      </div>
                      <div className="release-actions">
                        <a href="https://github.com/mishra-aashu/pushtak/releases" target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">
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
            </>
          )}
        </main>
      </div>
    </div>
  );
}
