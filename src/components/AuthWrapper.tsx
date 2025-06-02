
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Entrance from '@/pages/Entrance';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { user, isLoading } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds

  useEffect(() => {
    if (!user && !isLoading) {
      // Start countdown timer
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setShowLoginPrompt(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [user, isLoading]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Force login after 1 minute or if not authenticated
  if (!user || showLoginPrompt) {
    return <Entrance />;
  }

  // Show timer notification when not logged in
  if (!user && timeLeft > 0) {
    return (
      <div className="relative">
        {children}
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          <p className="text-sm font-medium">Login required in {timeLeft}s</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthWrapper;
