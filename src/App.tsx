
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthWrapper from "@/components/AuthWrapper";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import AdminWhatsApp from "./pages/AdminWhatsApp";
import NotFound from "./pages/NotFound";
import PaymentSuccessHandler from "./components/PaymentSuccessHandler";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AnalyticsProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthWrapper>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/payment-success" element={<PaymentSuccessHandler />} />
              <Route path="/admin/whatsapp" element={<AdminWhatsApp />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthWrapper>
        </BrowserRouter>
      </AnalyticsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
