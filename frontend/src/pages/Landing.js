import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Scan, Shield, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';

const Landing = () => {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);

  useEffect(() => {
    // GSAP animations
    const loadGSAP = async () => {
      const gsap = (await import('gsap')).default;
      const ScrollTrigger = (await import('gsap/ScrollTrigger')).default;
      gsap.registerPlugin(ScrollTrigger);

      // Hero animations
      const heroTl = gsap.timeline();
      heroTl
        .from('.hero-title', { 
          opacity: 0, 
          y: 50, 
          duration: 1, 
          ease: 'power3.out' 
        })
        .from('.hero-subtitle', { 
          opacity: 0, 
          y: 30, 
          duration: 0.8, 
          ease: 'power3.out' 
        }, '-=0.5')
        .from('.hero-cta', { 
          opacity: 0, 
          y: 20, 
          duration: 0.6, 
          ease: 'power3.out' 
        }, '-=0.4')
        .from('.hero-image', { 
          opacity: 0, 
          scale: 0.95, 
          duration: 1, 
          ease: 'power3.out' 
        }, '-=0.6');

      // Scan line animation
      gsap.to('.scan-line-anim', {
        y: '100%',
        duration: 2,
        repeat: -1,
        ease: 'none'
      });

      // Feature cards stagger
      gsap.from('.feature-card', {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 80%',
        },
        opacity: 0,
        y: 40,
        stagger: 0.15,
        duration: 0.8,
        ease: 'power3.out'
      });
    };

    loadGSAP();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" data-testid="nav-logo">
            <div className="w-10 h-10 border border-white/30 flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <span className="font-mono text-sm uppercase tracking-widest font-medium">MediVision</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="font-mono text-xs uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/5" data-testid="nav-login-btn">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button className="font-mono text-xs uppercase tracking-wider bg-white text-black hover:bg-gray-200" data-testid="nav-register-btn">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h1 className="hero-title font-mono text-5xl lg:text-7xl font-light uppercase tracking-tight leading-none" data-testid="hero-title">
              AI-Powered<br />
              <span className="text-white/60">Medical</span><br />
              Imaging
            </h1>
            <p className="hero-subtitle text-lg text-white/60 max-w-md leading-relaxed">
              Advanced diagnostic analysis for X-rays, MRIs, and CT scans. 
              Get instant insights with dual-view reports designed for both 
              healthcare professionals and patients.
            </p>
            <div className="hero-cta flex flex-wrap gap-4">
              <Link to="/register">
                <Button className="font-mono text-xs uppercase tracking-wider bg-white text-black hover:bg-gray-200 px-8 py-6" data-testid="hero-cta-btn">
                  Start Analysis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="font-mono text-xs uppercase tracking-wider border-white/20 text-white hover:bg-white/10 px-8 py-6" data-testid="hero-login-btn">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="hero-image relative">
            <div className="aspect-square bg-zinc-950 border border-white/10 relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1584555684040-bad07f46a21f?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" 
                alt="Medical X-ray"
                className="w-full h-full object-cover opacity-60"
              />
              {/* Scan line effect */}
              <div className="scan-line-anim absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent" />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              {/* Corner markers */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l border-t border-white/40" />
              <div className="absolute top-4 right-4 w-8 h-8 border-r border-t border-white/40" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l border-b border-white/40" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r border-b border-white/40" />
              {/* Label */}
              <div className="absolute bottom-6 left-6 font-mono text-xs uppercase tracking-widest text-white/60">
                Sample Analysis
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-32 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="font-mono text-3xl lg:text-4xl font-light uppercase tracking-wider mb-4" data-testid="features-title">
              Precision Diagnostics
            </h2>
            <p className="text-white/60 max-w-lg mx-auto">
              Powered by advanced AI to deliver accurate, instant medical image analysis
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="feature-card noir-card p-8 space-y-4" data-testid="feature-ai">
              <div className="w-12 h-12 border border-white/20 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-mono text-sm uppercase tracking-wider">AI Analysis</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                Gemini-powered diagnostic insights with clinical-grade accuracy
              </p>
            </div>
            
            <div className="feature-card noir-card p-8 space-y-4" data-testid="feature-dual">
              <div className="w-12 h-12 border border-white/20 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-mono text-sm uppercase tracking-wider">Dual View</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                Technical reports for doctors, simplified summaries for patients
              </p>
            </div>
            
            <div className="feature-card noir-card p-8 space-y-4" data-testid="feature-secure">
              <div className="w-12 h-12 border border-white/20 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-mono text-sm uppercase tracking-wider">Secure</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                End-to-end encryption with HIPAA-compliant data handling
              </p>
            </div>
            
            <div className="feature-card noir-card p-8 space-y-4" data-testid="feature-types">
              <div className="w-12 h-12 border border-white/20 flex items-center justify-center">
                <Scan className="w-5 h-5" />
              </div>
              <h3 className="font-mono text-sm uppercase tracking-wider">Multi-Type</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                Support for X-rays, MRIs, CT scans and more imaging modalities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-mono text-3xl lg:text-5xl font-light uppercase tracking-wider mb-6" data-testid="cta-title">
            Ready to Transform<br />
            <span className="text-white/60">Your Diagnostics?</span>
          </h2>
          <p className="text-white/60 max-w-lg mx-auto mb-10">
            Join healthcare professionals using AI-powered analysis for faster, more accurate diagnoses.
          </p>
          <Link to="/register">
            <Button className="font-mono text-xs uppercase tracking-wider bg-white text-black hover:bg-gray-200 px-12 py-6" data-testid="cta-btn">
              Create Free Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
