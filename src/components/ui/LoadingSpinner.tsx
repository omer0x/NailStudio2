interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner = ({ size = 'medium' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-3',
    large: 'h-12 w-12 border-4',
  };
  
  return (
    <div className="flex justify-center items-center p-4">
      <div 
        className={`${sizeClasses[size]} rounded-full border-primary-light border-t-primary animate-spin`} 
        role="status" 
        aria-label="Loading"
      />
    </div>
  );
};

export default LoadingSpinner;