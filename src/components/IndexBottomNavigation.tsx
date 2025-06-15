
import { useNavigate } from "react-router-dom";
import { Home, Library, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface IndexBottomNavigationProps {
  currentView: 'home' | 'library' | 'profile' | 'updates';
  setCurrentView: (view: 'home' | 'library' | 'profile' | 'updates') => void;
  user: any;
  unreadCount: number;
  handleUpdatesClick: () => void;
}

const IndexBottomNavigation = ({ 
  currentView, 
  setCurrentView, 
  user, 
  unreadCount, 
  handleUpdatesClick 
}: IndexBottomNavigationProps) => {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-around">
        <Button 
          variant="ghost" 
          className={`flex flex-col items-center space-y-1 py-2 active:scale-95 transition-all ${
            currentView === 'home' ? 'text-gray-800' : 'text-gray-400'
          }`}
          onClick={() => setCurrentView('home')}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs font-medium">Home</span>
          {currentView === 'home' && <div className="w-6 h-0.5 bg-gray-800 rounded-full"></div>}
        </Button>
        
        <Button 
          variant="ghost" 
          className={`flex flex-col items-center space-y-1 py-2 active:scale-95 transition-all ${
            currentView === 'library' ? 'text-gray-800' : 'text-gray-400'
          }`}
          onClick={() => setCurrentView('library')}
        >
          <Library className="w-5 h-5" />
          <span className="text-xs font-medium">Library</span>
          {currentView === 'library' && <div className="w-6 h-0.5 bg-gray-800 rounded-full"></div>}
        </Button>
        
        <Button 
          variant="ghost" 
          className={`flex flex-col items-center space-y-1 py-2 active:scale-95 transition-all relative ${
            currentView === 'updates' ? 'text-gray-800' : 'text-gray-400'
          }`}
          onClick={handleUpdatesClick}
        >
          <Bell className="w-5 h-5" />
          <span className="text-xs font-medium">Updates</span>
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {currentView === 'updates' && <div className="w-6 h-0.5 bg-gray-800 rounded-full"></div>}
        </Button>
        
        {user ? (
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center space-y-1 py-2 active:scale-95 transition-all ${
              currentView === 'profile' ? 'text-gray-800' : 'text-gray-400'
            }`}
            onClick={() => setCurrentView('profile')}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">Profile</span>
            {currentView === 'profile' && <div className="w-6 h-0.5 bg-gray-800 rounded-full"></div>}
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            className="flex flex-col items-center space-y-1 py-2 active:scale-95 transition-all"
            onClick={() => navigate('/login')}
          >
            <User className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400">Login</span>
          </Button>
        )}
      </div>
    </nav>
  );
};

export default IndexBottomNavigation;
