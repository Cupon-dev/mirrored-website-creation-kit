
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayLoaderProps {
  children: (isLoaded: boolean) => React.ReactNode;
}

const RazorpayLoader = ({ children }: RazorpayLoaderProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      setIsLoaded(true);
      return;
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      setIsLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      setIsLoaded(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return <>{children(isLoaded)}</>;
};

export default RazorpayLoader;
