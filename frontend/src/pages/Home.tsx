import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState } from '../redux/store/store';
import { UserPortalView } from '../components/user.portal/SideBar';
import '../styles/landing.css';

// ─── Scroll Reveal Hook ─────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ─── Navbar ─────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <a href="/" className="nav-logo">
          <div className="nav-logo-icon">
            <img src="/SmartWalletLogo.svg" width="20" height="20" alt="Smart Wallet Logo" />
          </div>
          Smart Wallet
        </a>

        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <li><a onClick={() => scrollTo('features')}>Features</a></li>
          <li><a onClick={() => scrollTo('how-it-works')}>How It Works</a></li>
          <li><a onClick={() => scrollTo('pricing')}>Pricing</a></li>
          <li><a onClick={() => scrollTo('faq')}>FAQ</a></li>
        </ul>

        <div className="nav-actions">
          <Link to="/login" className="btn-ghost btn-sm"><span>Sign In</span></Link>
          <Link to="/register" className="btn-primary btn-sm"><span>Get Started</span></Link>
          <button className="mobile-nav-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="hero-section">
      {/* Ambient glows */}
      <div className="glow-blob glow-purple" style={{ width: 600, height: 600, top: '-10%', left: '-10%' }} />
      <div className="glow-blob glow-blue" style={{ width: 500, height: 500, bottom: '-15%', right: '-5%' }} />
      <div className="grid-overlay" />

      <div className="hero-content">
        <div>
          <div className="hero-badge reveal">
            <span className="hero-badge-dot" />
            AI-Powered Financial Management
          </div>

          <h1 className="hero-title reveal reveal-delay-1">
            Master Your Money<br />
            with <span className="gradient-text">Smart Wallet</span>
          </h1>

          <p className="hero-subtitle reveal reveal-delay-2">
            Track expenses, set budgets, manage loans, and get AI-powered
            insights — all in one beautifully simple dashboard. Take control
            of your financial future today.
          </p>

          <div className="hero-cta-group reveal reveal-delay-3">
            <Link to="/register" className="btn-primary">
              <span>Start Free</span>
              <span style={{ position: 'relative', zIndex: 1 }}>→</span>
            </Link>
            <a href="#features" className="btn-ghost" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>
              <span>Explore Features</span>
            </a>
          </div>

          <div className="hero-stats reveal reveal-delay-4">
            <div>
              <div className="hero-stat-number gradient-text-cyan">50K+</div>
              <div className="hero-stat-label">Active Users</div>
            </div>
            <div>
              <div className="hero-stat-number gradient-text-cyan">$2.4B</div>
              <div className="hero-stat-label">Tracked</div>
            </div>
            <div>
              <div className="hero-stat-number gradient-text-cyan">4.9★</div>
              <div className="hero-stat-label">User Rating</div>
            </div>
          </div>
        </div>

        <div className="hero-visual reveal reveal-delay-2">
          <div className="hero-mockup-wrapper">
            <img src="/images/landing/dashboard-mockup.png" alt="Smart Wallet Dashboard" className="hero-mockup" />
            <img src="/images/landing/hero-wallet.png" alt="" className="hero-wallet-float" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '/images/landing/feature-accounts.png',
    title: 'Multi-Account Tracking',
    desc: 'Manage cash, bank accounts, credit cards, and investments in one unified view with real-time balance updates.',
  },
  {
    icon: '/images/landing/feature-budget.png',
    title: 'Smart Budgeting',
    desc: 'Set monthly budgets per category, track spending in real time, and get alerts before you overspend.',
  },
  {
    icon: '/images/landing/feature-schedule.png',
    title: 'Scheduled Payments',
    desc: 'Never miss a bill again. Automate recurring transactions and get reminders for upcoming payments.',
  },
  {
    icon: '/images/landing/feature-loan.png',
    title: 'Loan Management',
    desc: 'Track borrowed and lent money with structured repayment plans, interest calculations, and progress tracking.',
  },
  {
    icon: '/images/landing/feature-ai.png',
    title: 'AI Financial Advisor',
    desc: 'Get personalized spending insights, savings tips, and budget recommendations powered by Google Gemini AI.',
  },
  {
    icon: '/images/landing/feature-collab.png',
    title: 'Collaborative Spaces',
    desc: 'Share financial spaces with family or roommates. Track shared expenses and split costs effortlessly.',
  },
];

function Features() {
  return (
    <section id="features" className="features-section">
      <div className="glow-blob glow-cyan" style={{ width: 400, height: 400, top: '20%', right: '-10%', opacity: 0.2 }} />
      <div className="section-container">
        <div className="reveal">
          <p className="section-label">Features</p>
          <h2 className="section-title">
            Everything you need to<br />
            <span className="gradient-text">manage your finances</span>
          </h2>
          <p className="section-subtitle">
            A comprehensive toolkit designed for modern financial management —
            from daily expense tracking to advanced AI-powered insights.
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className={`feature-card glass-card reveal reveal-delay-${i + 1}`}>
              <div className="feature-card-icon">
                <img src={f.icon} alt={f.title} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ────────────────────────────────────────────────
const STEPS = [
  { num: '1', title: 'Create Your Account', desc: 'Sign up in seconds with your email or Google account. Choose your currency and set up your first space.' },
  { num: '2', title: 'Add Your Finances', desc: 'Create spaces for bank accounts, cash, credit cards, or loans. Import or manually add your transactions.' },
  { num: '3', title: 'Get Smart Insights', desc: 'View rich dashboards, track budgets, and let our AI analyze your spending patterns to save you money.' },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="how-section">
      <div className="section-container">
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 72 }}>
          <p className="section-label">How It Works</p>
          <h2 className="section-title">
            Get started in <span className="gradient-text">3 simple steps</span>
          </h2>
        </div>

        <div className="how-grid">
          {STEPS.map((s, i) => (
            <div key={i} className={`how-step reveal reveal-delay-${i + 1}`}>
              <div className="how-step-number">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ─────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    featured: false,
    features: [
      'Up to 3 financial spaces',
      'Basic transaction tracking',
      'Monthly spending reports',
      'Category management',
      'Email notifications',
    ],
  },
  {
    name: 'Plus',
    price: '$4.99',
    period: '/month',
    featured: true,
    features: [
      'Unlimited financial spaces',
      'Smart budgeting tools',
      'Scheduled transactions',
      'AI Financial Advisor chat',
      'Collaborative spaces',
      'Advanced reports & charts',
    ],
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    featured: false,
    features: [
      'Everything in Plus',
      'Loan management suite',
      'WhatsApp AI assistant',
      'Priority support',
      'Data export (CSV / PDF)',
      'Custom categories & tags',
    ],
  },
];

function Pricing() {
  return (
    <section id="pricing" className="pricing-section">
      <div className="glow-blob glow-purple" style={{ width: 500, height: 500, top: '10%', left: '-15%', opacity: 0.2 }} />
      <div className="section-container">
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 72 }}>
          <p className="section-label">Pricing</p>
          <h2 className="section-title">
            Simple, transparent <span className="gradient-text">pricing</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Start free and upgrade as your financial needs grow.
            No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="pricing-grid">
          {PLANS.map((plan, i) => (
            <div key={i} className={`pricing-card glass-card reveal reveal-delay-${i + 1} ${plan.featured ? 'featured' : ''}`}>
              <p className="pricing-plan-name">{plan.name}</p>
              <p className="pricing-price">{plan.price}</p>
              <p className="pricing-price-period">{plan.period}</p>
              <ul className="pricing-features">
                {plan.features.map((f, fi) => (
                  <li key={fi}>
                    <span className="pricing-check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={plan.featured ? 'btn-primary' : 'btn-ghost'}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>{plan.price === 'Free' ? 'Get Started' : 'Start Free Trial'}</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Is Smart Wallet really free to use?', a: 'Yes! Our Starter plan is completely free and includes essential features like transaction tracking, spending reports, and up to 3 financial spaces. You can upgrade anytime for advanced features.' },
  { q: 'How does the AI Financial Advisor work?', a: 'Our AI advisor uses Google Gemini to analyze your real financial data — spending patterns, budget usage, and account balances — to provide personalized insights and actionable advice in a conversational chat.' },
  { q: 'Can I share my financial spaces with others?', a: 'Absolutely! Collaborative spaces let you share financial tracking with family members, roommates, or business partners. Each member can add transactions and view shared dashboards.' },
  { q: 'Is my financial data secure?', a: 'Your data is encrypted in transit and at rest. We use industry-standard JWT authentication, and we never share your financial data with third parties. Your privacy is our top priority.' },
  { q: 'Can I access Smart Wallet on WhatsApp?', a: 'With our Pro plan, you can interact with the AI Financial Advisor directly through WhatsApp. Link your number, and you can ask about your finances, check balances, and get spending alerts on the go.' },
  { q: 'What currencies are supported?', a: 'Smart Wallet supports all major world currencies. You choose your preferred currency during registration, and all your financial data is tracked and displayed in that currency.' },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="faq-section">
      <div className="section-container">
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 72 }}>
          <p className="section-label">FAQ</p>
          <h2 className="section-title">
            Frequently asked <span className="gradient-text">questions</span>
          </h2>
        </div>

        <div className="faq-list">
          {FAQS.map((faq, i) => (
            <div key={i} className={`faq-item glass reveal reveal-delay-${Math.min(i + 1, 4)} ${openIndex === i ? 'open' : ''}`}>
              <button className="faq-question" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                {faq.q}
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-answer">
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="cta-section">
      <div className="cta-box reveal">
        <h2 className="cta-title">
          Ready to take control of<br />
          your <span className="gradient-text">financial future</span>?
        </h2>
        <p className="cta-subtitle">
          Join thousands of users who have transformed how they manage money.
        </p>
        <Link to="/register" className="btn-primary" style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
          <span>Get Started — It's Free</span>
          <span style={{ position: 'relative', zIndex: 1 }}>→</span>
        </Link>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────
function Footer() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="landing-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="/" className="nav-logo" style={{ marginBottom: 4 }}>
              <div className="nav-logo-icon">
                <img src="/SmartWalletLogo.svg" width="18" height="18" alt="Smart Wallet Logo" />
              </div>
              Smart Wallet
            </a>
            <p>Your all-in-one financial companion. Track, budget, and grow your wealth with AI-powered intelligence.</p>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <a onClick={() => scrollTo('features')} style={{ cursor: 'pointer' }}>Features</a>
            <a onClick={() => scrollTo('pricing')} style={{ cursor: 'pointer' }}>Pricing</a>
            <a onClick={() => scrollTo('faq')} style={{ cursor: 'pointer' }}>FAQ</a>
          </div>

          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Create Account</Link>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Smart Wallet. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="#" style={{ color: 'rgba(228,228,239,0.4)', transition: 'color 0.3s' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 4.557a9.83 9.83 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724 9.864 9.864 0 0 1-3.127 1.195 4.916 4.916 0 0 0-8.38 4.482A13.944 13.944 0 0 1 1.671 3.149a4.916 4.916 0 0 0 1.523 6.563 4.897 4.897 0 0 1-2.229-.616v.062a4.918 4.918 0 0 0 3.946 4.827 4.902 4.902 0 0 1-2.224.084 4.918 4.918 0 0 0 4.6 3.42A9.868 9.868 0 0 1 0 19.54a13.905 13.905 0 0 0 7.548 2.212c9.057 0 14.01-7.504 14.01-14.01 0-.213-.005-.425-.014-.636A10.012 10.012 0 0 0 24 4.557z" /></svg>
            </a>
            <a href="#" style={{ color: 'rgba(228,228,239,0.4)', transition: 'color 0.3s' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.11.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Home Component ─────────────────────────────────────────
function Home() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const spaces = useSelector((state: RootState) => state.auth.spaces);
  const navigate = useNavigate();

  useScrollReveal();

  // If authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && spaces && spaces.length > 0) {
      const space = spaces[0];
      navigate(`/user-portal/${space.type}/${space.id}/${UserPortalView.DASHBOARD}`);
    }
  }, [isAuthenticated, spaces, navigate]);

  // Don't render landing page if authenticated (will redirect)
  if (isAuthenticated) return null;

  return (
    <div className="landing-page">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  );
}

export default Home;
