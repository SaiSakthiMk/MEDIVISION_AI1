import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scan, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex">
      {/* Left Panel - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-100">
        <img 
          src="https://images.unsplash.com/photo-1584555613497-9ecf9dd06f68?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
          alt="Medical X-ray"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white" />
        <div className="relative z-10 p-12 flex flex-col justify-between">
          <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
            <div className="w-10 h-10 border border-black/30 bg-white flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <span className="font-mono text-sm uppercase tracking-widest font-medium">MediVision</span>
          </Link>
          
          <div className="bg-white p-6">
            <h2 className="font-mono text-4xl font-light uppercase tracking-wider mb-4">
              Join<br />
              MediVision
            </h2>
            <p className="text-gray-600 max-w-sm">
              Create your account and start analyzing medical images with AI
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-12" data-testid="mobile-logo">
            <div className="w-10 h-10 border border-gray-300 flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <span className="font-mono text-sm uppercase tracking-widest font-medium">MediVision</span>
          </Link>

          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-black text-sm mb-6" data-testid="back-link">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <h1 className="font-mono text-3xl font-light uppercase tracking-wider mb-2" data-testid="register-title">
              Create Account
            </h1>
            <p className="text-gray-600">
              Start your diagnostic journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block font-mono text-xs uppercase tracking-wider text-black mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-100 border-2 border-gray-300 rounded-md px-4 py-3 text-black placeholder-gray-500 focus:border-black focus:outline-none"
                placeholder="Dr. John Smith"
                required
                data-testid="register-name-input"
              />
            </div>

            <div>
              <label htmlFor="email" className="block font-mono text-xs uppercase tracking-wider text-black mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-100 border-2 border-gray-300 rounded-md px-4 py-3 text-black placeholder-gray-500 focus:border-black focus:outline-none"
                placeholder="doctor@hospital.com"
                required
                data-testid="register-email-input"
              />
            </div>

            <div>
              <label htmlFor="password" className="block font-mono text-xs uppercase tracking-wider text-black mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-100 border-2 border-gray-300 rounded-md px-4 py-3 pr-12 text-black placeholder-gray-500 focus:border-black focus:outline-none"
                  placeholder="Min. 6 characters"
                  required
                  data-testid="register-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                  data-testid="toggle-password-btn"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-mono text-sm uppercase tracking-wider bg-black text-white hover:bg-gray-800 py-6 mt-4 disabled:opacity-50"
              data-testid="register-submit-btn"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-black hover:underline font-medium" data-testid="login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
