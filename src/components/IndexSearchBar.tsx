
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface IndexSearchBarProps {
  currentView: 'home' | 'library' | 'profile' | 'updates';
}

const IndexSearchBar = ({ currentView }: IndexSearchBarProps) => {
  if (currentView !== 'home') return null;

  return (
    <div className="px-4 py-2 bg-white border-b">
      <div className="max-w-7xl mx-auto relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input 
          placeholder="Find your next digital treasure..." 
          className="pl-10 pr-4 py-2 rounded-xl border-gray-200 focus:border-green-400 text-sm transition-all"
        />
      </div>
    </div>
  );
};

export default IndexSearchBar;
