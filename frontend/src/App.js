import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import ScanHistory from "@/pages/ScanHistory";
import ScanDetail from "@/pages/ScanDetail";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-mono text-sm uppercase tracking-widest">
          Loading...
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-mono text-sm uppercase tracking-widest">
          Loading...
        </div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/history" 
        element={
          <ProtectedRoute>
            <ScanHistory />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scan/:scanId" 
        element={
          <ProtectedRoute>
            <ScanDetail />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <div className="App min-h-screen bg-black">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#050505',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                fontFamily: 'JetBrains Mono, monospace',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
