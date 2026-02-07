import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Scan, Shield, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';

const Landing = () => {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" data-testid="nav-logo">
            <div className="w-10 h-10 border border-gray-300 flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <span className="font-mono text-sm uppercase tracking-widest font-medium">MediVision</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="font-mono text-xs uppercase tracking-wider" data-testid="nav-login-btn">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button className="font-mono text-xs uppercase tracking-wider bg-black text-white hover:bg-gray-800" data-testid="nav-register-btn">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h1 className="font-mono text-5xl lg:text-7xl font-light uppercase tracking-tight leading-none" data-testid="hero-title">
              AI-Powered<br />
              <span className="text-gray-500">Medical</span><br />
              Imaging
            </h1>
            <p className="text-lg text-gray-600 max-w-md leading-relaxed">
              Advanced diagnostic analysis for X-rays, MRIs, and CT scans. 
              Get instant insights with dual-view reports designed for both 
              healthcare professionals and patients.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button className="font-mono text-xs uppercase tracking-wider bg-black text-white hover:bg-gray-800 px-8 py-6" data-testid="hero-cta-btn">
                  Start Analysis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="font-mono text-xs uppercase tracking-wider border-gray-300 px-8 py-6" data-testid="hero-login-btn">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-square bg-gray-100 border border-gray-200 relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1584555684040-bad07f46a21f?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" 
                alt="Medical X-ray"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-black/40" />
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-black/40" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-black/40" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-black/40" />
              <div className="absolute bottom-6 left-6 font-mono text-xs uppercase tracking-widest text-black bg-white/80 px-2 py-1">
                Sample Analysis
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="font-mono text-3xl lg:text-4xl font-light uppercase tracking-wider mb-4" data-testid="features-title">
              Precision Diagnostics
            </h2>
            <p className="text-gray-600 max-w-lg mx-auto">
              Powered by advanced AI to deliver accurate, instant medical image analysis
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 border border-gray-200 bg-gray-50 space-y-4" data-testid="feature-ai">
              <div className="w-12 h-12 border border-gray-300 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-mono text-sm uppercase tracking-wider">AI Analysis</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Gemini-powered diagnostic insights with clinical-grade accuracy
              </p>
            </div>
            
            <div className="p-8 border border-gray-200 bg-gray-50 space-y-4" data-testid="feature-dual">
              <div className="w-12 h-12 border border-gray-300 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-mono text-sm uppercase tracking-wider">Dual View</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Technical reports for doctors, simplified summaries for patients
              </p>
            </div>
            
            <div className="p-8 border border-gray-200 bg-gray-50 space-y-4" data-testid="feature-secure">
              <div className="w-12 h-12 border border-gray-300 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-mono text-sm uppercase tracking-wider">Secure</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                End-to-end encryption with HIPAA-compliant data handling
              </p>
            </div>
            
            <div className="p-8 border border-gray-200 bg-gray-50 space-y-4" data-testid="feature-types">
              <div className="w-12 h-12 border border-gray-300 flex items-center justify-center">
                <Scan className="w-5 h-5" />
              </div>
              <h3 className="font-mono text-sm uppercase tracking-wider">Multi-Type</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Support for X-rays, MRIs, CT scans and more imaging modalities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-mono text-3xl lg:text-5xl font-light uppercase tracking-wider mb-6" data-testid="cta-title">
            Ready to Transform<br />
            <span className="text-gray-500">Your Diagnostics?</span>
          </h2>
          <p className="text-gray-600 max-w-lg mx-auto mb-10">
            Join healthcare professionals using AI-powered analysis for faster, more accurate diagnoses.
          </p>
          <Link to="/register">
            <Button className="font-mono text-xs uppercase tracking-wider bg-black text-white hover:bg-gray-800 px-12 py-6" data-testid="cta-btn">
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
