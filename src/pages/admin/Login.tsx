import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, UserPlus, KeyRound, Mail, Check, LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDashboardRedirectUrl, saveEnvironmentForAuth } from '@/utils/urlUtils';

const formSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
  password: z.string().min(6, "סיסמה חייבת להיות לפחות 6 תווים"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
});

const passwordRecoverySchema = z.object({
  password: z.string().min(6, "סיסמה חייבת להיות לפחות 6 תווים"),
  confirmPassword: z.string().min(6, "סיסמה חייבת להיות לפחות 6 תווים"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "הסיסמאות אינן תואמות",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
type PasswordRecoveryFormValues = z.infer<typeof passwordRecoverySchema>;

const Login: React.FC = () => {
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [adminExists, setAdminExists] = useState(true);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);
  
  const { signIn, signInWithGoogle, createAdminUser, resetPassword, checkAdminExists } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isRecoveryMode = searchParams.get('type') === 'recovery';
  const [loginMethod, setLoginMethod] = useState<'email' | 'google'>('google');
  
  const from = (location.state as { from: { pathname: string } })?.from?.pathname || '/admin/dashboard';
  
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
    mode: 'onChange'
  });

  const recoveryForm = useForm<PasswordRecoveryFormValues>({
    resolver: zodResolver(passwordRecoverySchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange'
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
      }
    }
  };
  
  const onResetPasswordSubmit = async (data: ResetPasswordFormValues) => {
    console.log('Reset password form submitted with email:', data.email);
    const { error } = await resetPassword(data.email);
    if (!error) {
      resetForm.reset();
      setIsForgotPassword(false);
    }
  };

  const onPasswordRecoverySubmit = async (data: PasswordRecoveryFormValues) => {
    console.log('Password recovery form submitted');
    setPasswordResetError(null);
    
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: data.password 
      });
      
      if (error) {
        console.error('Error updating password:', error);
        setPasswordResetError(error.message);
        return;
      }
      
      setPasswordResetSuccess(true);
      recoveryForm.reset();
      
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 3000);
    } catch (error: any) {
      console.error('Unexpected error during password reset:', error);
      setPasswordResetError(error.message || 'אירעה שגיאה בעדכון הסיסמה');
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      saveEnvironmentForAuth();
      
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar',
          redirectTo: getDashboardRedirectUrl(),
          queryParams: {
            prompt: 'consent',
            access_type: 'offline'
          }
        }
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };
  
  const handleCheckAdminExists = async () => {
    setIsCheckingAdmin(true);
    try {
      const exists = await checkAdminExists();
      console.log('Admin exists check result:', exists);
      setAdminExists(exists);
      
      if (isCreatingAdmin && exists) {
        setIsCreatingAdmin(false);
      }
    } catch (error) {
      console.error('Error checking if admin exists:', error);
      setAdminExists(true); // Default to true on error for security
    } finally {
      setIsCheckingAdmin(false);
    }
  };
  
  if (isRecoveryMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <KeyRound className="w-12 h-12 text-purple-dark mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-purple-dark">עדכון סיסמה</h1>
            <p className="text-gray-600 mt-2">הזן את הסיסמה החדשה שלך</p>
          </div>
          
          {passwordResetSuccess ? (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertDescription className="text-center text-green-700 flex items-center justify-center">
                <Check className="h-5 w-5 mr-2" />
                הסיסמה עודכנה בהצלחה! מועבר/ת לדף הניהול...
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...recoveryForm}>
              <form onSubmit={recoveryForm.handleSubmit(onPasswordRecoverySubmit)} className="space-y-6">
                {passwordResetError && (
                  <Alert className="mb-4 bg-red-50 border-red-200">
                    <AlertDescription className="text-center text-red-700">
                      {passwordResetError}
                    </AlertDescription>
                  </Alert>
                )}
                
                <FormField
                  control={recoveryForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-right block">הזן סיסמה חדשה</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="הקלד סיסמה חדשה"
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
                  control={recoveryForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-right block">אשר סיסמה חדשה</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="הקלד שוב את הסיסמה החדשה"
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
                  disabled={recoveryForm.formState.isSubmitting}
                >
                  {recoveryForm.formState.isSubmitting ? (
                    <>
                      <span className="mr-2">מעדכן סיסמה...</span>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </>
                  ) : (
                    'שמור סיסמה חדשה'
                  )}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    );
  }
  
  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <KeyRound className="w-12 h-12 text-purple-dark mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-purple-dark">שחזור סיסמה</h1>
            <p className="text-gray-600 mt-2">הזן את כתובת האימייל שלך כדי לקבל קישור לאיפוס הסיסמה</p>
          </div>
          
          <form onSubmit={resetForm.handleSubmit(onResetPasswordSubmit)} className="space-y-6" noValidate>
            <div className="space-y-2">
              <label htmlFor="reset-email" className="text-right block">אימייל</label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  id="reset-email"
                  type="email"
                  placeholder="הכנס את האימייל שלך"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-right pr-10"
                  dir="rtl"
                  {...resetForm.register("email")}
                />
              </div>
              {resetForm.formState.errors.email && (
                <p className="text-sm font-medium text-destructive text-right">
                  {resetForm.formState.errors.email.message}
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#4A235A] hover:bg-[#7E69AB] text-white"
              disabled={resetForm.formState.isSubmitting}
            >
              {resetForm.formState.isSubmitting ? (
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Lock className="w-12 h-12 text-purple-dark mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-purple-dark">כניסה לאזור הניהול</h1>
        </div>

        <Tabs defaultValue="google" value={loginMethod} onValueChange={(value) => setLoginMethod(value as 'email' | 'google')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="email">אימייל וסיסמה</TabsTrigger>
            <TabsTrigger value="google">התחברות עם גוגל</TabsTrigger>
          </TabsList>
          
          <TabsContent value="email">
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
                  disabled={form.formState.isSubmitting || (isCreatingAdmin && adminExists)}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <span className="mr-2">{isCreatingAdmin ? 'יוצר משתמש...' : 'מתחבר...'}</span>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </>
                  ) : (
                    isCreatingAdmin ? 'צור משתמש מנהל' : 'התחברות'
                  )}
                </Button>
                
                <div className="flex justify-between mt-6">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-purple-dark"
                    onClick={() => {
                      setIsForgotPassword(true);
                      resetForm.reset();
                    }}
                  >
                    שכחתי סיסמה
                  </Button>
                  
                  {!isCheckingAdmin && (
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-purple-dark"
                      onClick={() => {
                        handleCheckAdminExists();
                        setIsCreatingAdmin(!isCreatingAdmin);
                        form.reset();
                      }}
                    >
                      {isCreatingAdmin ? 'חזרה לדף ההתחברות' : 'יצירת משתמש מנהל חדש'}
                    </Button>
                  )}
                  
                  {isCreatingAdmin && (
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-purple-dark"
                      onClick={() => {
                        setIsCreatingAdmin(false);
                        form.reset();
                      }}
                    >
                      חזרה לדף ההתחברות
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="google">
            <div className="py-6">
              <p className="text-center text-gray-600 mb-6">התחברות באמצעות חשבון גוגל שלך</p>
              
              <Button 
                type="button"
                className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                onClick={handleGoogleSignIn}
                disabled={isCheckingAdmin}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {isCheckingAdmin ? (
                  <>
                    <span className="mr-2">מתחבר...</span>
                    <div className="w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  'התחבר עם גוגל'
                )}
              </Button>
              
              {!adminExists && !isCheckingAdmin && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  עדיין לא קיים משתמש מנהל. עבור לאפשרות אימייל וסיסמה ליצירת משתמש חדש.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Login;
