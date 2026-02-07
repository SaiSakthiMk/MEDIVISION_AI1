import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scan, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    const loadGSAP = async () => {
      const gsap = (await import('gsap')).default;
      gsap.from('.auth-card', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out'
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-black">
        <div className="auth-card w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-12" data-testid="mobile-logo">
            <div className="w-10 h-10 border border-white/30 flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <span className="font-mono text-sm uppercase tracking-widest font-medium">MediVision</span>
          </Link>

          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors" data-testid="back-link">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <h1 className="font-mono text-3xl font-light uppercase tracking-wider mb-2 text-white" data-testid="login-title">
              Sign In
            </h1>
            <p className="text-gray-400">
              Access your diagnostic dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block font-mono text-xs uppercase tracking-wider text-white mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border-2 border-zinc-700 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:outline-none transition-colors"
                placeholder="doctor@hospital.com"
                required
                data-testid="login-email-input"
              />
            </div>

            <div>
              <label htmlFor="password" className="block font-mono text-xs uppercase tracking-wider text-white mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border-2 border-zinc-700 rounded-md px-4 py-3 pr-12 text-white placeholder-gray-500 focus:border-white focus:outline-none transition-colors"
                  placeholder="Enter your password"
                  required
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  data-testid="toggle-password-btn"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-mono text-sm uppercase tracking-wider bg-white text-black hover:bg-gray-200 py-6 mt-4 disabled:opacity-50"
              data-testid="login-submit-btn"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-white hover:underline font-medium" data-testid="register-link">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
