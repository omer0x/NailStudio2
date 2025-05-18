import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { signIn } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

type LoginFormData = {
  email: string;
  password: string;
};

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/book');
    }
    
    document.title = 'Login | Medina Nails Studio';
  }, [user, navigate]);
  
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      const { data: userData, error } = await signIn(data.email, data.password);
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          setLoginError('The email or password you entered is incorrect. Please try again.');
        } else {
          setLoginError(error.message);
        }
        return;
      }
      
      if (userData) {
        navigate('/book');
      }
    } catch (error) {
      setLoginError('An unexpected error occurred. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Pre-fill admin credentials for demo
  const fillAdminCredentials = () => {
    const form = document.querySelector('form') as HTMLFormElement;
    if (form) {
      const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement;
      const passwordInput = form.querySelector('input[name="password"]') as HTMLInputElement;
      
      if (emailInput && passwordInput) {
        emailInput.value = 'admin@medinanails.com';
        passwordInput.value = 'password123';
      }
    }
  };
  
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Welcome Back</h1>
        
        {loginError && (
          <div className="mb-4 p-4 rounded bg-red-50 border border-red-100 text-red-700 text-sm">
            <p>{loginError}</p>
            {loginError.includes('incorrect') && (
              <p className="mt-2 text-sm">
                Forgot your password?{' '}
                <Link to="/reset-password" className="text-red-700 hover:underline font-medium">
                  Reset it here
                </Link>
              </p>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="email"
            type="email"
            label="Email Address"
            placeholder="your@email.com"
            fullWidth
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address',
              }
            })}
            error={errors.email?.message}
          />
          
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            fullWidth
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              }
            })}
            error={errors.password?.message}
          />
          
          <Button 
            type="submit" 
            fullWidth 
            isLoading={isLoading}
          >
            Log In
          </Button>
        </form>
        
        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-600 text-sm">
            Don't have an account? <Link to="/register" className="text-pink-600 hover:underline">Register</Link>
          </p>
          <p className="text-gray-600 text-sm">
            <Link to="/reset-password" className="text-pink-600 hover:underline">Forgot your password?</Link>
          </p>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2 text-center">Demo Account</p>
          <Button 
            variant="outline" 
            fullWidth
            onClick={fillAdminCredentials}
          >
            Fill Admin Credentials
          </Button>
          <p className="mt-2 text-xs text-gray-400 text-center">
            For demo purposes only
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;