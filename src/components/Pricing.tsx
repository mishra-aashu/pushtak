import { useState, useEffect } from 'react';
import { Check, X, Sparkles, Copy, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldAlert, ShieldCheck, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

const loadScript = (src: string) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface PricingProps {
  user: any;
  onSuccessPurchase: (licenseKey: string, library: string) => void;
}

export default function Pricing({ user, onSuccessPurchase }: PricingProps) {
  const [checkoutPlan, setCheckoutPlan] = useState<'trial' | 'lifetime' | 'cloud' | null>(null);
  const [formData, setFormData] = useState({ name: '', libraryName: '', email: '' });
  const [purchaseStep, setPurchaseStep] = useState<'form' | 'payment' | 'success'>('form');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [showRetrieveModal, setShowRetrieveModal] = useState(false);
  const [retrieveEmail, setRetrieveEmail] = useState('');
  const [retrievePassword, setRetrievePassword] = useState('');
  const [showRetrievePassword, setShowRetrievePassword] = useState(false);
  const [retrievedLicenses, setRetrievedLicenses] = useState<any[] | null>(null);
  const [isRetrieving, setIsRetrieving] = useState(false);
  
  // Razorpay payment integration states
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Checkout Email Auth states
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutPassword, setCheckoutPassword] = useState('');
  const [showCheckoutPassword, setShowCheckoutPassword] = useState(false);
  const [isCheckoutAuthLoading, setIsCheckoutAuthLoading] = useState(false);
  const [checkoutAuthError, setCheckoutAuthError] = useState('');

  // Restore plan from localStorage if redirecting back from OAuth
  useEffect(() => {
    if (user) {
      const savedPlan = localStorage.getItem('pustak_checkout_plan');
      if (savedPlan) {
        setCheckoutPlan(savedPlan as any);
        setPurchaseStep('form');
        localStorage.removeItem('pustak_checkout_plan');
      }
    }
  }, [user]);

  // Autofill form data when Google user session is available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || user.user_metadata?.name || prev.name || '',
        email: user.email || prev.email || ''
      }));
    }
  }, [user]);

  const handleGoogleLoginForCheckout = async (plan: 'trial' | 'lifetime' | 'cloud') => {
    localStorage.setItem('pustak_checkout_plan', plan);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google OAuth checkout initiation failed:', err);
      alert('Failed to launch Google Sign In: ' + err.message);
    }
  };
  const handleCheckoutEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutEmail.trim() || !checkoutPassword.trim()) {
      setCheckoutAuthError('Please enter both email and password.');
      return;
    }
    setIsCheckoutAuthLoading(true);
    setCheckoutAuthError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: checkoutEmail.trim(),
        password: checkoutPassword.trim(),
      });
      if (error) throw error;
      
      setCheckoutEmail('');
      setCheckoutPassword('');
    } catch (err: any) {
      console.error('Checkout email login failed:', err);
      setCheckoutAuthError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsCheckoutAuthLoading(false);
    }
  };
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.libraryName) {
      alert('Please fill out all fields.');
      return;
    }
    setPurchaseStep('payment');
  };

  const handlePaymentComplete = async () => {
    if (checkoutPlan === 'trial') {
      setIsPaymentLoading(true);
      setPaymentError('');
      // Standard trial activation
      const uniquePart = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
        Math.random().toString(36).substring(2, 6).toUpperCase();
      const finalKey = `POS-TRIAL-${uniquePart}`;
      const expiresAtStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      try {
        const { error } = await supabase.from('licenses').insert({
          license_key: finalKey,
          user_email: formData.email.trim(),
          validity: 'trial',
          hwid: null,
          expires_at: expiresAtStr,
          is_active: true
        });

        if (error) throw error;

        setGeneratedKey(finalKey);
        setPurchaseStep('success');
        onSuccessPurchase(finalKey, formData.libraryName);
      } catch (err: any) {
        console.error('Trial key insertion failed:', err);
        setPaymentError(err.message || 'Failed to setup trial license key.');
      } finally {
        setIsPaymentLoading(false);
      }
      return;
    }

    // For paid plans ('lifetime' | 'cloud')
    setIsPaymentLoading(true);
    setPaymentError('');
    try {
      // 1. Create Order on Server
      const { data: createData, error: createError } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: {
          action: 'create_order',
          plan: checkoutPlan,
          email: formData.email.trim()
        }
      });

      if (createError || !createData || !createData.success) {
        throw new Error(createError?.message || createData?.error || 'Failed to initialize payment.');
      }

      const rzpOrder = createData.order;
      const keyId = createData.keyId;

      // 2. Load SDK Script
      const isScriptLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!isScriptLoaded) {
        throw new Error('Failed to load Razorpay SDK. Please check your internet connection.');
      }

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: keyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        order_id: rzpOrder.id,
        name: 'Pustak OS',
        description: `${checkoutPlan === 'cloud' ? 'Cloud & WhatsApp' : 'Lifetime Pro'} Activation for ${formData.libraryName}`,
        image: 'https://img.icons8.com/color/120/library.png',
        handler: async function (response: any) {
          setIsPaymentLoading(true);
          setPaymentError('');
          try {
            // 4. Verify Payment on Server
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                action: 'verify_payment',
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                plan: checkoutPlan,
                email: formData.email.trim()
              }
            });

            if (verifyError || !verifyData || !verifyData.verified) {
              throw new Error(verifyError?.message || verifyData?.error || 'Payment verification failed.');
            }

            // Success!
            setGeneratedKey(verifyData.license_key);
            setPurchaseStep('success');
            onSuccessPurchase(verifyData.license_key, formData.libraryName);
          } catch (err: any) {
            console.error('Verification error:', err);
            setPaymentError(err.message || 'Failed to verify secure payment transaction.');
          } finally {
            setIsPaymentLoading(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
        },
        theme: {
          color: '#7c3aed' // Elegant violet matching featured cards
        },
        modal: {
          ondismiss: function () {
            setIsPaymentLoading(false);
            setPaymentError('Payment was cancelled by the user.');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentError(err.message || 'Payment initialization failed.');
      setIsPaymentLoading(false);
    }
  };

  const handleRetrieveLicenses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retrieveEmail.trim() || !retrievePassword.trim()) {
      alert('Please enter both your registered email and password.');
      return;
    }

    setIsRetrieving(true);
    try {
      // Authenticate with email/password first
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: retrieveEmail.trim(),
        password: retrievePassword.trim()
      });
      if (authError) throw authError;

      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_email', retrieveEmail.trim());

      if (error) throw error;
      setRetrievedLicenses(data);
    } catch (err: any) {
      console.error('Error retrieving licenses:', err);
      alert('Authentication failed: ' + (err.message || 'Invalid email or password.'));
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
              <h3 className="price-title" style={{ fontWeight: 700 }}>Starter Demo</h3>
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
              <li className="pricing-feature-item muted">
                <X size={16} /> Multi-Shift Desk Allocation
              </li>
              <li className="pricing-feature-item muted">
                <X size={16} /> HWID Single Machine License
              </li>
              <li className="pricing-feature-item muted">
                <X size={16} /> 1-Click Automated Backup
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
              <h3 className="price-title" style={{ color: 'var(--primary)', fontWeight: 700 }}>Lifetime Pro</h3>
              <p>Own the software. Run 100% offline forever.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ color: 'var(--text-dark)', textDecoration: 'line-through', fontSize: '0.85rem' }}>₹8,499</span>
                <span className="badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: 'var(--accent-light)', border: '1px solid var(--border-hover)', color: 'var(--primary)', textTransform: 'none', borderRadius: '4px', verticalAlign: 'middle', fontWeight: 600 }}>Save 29%</span>
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
              <h3 className="price-title" style={{ color: 'var(--success)', fontWeight: 700 }}>Cloud & WhatsApp</h3>
              <p>For owners wanting remote access & automation.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ color: 'var(--text-dark)', textDecoration: 'line-through', fontSize: '0.85rem' }}>₹18,499</span>
                <span className="badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: 'var(--success-light)', border: '1px solid var(--success-border)', color: 'var(--success)', textTransform: 'none', borderRadius: '4px', verticalAlign: 'middle', fontWeight: 600 }}>Save 32%</span>
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
                    {user ? (
                      <p>Enter details for the Pustak OS activation license</p>
                    ) : (
                      <p>Sign in to secure ownership of your license</p>
                    )}
                  </div>
                  
                  {!user ? (
                    <div style={{ padding: '0 0.5rem' }}>
                      {checkoutAuthError && (
                        <div className="alert alert-danger" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                            <span>{checkoutAuthError}</span>
                          </div>
                          {(checkoutAuthError.toLowerCase().includes('invalid') || checkoutAuthError.toLowerCase().includes('not found')) && (
                            <div style={{ fontSize: '0.8rem', color: '#ef4444', opacity: 0.85, paddingLeft: '1.4rem' }}>
                             New user? Use Google below to register.
                            </div>
                          )}
                        </div>
                      )}

                      <form onSubmit={handleCheckoutEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-dark)' }}>Email Address</label>
                          <div className="input-with-icon-wrapper">
                            <span className="input-icon">
                              <Mail size={16} />
                            </span>
                            <input
                              type="email"
                              required
                              className="form-input"
                              placeholder="name@library.com"
                              value={checkoutEmail}
                              onChange={(e) => setCheckoutEmail(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-dark)' }}>Password</label>
                          <div className="input-with-icon-wrapper">
                            <span className="input-icon">
                              <Lock size={16} />
                            </span>
                            <input
                              type={showCheckoutPassword ? 'text' : 'password'}
                              required
                              className="form-input"
                              placeholder="Enter password"
                              value={checkoutPassword}
                              onChange={(e) => setCheckoutPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              className="password-toggle-btn"
                              onClick={() => setShowCheckoutPassword(!showCheckoutPassword)}
                              tabIndex={-1}
                            >
                              {showCheckoutPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        <button type="submit" disabled={isCheckoutAuthLoading} className="btn btn-primary w-full" style={{ padding: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {isCheckoutAuthLoading ? 'Processing...' : 'Sign In & Continue'}
                        </button>
                      </form>

                      <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        <div style={{ flexGrow: 1, height: '1px', background: 'var(--border-color)' }}></div>
                        <span style={{ padding: '0 0.75rem', fontWeight: 500, letterSpacing: '0.05em' }}>OR</span>
                        <div style={{ flexGrow: 1, height: '1px', background: 'var(--border-color)' }}></div>
                      </div>

                      <div style={{ padding: '0 0.5rem', marginBottom: '0.5rem' }}>
                        <button 
                          type="button" 
                          className="btn w-full" 
                          onClick={() => handleGoogleLoginForCheckout(checkoutPlan!)}
                          style={{ 
                            background: '#ffffff', 
                            color: '#1e293b', 
                            border: '1px solid #e2e8f0', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '0.75rem', 
                            fontWeight: 600,
                            padding: '0.85rem 1rem',
                            borderRadius: 'var(--border-radius-sm)',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s, border-color 0.2s'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                            e.currentTarget.style.borderColor = '#cbd5e1';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-3.41-4.53-6.19-4.53z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                          </svg>
                          <span>Continue with Google</span>
                        </button>
                      </div>
                      
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem', lineHeight: '1.4' }}>
                        💡 Google login is recommended for quick and instant activation setup.
                      </p>
                    </div>
                  ) : (
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
                        <label>Email Address</label>
                        <input
                          type="email"
                          disabled
                          className="form-input"
                          style={{ opacity: 0.65, cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)' }}
                          value={formData.email}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>
                          ✓ Bound to Google account: {formData.email}
                        </span>
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
                      <button type="submit" className="btn btn-primary mt-4 w-full">
                        Proceed to Activation
                      </button>
                    </form>
                  )}
                </div>
              )}

              {purchaseStep === 'payment' && (
                <div>
                  <div className="checkout-header">
                    <h3>Secure Gateway Checkout</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {checkoutPlan === 'lifetime'
                        ? 'Activate Lifetime Pro Plan License'
                        : checkoutPlan === 'cloud'
                          ? 'Activate Cloud & WhatsApp Plan License'
                          : 'Activate Starter Demo Evaluation'}
                    </p>
                  </div>

                  {paymentError && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--border-radius-sm)',
                      background: 'rgba(239, 68, 68, 0.06)',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      fontSize: '0.85rem',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 500
                    }}>
                      <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  <div className="glass-card text-center" style={{ margin: '1.5rem 0', background: 'rgba(255,255,255,0.01)', padding: '2rem 1.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)' }}>
                    {checkoutPlan !== 'trial' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '16px',
                          background: 'rgba(139, 92, 246, 0.08)',
                          border: '1px solid rgba(139, 92, 246, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#a78bfa'
                        }}>
                          <ShieldCheck size={36} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Amount Due</div>
                          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)' }}>
                            ₹{checkoutPlan === 'lifetime' ? '5,999' : '12,500'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center', marginTop: '0.5rem', fontWeight: 600 }}>
                            <Lock size={12} /> SECURE TRANSACTION VIA RAZORPAY
                          </div>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dark)', maxWidth: '280px', lineHeight: '1.4' }}>
                          Pay securely via UPI, Netbanking, Wallets, or Cards. Your license key will generate instantly upon verification.
                        </p>
                      </div>
                    ) : (
                      <div style={{ padding: '1rem 0' }}>
                        <Sparkles size={40} className="gradient-text" style={{ margin: '0 auto 1rem', display: 'block' }} />
                        <p style={{ fontWeight: 500, color: '#fff' }}>Instant 7-Day Trial Setup</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dark)', marginTop: '0.5rem' }}>No payment details required for trial registration.</p>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary w-full" onClick={() => { setPurchaseStep('form'); setPaymentError(''); }} disabled={isPaymentLoading}>
                      Back
                    </button>
                    <button className="btn btn-primary w-full" onClick={handlePaymentComplete} disabled={isPaymentLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      {isPaymentLoading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>{checkoutPlan === 'trial' ? 'Get Trial Key' : 'Pay & Activate'}</span>
                      )}
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

        {showRetrieveModal && (
          <div className="checkout-modal-overlay" onClick={() => { setShowRetrieveModal(false); setRetrievedLicenses(null); setRetrieveEmail(''); setRetrievePassword(''); }}>
            <div className="checkout-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <button
                className="close-modal-btn"
                onClick={() => {
                  setShowRetrieveModal(false);
                  setRetrievedLicenses(null);
                  setRetrieveEmail('');
                  setRetrievePassword('');
                }}
              >
                <X size={20} />
              </button>

              <div className="checkout-header">
                <h3>Retrieve License Key</h3>
                <p>Search all Pustak OS licenses registered to your email address</p>
              </div>

              {retrievedLicenses === null ? (
                <form className="checkout-form" onSubmit={handleRetrieveLicenses} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-dark)' }}>Registered Email Address</label>
                    <div className="input-with-icon-wrapper">
                      <span className="input-icon">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        required
                        className="form-input"
                        placeholder="Enter your email"
                        value={retrieveEmail}
                        onChange={(e) => setRetrieveEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-dark)' }}>Account Password</label>
                    <div className="input-with-icon-wrapper">
                      <span className="input-icon">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showRetrievePassword ? 'text' : 'password'}
                        required
                        className="form-input"
                        placeholder="Enter password"
                        value={retrievePassword}
                        onChange={(e) => setRetrievePassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowRetrievePassword(!showRetrievePassword)}
                        tabIndex={-1}
                      >
                        {showRetrievePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0.5rem' }} disabled={isRetrieving}>
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
