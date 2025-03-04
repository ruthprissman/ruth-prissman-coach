
import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
  password: z.string().min(6, "סיסמה חייבת להיות לפחות 6 תווים"),
});

type FormValues = z.infer<typeof formSchema>;

const Login: React.FC = () => {
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const { signIn, createAdminUser, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract the destination from location state or default to admin dashboard
  const from = (location.state as { from: { pathname: string } })?.from?.pathname || '/admin/dashboard';
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (isCreatingAdmin) {
      const { error } = await createAdminUser(data.email, data.password);
      if (!error) {
        setIsCreatingAdmin(false);
        form.reset();
      }
    } else {
      const { error } = await signIn(data.email, data.password);
      if (!error) {
        navigate(from, { replace: true });
      }
    }
  };
  
  if (user) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          {isCreatingAdmin ? (
            <>
              <UserPlus className="w-12 h-12 text-purple-dark mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-purple-dark">יצירת משתמש מנהל</h1>
            </>
          ) : (
            <>
              <Lock className="w-12 h-12 text-purple-dark mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-purple-dark">כניסה לאזור הניהול</h1>
            </>
          )}
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-right block">אימייל</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="admin@example.com"
                      className="w-full text-right"
                      dir="rtl"
                    />
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
                    <Input
                      {...field}
                      type="password"
                      placeholder="הקלד סיסמה"
                      className="w-full text-right"
                      dir="rtl"
                    />
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
                  <span className="mr-2">{isCreatingAdmin ? 'יוצר משתמש...' : 'מתחבר...'}</span>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : (
                isCreatingAdmin ? 'צור משתמש מנהל' : 'התחברות'
              )}
            </Button>
            
            <div className="text-center mt-4">
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
      </div>
    </div>
  );
};

export default Login;
