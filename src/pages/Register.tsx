import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { signUp, supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

type RegisterFormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
};

const Register = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/book');
    }
    
    document.title = 'Register | Medina Nails Studio';
  }, [user, navigate]);
  
  const password = watch('password');
  
  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setRegisterError(null);
    
    try {
      const { data: userData, error } = await signUp(
        data.email, 
        data.password, 
        data.fullName
      );
      
      if (error) {
        if (error.message.includes('Email rate limit exceeded')) {
          setRegisterError('Too many signup attempts. Please try again later.');
        } else {
          setRegisterError(error.message);
        }
        return;
      }
      
      if (userData) {
        // Redirect to login after successful registration
        navigate('/login', { 
          state: { 
            message: 'Registration successful! You can now log in.' 
          }
        });
      }
    } catch (error) {
      setRegisterError('An unexpected error occurred. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Create Your Account</h1>
        
        {registerError && (
          <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
            {registerError}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="fullName"
            label="Full Name"
            placeholder="Jane Doe"
            fullWidth
            {...register('fullName', { 
              required: 'Full name is required',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters',
              }
            })}
            error={errors.fullName?.message}
          />
          
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
                message: 'Invalid email address',
              }
            })}
            error={errors.email?.message}
          />
          
          <Input
            id="phone"
            type="tel"
            label="Phone Number (Optional)"
            placeholder="(123) 456-7890"
            fullWidth
            {...register('phone', {
              pattern: {
                value: /^[0-9+\-\s()]*$/,
                message: 'Invalid phone number',
              }
            })}
            error={errors.phone?.message}
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
          
          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            fullWidth
            {...register('confirmPassword', { 
              required: 'Please confirm your password',
              validate: value => value === password || 'Passwords do not match'
            })}
            error={errors.confirmPassword?.message}
          />
          
          <Button 
            type="submit" 
            fullWidth 
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account? <Link to="/login" className="text-pink-600 hover:underline">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;