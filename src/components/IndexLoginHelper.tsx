
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface IndexLoginHelperProps {
  user: any;
  currentView: 'home' | 'library' | 'profile' | 'updates';
}

const IndexLoginHelper = ({ user, currentView }: IndexLoginHelperProps) => {
  const navigate = useNavigate();

  if (user || currentView !== 'home') return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-1">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-xs text-blue-700">
          💡 <strong>New user?</strong> <Button variant="link" className="p-0 h-auto text-xs text-blue-700 underline" onClick={() => navigate('/login')}>Click here to login or register</Button> and get instant access to premium digital products!
        </p>
      </div>
    </div>
  );
};

export default IndexLoginHelper;
