
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface IndexCategoriesSectionProps {
  currentView: 'home' | 'library' | 'profile' | 'updates';
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const IndexCategoriesSection = ({ 
  currentView, 
  categories, 
  selectedCategory, 
  setSelectedCategory 
}: IndexCategoriesSectionProps) => {
  if (currentView !== 'home') return null;

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm md:text-base font-semibold text-gray-900">Categories</h3>
      </div>
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant={selectedCategory === 'all' ? "default" : "outline"}
          onClick={() => setSelectedCategory('all')}
          className={`rounded-full px-3 py-1 text-xs whitespace-nowrap transition-all active:scale-95 ${
            selectedCategory === 'all'
              ? "bg-green-500 text-white hover:bg-green-600" 
              : "border-gray-200 hover:border-green-400 hover:bg-green-50"
          }`}
        >
          🛍️ All Products
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.id)}
            className={`rounded-full px-3 py-1 text-xs whitespace-nowrap transition-all active:scale-95 ${
              selectedCategory === category.id
                ? "bg-green-500 text-white hover:bg-green-600" 
                : "border-gray-200 hover:border-green-400 hover:bg-green-50"
            }`}
          >
            {category.icon && <span className="mr-1">{category.icon}</span>}
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default IndexCategoriesSection;
