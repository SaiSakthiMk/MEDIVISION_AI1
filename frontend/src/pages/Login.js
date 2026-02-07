import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scan, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // GSAP animations
    const loadGSAP = async () => {
      const gsap = (await import('gsap')).default;
      
      gsap.from('.auth-card', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out'
      });
      
      gsap.from('.auth-form > *', {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power3.out',
        delay: 0.3
      });
    };

    loadGSAP();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left Panel - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img 
          src="https://images.unsplash.com/photo-1631563019676-dade0dbdb8fc?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
          alt="Medical MRI"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black" />
        <div className="relative z-10 p-12 flex flex-col justify-between">
          <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
            <div className="w-10 h-10 border border-white/30 flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <span className="font-mono text-sm uppercase tracking-widest font-medium">MediVision</span>
          </Link>
          
          <div>
            <h2 className="font-mono text-4xl font-light uppercase tracking-wider mb-4">
              Advanced<br />
              Diagnostics
            </h2>
            <p className="text-white/60 max-w-sm">
              AI-powered medical imaging analysis at your fingertips
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="auth-card w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-12" data-testid="mobile-logo">
            <div className="w-10 h-10 border border-white/30 flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <span className="font-mono text-sm uppercase tracking-widest font-medium">MediVision</span>
          </Link>

          <div className="mb-10">
            <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors" data-testid="back-link">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <h1 className="font-mono text-3xl font-light uppercase tracking-wider mb-2 text-white" data-testid="login-title">
              Sign In
            </h1>
            <p className="text-white/70">
              Access your diagnostic dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wider text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-900/50 border border-white/30 rounded px-4 py-3 text-white placeholder:text-white/40 focus:border-white focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="doctor@hospital.com"
                required
                data-testid="login-email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wider text-white">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-900/50 border border-white/30 rounded px-4 py-3 pr-10 text-white placeholder:text-white/40 focus:border-white focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Enter your password"
                  required
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                  data-testid="toggle-password-btn"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-mono text-xs uppercase tracking-wider bg-white text-black hover:bg-gray-200 py-6 mt-8"
              data-testid="login-submit-btn"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-white/50 text-sm mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-white hover:underline" data-testid="register-link">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
