
import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract the destination from location state or default to admin dashboard
  const from = (location.state as { from: { pathname: string } })?.from?.pathname || '/admin/dashboard';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await signIn(email, password);
    if (!error) {
      navigate(from, { replace: true });
    }
  };
  
  if (user) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Lock className="w-12 h-12 text-purple-dark mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-purple-dark">כניסה לאזור הניהול</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-right block">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
              className="w-full text-right"
              dir="rtl"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-right block">סיסמה</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="הקלד סיסמה"
              className="w-full text-right"
              dir="rtl"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-[#4A235A] hover:bg-[#7E69AB] text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2">מתחבר...</span>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </>
            ) : (
              'התחברות'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
