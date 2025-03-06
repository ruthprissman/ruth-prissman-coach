import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, UserPlus, KeyRound, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
  password: z.string().min(6, "סיסמה חייבת להיות לפחות 6 תווים"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
});

type FormValues = z.infer<typeof formSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const Login: React.FC = () => {
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [adminExists, setAdminExists] = useState(false);
  const { signIn, createAdminUser, resetPassword, checkAdminExists, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  console.log('Login page rendered. Current auth state:', { user: !!user, isLoading });
  console.log('Current location state:', location.state);
  
  // Extract the destination from location state or default to admin dashboard
  const from = (location.state as { from: { pathname: string } })?.from?.pathname || '/admin/dashboard';
  
  useEffect(() => {
    console.log('Login useEffect running, checking admin...');
    const checkAdmin = async () => {
      try {
        const exists = await checkAdminExists();
        console.log('Admin exists check result:', exists);
        setAdminExists(exists);
      } catch (error) {
        console.error('Error checking if admin exists:', error);
      }
    };
    
    checkAdmin();
  }, [checkAdminExists]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    console.log('Form submitted:', isCreatingAdmin ? 'Creating admin' : 'Signing in');
    
    if (isCreatingAdmin) {
      const { error } = await createAdminUser(data.email, data.password);
      if (!error) {
        setIsCreatingAdmin(false);
        form.reset();
      }
    } else {
      const { error } = await signIn(data.email, data.password);
      if (!error) {
        console.log('Sign in successful, navigating to:', from);
        navigate(from, { replace: true });
      }
    }
  };
  
  const onResetPasswordSubmit = async (data: ResetPasswordFormValues) => {
    const { error } = await resetPassword(data.email);
    if (!error) {
      resetForm.reset();
      setIsForgotPassword(false);
    }
  };
  
  if (user) {
    console.log('User already authenticated, redirecting to dashboard');
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          {isForgotPassword ? (
            <>
              <KeyRound className="w-12 h-12 text-purple-dark mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-purple-dark">שחזור סיסמה</h1>
              <p className="text-gray-600 mt-2">הזן את כתובת האימייל שלך כדי לקבל קישור לאיפוס הסיסמה</p>
            </>
          ) : isCreatingAdmin ? (
            <>
              <UserPlus className="w-12 h-12 text-purple-dark mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-purple-dark">יצירת משתמש מנהל</h1>
              {adminExists && (
                <p className="text-red-500 mt-2">
                  קיים כבר מנ��ל במערכת. אם שכחת את הסיסמה, ניתן לאפס אותה דרך 'שחזור סיסמה'.
                </p>
              )}
            </>
          ) : (
            <>
              <Lock className="w-12 h-12 text-purple-dark mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-purple-dark">כניסה לאזור הניהול</h1>
            </>
          )}
        </div>
        
        {isForgotPassword ? (
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onResetPasswordSubmit)} className="space-y-6">
              <FormField
                control={resetForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-right block">אימייל</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="הכנס את האימייל שלך"
                          className="w-full text-right pr-10"
                          dir="rtl"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-right" />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-[#4A235A] hover:bg-[#7E69AB] text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="mr-2">שולח לינק...</span>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  'שלח לינק לאיפוס סיסמה'
                )}
              </Button>
              
              <div className="text-center mt-4">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-purple-dark"
                  onClick={() => {
                    setIsForgotPassword(false);
                    resetForm.reset();
                  }}
                >
                  חזרה לדף ההתחברות
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-right block">אימייל</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="admin@example.com"
                          className="w-full text-right pr-10"
                          dir="rtl"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-right" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-right block">סיסמה</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="הקלד סיסמה"
                          className="w-full text-right pr-10"
                          dir="rtl"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-right" />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-[#4A235A] hover:bg-[#7E69AB] text-white"
                disabled={isLoading || (isCreatingAdmin && adminExists)}
              >
                {isLoading ? (
                  <>
                    <span className="mr-2">{isCreatingAdmin ? 'יוצר משתמש...' : 'מתחבר...'}</span>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  isCreatingAdmin ? 'צור משתמש מנהל' : 'התחברות'
                )}
              </Button>
              
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-purple-dark"
                  onClick={() => {
                    setIsForgotPassword(true);
                    form.reset();
                  }}
                >
                  שכחתי סיסמה
                </Button>
                
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-purple-dark"
                  onClick={() => {
                    setIsCreatingAdmin(!isCreatingAdmin);
                    form.reset();
                  }}
                >
                  {isCreatingAdmin ? 'חזרה לדף ההתחברות' : 'יצירת משתמש מנהל חדש'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default Login;
