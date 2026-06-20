import React from 'react';
import { Link } from 'react-router-dom';
import LandingNavbar from '../components/LandingNavbar';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-base font-body text-t1 overflow-x-hidden">
      <LandingNavbar />

      {/* SECTION 2: Hero */}
      <section className="relative min-h-screen pt-24 pb-16 flex items-center bg-grid-pattern">
        <div className="max-w-7xl mx-auto px-6 w-full flex flex-col lg:flex-row items-center gap-16">
          
          {/* LEFT COLUMN */}
          <div className="flex-1 max-w-2xl lg:max-w-[55%] z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-d border border-cyan-b text-[11px] font-mono text-cyan mb-6 animate-fade-in-down" style={{ animationDelay: '0ms' }}>
              <span>⚡</span> Powered by Google Places + Claude AI
            </div>
            
            <h1 className="font-display text-[32px] md:text-[48px] font-bold leading-[1.1] mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="text-white">Discover Industrial</div>
              <div className="text-gradient">Leads at Scale</div>
            </h1>
            
            <p className="text-t2 text-[16px] max-w-md leading-[1.7] mb-8 animate-fade-in" style={{ animationDelay: '250ms' }}>
              Select any MIDC industrial zone. Our AI scans registered businesses, scores every lead, and delivers a ranked pipeline — in seconds, not days.
            </p>
            
            <div className="flex flex-wrap items-center gap-3 mt-8 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
              <Link to="/register" className="bg-gradient-btn px-[28px] py-[14px] rounded-xl font-display font-bold hover:opacity-90 hover:shadow-lg hover:shadow-cyan/20 transition-all">
                Start for Free →
              </Link>
              <Link to={isAuthenticated ? "/dashboard" : "/login"} className="px-[28px] py-[14px] rounded-xl border border-border-l text-t2 hover:border-cyan hover:text-cyan transition-colors">
                View Live Demo
              </Link>
            </div>
            
            <div className="mt-10 flex flex-wrap items-center gap-2 text-[12px] text-t3 font-mono animate-fade-in" style={{ animationDelay: '450ms' }}>
              <span>🏭 18+ MIDC Zones</span>
              <span>·</span>
              <span>🤖 AI-Scored Leads</span>
              <span>·</span>
              <span>📊 CSV & Excel Export</span>
            </div>
          </div>
          
          {/* RIGHT COLUMN */}
          <div className="flex-1 w-full max-w-[45%] relative animate-fade-in-left" style={{ animationDelay: '200ms' }}>
            <div className="relative animate-float" style={{ boxShadow: '0 0 80px rgba(34,211,238,0.08)' }}>
              
              {/* Back cards for depth */}
              <div className="absolute inset-0 bg-card border border-border-l rounded-2xl opacity-40 blur-sm translate-y-[20px] translate-x-[20px]"></div>
              <div className="absolute inset-0 bg-card border border-border-l rounded-2xl opacity-60 blur-xs translate-y-[10px] translate-x-[10px]"></div>

              {/* Main mock card */}
              <div className="relative bg-card border border-border-l rounded-2xl p-5 shadow-2xl z-10">
                <div className="flex items-start gap-4 mb-4">
                  {/* Score ring mock */}
                  <div className="relative w-16 h-16 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-dim fill-none stroke-current" strokeWidth="3" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-lead-red fill-none stroke-current" strokeWidth="3" strokeDasharray="87, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[14px] font-bold text-white">87</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-white text-[16px]">Vijay Engineering Works Pvt. Ltd</h3>
                    <p className="text-[12px] text-t3 mt-0.5">Automotive Components · Nashik MIDC</p>
                    <div className="inline-block mt-2 px-2 py-0.5 rounded bg-red-900/30 border border-lead-red text-lead-red text-[11px] font-bold uppercase">
                      🔥 Hot
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 rounded bg-bg-hover text-t2 text-[11px] border border-dim">Est. 2003</span>
                  <span className="px-2 py-1 rounded bg-bg-hover text-t2 text-[11px] border border-dim">50-200 emp</span>
                  <span className="px-2 py-1 rounded bg-bg-hover text-t2 text-[11px] border border-dim">₹8-15 Cr</span>
                </div>

                <p className="text-[12px] text-t2 leading-relaxed mb-4">
                  Leading manufacturer of precision-machined auto parts serving Tier-1 OEMs. Strong growth signal detected.
                </p>

                <div className="mb-4">
                  <div className="text-[10px] font-mono uppercase text-t3 tracking-wider mb-2">Key Insights</div>
                  <ul className="text-[12px] text-t2 space-y-1 pl-4 list-disc marker:text-cyan">
                    <li>Supplies to Bajaj Auto & Mahindra ecosystem</li>
                    <li>Recently expanded facility by 40%</li>
                    <li>Active on 3 procurement portals</li>
                  </ul>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-border-l text-[12px] text-t1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan">📞</span> +91 98220 XXXXX
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan">🌐</span> vijayengg.com
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Stats Bar */}
      <section className="w-full bg-surface border-y border-dim py-[28px]">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between items-center gap-8 md:gap-0">
          <div className="flex flex-col items-center flex-1">
            <span className="font-display text-[32px] font-bold text-lead-cyan">18+</span>
            <span className="font-body text-[13px] text-t2">MIDC Zones Covered</span>
          </div>
          <div className="hidden md:block w-px h-[40px] bg-dim"></div>
          <div className="flex flex-col items-center flex-1">
            <span className="font-display text-[32px] font-bold text-lead-cyan">500+</span>
            <span className="font-body text-[13px] text-t2">Businesses per Search</span>
          </div>
          <div className="hidden md:block w-px h-[40px] bg-dim"></div>
          <div className="flex flex-col items-center flex-1">
            <span className="font-display text-[32px] font-bold text-lead-cyan">&lt; 30s</span>
            <span className="font-body text-[13px] text-t2">Lead Generation Time</span>
          </div>
          <div className="hidden md:block w-px h-[40px] bg-dim"></div>
          <div className="flex flex-col items-center flex-1">
            <span className="font-display text-[32px] font-bold text-lead-cyan">AI-Scored</span>
            <span className="font-body text-[13px] text-t2">Every Lead, Automatically</span>
          </div>
        </div>
      </section>

      {/* SECTION 4: Features */}
      <section id="features" className="py-[80px]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-[12px] font-mono text-t3 uppercase tracking-wide mb-4">PLATFORM FEATURES</div>
            <h2 className="font-display text-[36px] text-white font-bold mb-4">Everything your sales team needs</h2>
            <p className="text-t2 text-[16px]">From discovery to export — one intelligent platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard 
              icon="🏭"
              title="Instant Zone Discovery"
              desc="Select any MIDC zone and instantly surface every registered business — no manual scraping, no outdated directories."
            />
            <FeatureCard 
              icon="🤖"
              title="AI Lead Scoring"
              desc="Claude AI analyzes each company and assigns a 0–100 score based on growth signals, industry fit, and contact quality."
            />
            <FeatureCard 
              icon="🗺️"
              title="Interactive Map View"
              desc="See every lead plotted on a live Leaflet map. Color-coded by tier — click any pin for instant contact details."
            />
            <FeatureCard 
              icon="📊"
              title="Export & Integrate"
              desc="One-click CSV and Excel export. Drop leads directly into your CRM or share with your entire sales team."
            />
          </div>
        </div>
      </section>

      {/* SECTION 5: How It Works */}
      <section id="how-it-works" className="bg-surface py-[80px]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-[12px] font-mono text-t3 uppercase tracking-wide mb-4">HOW IT WORKS</div>
            <h2 className="font-display text-[36px] text-white font-bold mb-4">From zone to pipeline in 3 steps</h2>
          </div>

          <div className="flex flex-col md:flex-row items-start justify-between gap-8 relative">
            <StepCard number="01" icon="🏭" title="Select Your Zone" desc="Pick any MIDC industrial area from 18+ zones across Maharashtra. Filter by industry type." />
            
            <div className="hidden md:block flex-1 mt-[40px]">
              <svg className="w-full text-lead-cyan opacity-40" height="24" viewBox="0 0 100 24" preserveAspectRatio="none">
                <line x1="0" y1="12" x2="100" y2="12" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <polygon points="100,12 90,6 90,18" fill="currentColor" />
              </svg>
            </div>
            
            <StepCard number="02" icon="⚡" title="AI Scans & Scores" desc="Our engine hits Google Places, deduplicates records, cleans contact data, and scores every lead with AI." isHighlight />
            
            <div className="hidden md:block flex-1 mt-[40px]">
              <svg className="w-full text-lead-cyan opacity-40" height="24" viewBox="0 0 100 24" preserveAspectRatio="none">
                <line x1="0" y1="12" x2="100" y2="12" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <polygon points="100,12 90,6 90,18" fill="currentColor" />
              </svg>
            </div>
            
            <StepCard number="03" icon="📤" title="Export & Convert" desc="Download your scored lead list as CSV or Excel. Start calling Hot leads first." />
          </div>
        </div>
      </section>

      {/* SECTION 6: Zones Preview */}
      <section id="zones" className="py-[80px]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-[32px] text-white font-bold mb-4">Covering Maharashtra's Top Industrial Corridors</h2>
          <p className="text-t2 text-[16px] mb-12">From Nashik's auto hubs to Pune's pharma belt.</p>

          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {['Nashik MIDC – Ambad', 'Nashik MIDC – Satpur', 'Sinnar MIDC', 'Chakan MIDC Pune', 'Pimpri-Chinchwad MIDC', 'Ranjangaon MIDC', 'Waluj MIDC Aurangabad', 'Butibori MIDC Nagpur', 'Thane-Belapur MIDC', 'Tarapur MIDC', 'Kolhapur MIDC Shiroli', 'Solapur MIDC', '+ 6 more'].map((zone, i) => (
              <span key={i} className="bg-card border border-dim rounded-full px-4 py-2 text-t2 font-mono text-[12px] hover:border-cyan hover:text-cyan transition-colors cursor-default">
                {zone}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: Final CTA */}
      <section className="relative w-full py-[100px] border-t border-dim overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.05)_0%,transparent_70%)]"></div>
        <div className="relative max-w-2xl mx-auto px-6 text-center z-10">
          <h2 className="font-display text-[40px] text-white font-bold mb-4">Ready to fill your pipeline?</h2>
          <p className="text-[16px] text-t2 mb-8 mx-auto max-w-sm">
            Join sales teams using geoLead AI to find and convert industrial clients faster than ever before.
          </p>
          <Link to="/register" className="inline-block bg-gradient-btn px-[36px] py-[16px] rounded-xl font-display font-bold text-[16px] hover:opacity-90 transition-opacity mb-4">
            Get Started Free →
          </Link>
          <div className="text-[12px] text-t3 font-mono">No credit card required · Free to use</div>
        </div>
      </section>

      {/* SECTION 8: Footer */}
      <footer className="bg-surface border-t border-dim py-[32px]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-[16px]">
                <span className="text-lead-cyan">geo</span>
                <span className="text-white">Lead</span>
                <span className="text-gradient"> AI</span>
              </span>
            </div>
            
            <div className="flex gap-6 text-[14px] text-t2">
              <a href="#features" className="hover:text-t1">Features</a>
              <a href="#zones" className="hover:text-t1">Zones</a>
              <Link to="/login" className="hover:text-t1">Login</Link>
            </div>
            
            <div className="hidden md:block w-[100px]"></div>
          </div>
          
          <div className="text-center text-[12px] text-t3 font-mono">
            © 2025 geoLead AI · Built for Hackathon 2025 · Powered by Google Places & Claude AI
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-card border border-dim rounded-2xl p-6 hover:border-border-l hover:-translate-y-0.5 hover:shadow-xl transition-all group">
      <div className="w-12 h-12 bg-cyan-d rounded-xl flex items-center justify-center text-[24px] mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-display text-white text-[16px] font-bold mb-3">{title}</h3>
      <p className="font-body text-t2 text-[13px] leading-[1.7]">{desc}</p>
    </div>
  );
}

function StepCard({ number, icon, title, desc, isHighlight }) {
  return (
    <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start max-w-[280px]">
      <div className={`font-display text-[48px] font-bold mb-2 ${isHighlight ? 'text-lead-cyan' : 'text-border-l'}`}>
        {number}
      </div>
      <div className="text-[24px] mb-4">{icon}</div>
      <h3 className="font-display text-white text-[18px] font-bold mb-3">{title}</h3>
      <p className="font-body text-t2 text-[14px] leading-relaxed">{desc}</p>
    </div>
  );
}
