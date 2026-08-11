import { useState } from 'react';
import { Check, X, Sparkles, Copy, CheckCircle2 } from 'lucide-react';

interface PricingProps {
  onSuccessPurchase: (licenseKey: string) => void;
}

export default function Pricing({ onSuccessPurchase }: PricingProps) {
  const [checkoutPlan, setCheckoutPlan] = useState<'trial' | 'lifetime' | 'cloud' | null>(null);
  const [formData, setFormData] = useState({ name: '', libraryName: '', email: '' });
  const [purchaseStep, setPurchaseStep] = useState<'form' | 'payment' | 'success'>('form');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [showRetrieveModal, setShowRetrieveModal] = useState(false);
  const [retrieveEmail, setRetrieveEmail] = useState('');
  const [retrievedLicenses, setRetrievedLicenses] = useState<any[] | null>(null);
  const [isRetrieving, setIsRetrieving] = useState(false);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.libraryName) {
      alert('Please fill out all fields.');
      return;
    }
    setPurchaseStep('payment');
  };

  const handlePaymentComplete = async () => {
    // Generate a beautiful mock license key
    const uniquePart = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
      Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = checkoutPlan === 'cloud' ? 'POS-CLOUD' :
      checkoutPlan === 'lifetime' ? 'POS-LIFETIME' : 'POS-TRIAL';
    const finalKey = `${prefix}-${uniquePart}`;

    let validityVal = 'lifetime';
    let expiresAtStr: string | null = null;
    if (checkoutPlan === 'trial') {
      validityVal = 'trial';
      expiresAtStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (checkoutPlan === 'cloud') {
      validityVal = 'cloud';
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        alert('Configuration error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variable is not defined.');
        return;
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/licenses`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          license_key: finalKey,
          user_email: formData.email.trim(),
          validity: validityVal,
          hwid: null,
          expires_at: expiresAtStr,
          is_active: true
        })
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        console.error('Supabase license insertion failed:', errorMsg);
        alert('Failed to register license key on server. Please try again.');
        return;
      }
    } catch (err) {
      console.error('Failed to connect to licensing database:', err);
      alert('Network error connecting to licensing server. Please check your connection.');
      return;
    }

    setGeneratedKey(finalKey);
    setPurchaseStep('success');
    onSuccessPurchase(finalKey);
  };

  const handleRetrieveLicenses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retrieveEmail.trim()) return;

    setIsRetrieving(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        alert('Configuration error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variable is not defined.');
        setIsRetrieving(false);
        return;
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/licenses?user_email=eq.${encodeURIComponent(retrieveEmail.trim())}`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRetrievedLicenses(data);
      } else {
        console.error('Failed to retrieve licenses:', await response.text());
        alert('Failed to retrieve licenses. Please try again.');
      }
    } catch (err) {
      console.error('Error retrieving licenses:', err);
      alert('Network error. Please try again.');
    } finally {
      setIsRetrieving(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetCheckout = () => {
    setCheckoutPlan(null);
    setPurchaseStep('form');
    setFormData({ name: '', libraryName: '', email: '' });
    setGeneratedKey('');
  };

  return (
    <section id="pricing" className="pricing-section">
      <div className="container">
        <div className="section-header">
          <div className="badge mb-4">Pricing Model</div>
          <h2>Simple, Transparent Licensing</h2>
          <p>
            No recurring cloud subscriptions. Purchase a lifetime license bound to your machine hardware and run your library offline forever.
          </p>
        </div>

        <div className="pricing-grid">
          {/* Starter Demo Card */}
          <div className="glass-card pricing-card">
            <div className="price-header">
              <h3 className="price-title">Starter Demo</h3>
              <p>Test Pustak OS on your local PC</p>
              <div className="price-tag">
                <span className="price-currency">₹</span>
                <span className="price-amount">0</span>
                <span className="price-period">/ 7-Day Trial</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li className="pricing-feature-item">
                <Check size={16} /> Full Visual Seat Grid (Up to 20 seats)
              </li>
              <li className="pricing-feature-item">
                <Check size={16} /> Basic Student Entry & Fee Record
              </li>
              <li className="pricing-feature-item">
                <Check size={16} /> 100% Offline SQLite Local DB
              </li>
              <li className="pricing-feature-item">
                <Check size={16} /> Command Palette Quick Search
              </li>
              <li className="pricing-feature-item" style={{ color: 'var(--text-dark)' }}>
                <X size={16} style={{ color: 'red' }} /> Multi-Shift Desk Allocation
              </li>
              <li className="pricing-feature-item" style={{ color: 'var(--text-dark)' }}>
                <X size={16} style={{ color: 'red' }} /> HWID Single Machine License
              </li>
              <li className="pricing-feature-item" style={{ color: 'var(--text-dark)' }}>
                <X size={16} style={{ color: 'red' }} /> 1-Click Automated Backup
              </li>
            </ul>
            <button className="btn btn-secondary" style={{ marginTop: 'auto' }} onClick={() => { setCheckoutPlan('trial'); setPurchaseStep('form'); }}>
              Download Free Trial
            </button>
          </div>

          {/* Lifetime Pro Card */}
          <div className="glass-card pricing-card featured">
            <div className="pricing-badge">BEST VALUE</div>
            <div className="price-header">
              <h3 className="price-title" style={{ color: '#a78bfa' }}>Lifetime Pro</h3>
              <p>Own the software. Run 100% offline forever.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ color: 'var(--text-dark)', textDecoration: 'line-through', fontSize: '0.85rem' }}>₹8,499</span>
                <span className="badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#a78bfa', textTransform: 'none', borderRadius: '4px', verticalAlign: 'middle', fontWeight: 600 }}>Save 29%</span>
              </div>
              <div className="price-tag" style={{ marginTop: '0.25rem' }}>
                <span className="price-currency">₹</span>
                <span className="price-amount">5,999</span>
                <span className="price-period">/ one-time</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li className="pricing-feature-item">
                <Check size={16} /> Unlimited Member & Seat Registrations
              </li>
              <li className="pricing-feature-item">
                <Check size={16} /> Visual Desk Grid & Multi-Shift Mapping
              </li>
              <li className="pricing-feature-item">
                <Check size={16} /> Student Fee Ledger & Renewal Alerts
              </li>
              <li className="pricing-feature-item">
                <Check size={16} /> HWID Machine License Key
              </li>
              <li className="pricing-feature-item">
                <Check size={16} /> 1-Click Offline Local DB Backup
              </li>
              <li className="pricing-feature-item">
                <Check size={16} /> 1 Year Free Software Updates
              </li>
              <li className="pricing-feature-item">
                <Check size={16} /> Zero Monthly / Server Subscription Fees
              </li>
            </ul>
            <button className="btn btn-primary" style={{ marginTop: 'auto' }} onClick={() => { setCheckoutPlan('lifetime'); setPurchaseStep('form'); }}>
              Get Lifetime License
            </button>
          </div>

          {/* Cloud & WhatsApp Card */}
          <div className="glass-card pricing-card">
            <div className="pricing-badge" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', top: '-15px', right: '25px' }}>RECOMMENDED FOR TEAMS</div>
            <div className="price-header">
              <h3 className="price-title" style={{ color: '#34d399' }}>Cloud & WhatsApp</h3>
              <p>For owners wanting remote access & automation.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ color: 'var(--text-dark)', textDecoration: 'line-through', fontSize: '0.85rem' }}>₹18,499</span>
                <span className="badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34d399', textTransform: 'none', borderRadius: '4px', verticalAlign: 'middle', fontWeight: 600 }}>Save 32%</span>
              </div>
              <div className="price-tag" style={{ marginTop: '0.25rem' }}>
                <span className="price-currency">₹</span>
                <span className="price-amount">12,500</span>
                <span className="price-period">/ One-Time</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li className="pricing-feature-item">
                <Check size={16} /> Everything in Lifetime Pro Plan
              </li>
              <li className="pricing-feature-item">
                <Check size={16} /> Automated WhatsApp Fee Reminders
              </li>
              <li className="pricing-feature-item">
                <Check size={16} /> Owner Mobile Dashboard Sync
              </li>
              <li className="pricing-feature-item">
                <Check size={16} /> Multi-Device Cloud Backup
              </li>
              <li className="pricing-feature-item">
                <Check size={16} /> Priority Phone & Remote Support
              </li>
            </ul>
            <button className="btn btn-secondary" style={{ marginTop: 'auto' }} onClick={() => { setCheckoutPlan('cloud'); setPurchaseStep('form'); }}>
              Upgrade to Cloud
            </button>
          </div>
        </div>

        <p className="text-center" style={{ marginTop: '2rem', opacity: 0.85, fontSize: '0.9rem', width: '100%' }}>
          Lost your license key?{' '}
          <a
            href="#"
            style={{ color: '#a78bfa', textDecoration: 'underline', cursor: 'pointer', fontWeight: '500' }}
            onClick={(e) => {
              e.preventDefault();
              setShowRetrieveModal(true);
            }}
          >
            Retrieve your license by registered email
          </a>
        </p>

        {/* Interactive Modal Checkout Flow */}
        {checkoutPlan && (
          <div className="checkout-modal-overlay" onClick={resetCheckout}>
            <div className="checkout-box" onClick={(e) => e.stopPropagation()}>
              <button className="close-modal-btn" onClick={resetCheckout}>
                <X size={20} />
              </button>

              {purchaseStep === 'form' && (
                <div>
                  <div className="checkout-header">
                    <h3>License Registration</h3>
                    <p>Enter details for the Pustak OS activation license</p>
                  </div>
                  <form className="checkout-form" onSubmit={handleCheckoutSubmit}>
                    <div className="form-group">
                      <label>Your Name</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Library / Study Hall Name</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Apex Reading Hall"
                        value={formData.libraryName}
                        onChange={(e) => setFormData({ ...formData, libraryName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        required
                        className="form-input"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary mt-4 w-full">
                      Proceed to Activation
                    </button>
                  </form>
                </div>
              )}

              {purchaseStep === 'payment' && (
                <div>
                  <div className="checkout-header">
                    <h3>Simulated Gateway</h3>
                    <p>
                      {checkoutPlan === 'lifetime'
                        ? 'Simulating secure payment of ₹5,999'
                        : checkoutPlan === 'cloud'
                          ? 'Simulating secure payment of ₹12,500'
                          : 'Simulating instant evaluation setup'}
                    </p>
                  </div>

                  <div className="glass-card text-center" style={{ margin: '1.5rem 0', background: 'rgba(255,255,255,0.01)' }}>
                    {checkoutPlan !== 'trial' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: '#ffffff', borderRadius: '8px', display: 'inline-block' }}>
                          {/* Simulated QR Code placeholder */}
                          <div style={{ width: '120px', height: '120px', background: 'linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)', backgroundSize: '20px 20px', opacity: 0.8 }}></div>
                        </div>
                        <p style={{ fontSize: '0.8rem' }}>Scan simulated UPI QR code to finalize order</p>
                      </div>
                    ) : (
                      <div style={{ padding: '2rem 0' }}>
                        <Sparkles size={40} className="gradient-text" style={{ margin: '0 auto 1rem', display: 'block' }} />
                        <p>No card details or payment required for trial registration.</p>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary w-full" onClick={() => setPurchaseStep('form')}>
                      Back
                    </button>
                    <button className="btn btn-primary w-full" onClick={handlePaymentComplete}>
                      Complete Activation
                    </button>
                  </div>
                </div>
              )}

              {purchaseStep === 'success' && (
                <div className="success-screen">
                  <div className="success-icon-ring">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3>Registration Successful!</h3>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    Your license key is generated. Please save this key. You will need it to activate the app or log in to the admin portal.
                  </p>

                  <div className="success-license-box">
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                      Pustak OS License Key
                    </div>
                    <div className="license-key-display">{generatedKey}</div>

                    <button
                      className="copy-cmd-btn"
                      onClick={handleCopyKey}
                      style={{ position: 'absolute', right: '0.75rem', top: '0.75rem' }}
                    >
                      {copied ? 'Copied!' : <Copy size={16} />}
                    </button>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dark)', marginBottom: '1.5rem' }}>
                    Use the username <strong>admin</strong> and your generated key as the password to access the licensing portal!
                  </p>

                  <button className="btn btn-primary w-full" onClick={resetCheckout}>
                    Return to Main Site
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Retrieve License Modal */}
        {showRetrieveModal && (
          <div className="checkout-modal-overlay" onClick={() => { setShowRetrieveModal(false); setRetrievedLicenses(null); setRetrieveEmail(''); }}>
            <div className="checkout-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <button
                className="close-modal-btn"
                onClick={() => {
                  setShowRetrieveModal(false);
                  setRetrievedLicenses(null);
                  setRetrieveEmail('');
                }}
              >
                <X size={20} />
              </button>

              <div className="checkout-header">
                <h3>Retrieve License Key</h3>
                <p>Search all Pustak OS licenses registered to your email address</p>
              </div>

              {retrievedLicenses === null ? (
                <form className="checkout-form" onSubmit={handleRetrieveLicenses}>
                  <div className="form-group">
                    <label>Registered Email Address</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="Enter your email"
                      value={retrieveEmail}
                      onChange={(e) => setRetrieveEmail(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary mt-4 w-full" disabled={isRetrieving}>
                    {isRetrieving ? 'Searching Database...' : 'Find My License'}
                  </button>
                </form>
              ) : (
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setRetrievedLicenses(null)}
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
                    >
                      &larr; Search Different Email
                    </button>
                  </div>

                  {retrievedLicenses.length === 0 ? (
                    <div className="text-center" style={{ padding: '2rem 1rem' }}>
                      <p style={{ color: 'var(--text-dark)' }}>No licenses found matching <strong>{retrieveEmail}</strong>.</p>
                      <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>Please verify the email spelling or check other emails.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                      {retrievedLicenses.map((lic) => (
                        <div
                          key={lic.id}
                          className="glass-card"
                          style={{
                            padding: '1rem',
                            position: 'relative',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.06)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span
                              className="badge"
                              style={{
                                background: lic.validity === 'trial' ? 'rgba(251, 191, 36, 0.1)' : lic.validity === 'cloud' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                                color: lic.validity === 'trial' ? '#fbbf24' : lic.validity === 'cloud' ? '#34d399' : '#a78bfa',
                                fontSize: '0.65rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                textTransform: 'capitalize',
                                fontWeight: 600
                              }}
                            >
                              {lic.validity} Plan
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: lic.is_active ? '#10b981' : '#ef4444'
                                }}
                              />
                              {lic.is_active ? 'Active' : 'Deactivated'}
                            </span>
                          </div>

                          <div
                            style={{
                              fontFamily: 'monospace',
                              background: 'rgba(0,0,0,0.2)',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.9rem',
                              wordBreak: 'break-all',
                              color: '#fff',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              margin: '0.5rem 0'
                            }}
                          >
                            <span>{lic.license_key}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(lic.license_key);
                                alert('Key copied to clipboard!');
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#a78bfa',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Copy License Key"
                            >
                              <Copy size={14} />
                            </button>
                          </div>

                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)', marginTop: '0.25rem' }}>
                            {lic.hwid ? (
                              <span>Bound HWID: <code style={{ color: '#fff' }}>{lic.hwid}</code></span>
                            ) : (
                              <span style={{ color: '#10b981', fontWeight: '500' }}>Ready for activation (not bound)</span>
                            )}
                          </div>
                          {lic.expires_at && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)', marginTop: '0.25rem' }}>
                              Expires: {new Date(lic.expires_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
