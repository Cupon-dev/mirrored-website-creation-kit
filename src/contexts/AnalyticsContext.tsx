
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ProductAnalytics {
  current_viewers: number;
  total_purchases: number;
}

interface AnalyticsContextType {
  getAnalytics: (productId: string) => ProductAnalytics;
  incrementViewer: (productId: string) => void;
  decrementViewer: (productId: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  const [analyticsData, setAnalyticsData] = useState<Record<string, ProductAnalytics>>({});

  const generateRealisticNumbers = (productId: string): ProductAnalytics => {
    // Use productId as seed for consistent numbers
    const seed = productId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const random1 = Math.abs(Math.sin(seed)) * 10000;
    const random2 = Math.abs(Math.sin(seed + 1)) * 10000;

    const baseViewers = Math.floor(random1 % (14500 - 1500) + 1500);
    const basePurchases = Math.floor(random2 % (13500 - 1900) + 1900);

    return {
      current_viewers: baseViewers,
      total_purchases: basePurchases
    };
  };

  const getAnalytics = (productId: string): ProductAnalytics => {
    if (!analyticsData[productId]) {
      const newAnalytics = generateRealisticNumbers(productId);
      setAnalyticsData(prev => ({
        ...prev,
        [productId]: newAnalytics
      }));
      return newAnalytics;
    }
    return analyticsData[productId];
  };

  const incrementViewer = (productId: string) => {
    setAnalyticsData(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        current_viewers: (prev[productId]?.current_viewers || 0) + 1
      }
    }));
  };

  const decrementViewer = (productId: string) => {
    setAnalyticsData(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        current_viewers: Math.max(1500, (prev[productId]?.current_viewers || 0) - 1)
      }
    }));
  };

  // Slow realistic fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalyticsData(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(productId => {
          const viewerChange = Math.random() < 0.6 
            ? Math.floor(Math.random() * 20) + 10
            : -(Math.floor(Math.random() * 9) + 1);
          
          updated[productId] = {
            ...updated[productId],
            current_viewers: Math.max(1500, Math.min(14500, updated[productId].current_viewers + viewerChange))
          };

          if (Math.random() < 0.4) {
            const purchaseChange = Math.random() < 0.7
              ? Math.floor(Math.random() * 15) + 10
              : -(Math.floor(Math.random() * 5) + 1);
            
            updated[productId] = {
              ...updated[productId],
              total_purchases: Math.max(1900, Math.min(13500, updated[productId].total_purchases + purchaseChange))
            };
          }
        });
        return updated;
      });
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnalyticsContext.Provider value={{ getAnalytics, incrementViewer, decrementViewer }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useSharedAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useSharedAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
