import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, ShoppingCart, Users, Edit } from "lucide-react";
import { useCategories, useProducts } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdminProductForm from "@/components/AdminProductForm";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: categories = [] } = useCategories();
  const { data: products = [], refetch: refetchProducts } = useProducts();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [currentView, setCurrentView] = useState<"dashboard" | "products" | "categories">("dashboard");
  
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    icon: ""
  });

  const handleAdminLogin = () => {
    if (adminPassword === "admin123") {
      setIsAuthenticated(true);
      toast({
        title: "Welcome Admin!",
        description: "You have successfully logged in to the admin panel."
      });
    } else {
      toast({
        title: "Invalid Password",
        description: "Please enter the correct admin password.",
        variant: "destructive"
      });
    }
  };

  const handleAddCategory = async () => {
    try {
      const { error } = await supabase
        .from('categories')
        .insert([{
          name: categoryForm.name,
          icon: categoryForm.icon
        }]);

      if (error) throw error;

      toast({
        title: "Category Added!",
        description: "Category has been added successfully."
      });

      setCategoryForm({ name: "", icon: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Admin Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </div>
            <Button onClick={handleAdminLogin} className="w-full">
              Login to Admin Panel
            </Button>
            <Button variant="outline" onClick={() => navigate("/")} className="w-full">
              Back to Store
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Store</span>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600 border-green-600">
                Admin Access
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation */}
        <div className="flex space-x-4 mb-6">
          <Button
            variant={currentView === "dashboard" ? "default" : "outline"}
            onClick={() => setCurrentView("dashboard")}
            className="flex items-center space-x-2"
          >
            <Package className="w-4 h-4" />
            <span>Dashboard</span>
          </Button>
          <Button
            variant={currentView === "products" ? "default" : "outline"}
            onClick={() => setCurrentView("products")}
            className="flex items-center space-x-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Products</span>
          </Button>
          <Button
            variant={currentView === "categories" ? "default" : "outline"}
            onClick={() => setCurrentView("categories")}
            className="flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>Categories</span>
          </Button>
        </div>

        {/* Dashboard View */}
        {currentView === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Total Products</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{products.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">{categories.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Active Products</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600">
                  {products.filter(p => p.is_active).length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products View */}
        {currentView === "products" && (
          <div className="space-y-6">
            <AdminProductForm onProductAdded={refetchProducts} />

            {/* Existing Products */}
            <Card>
              <CardHeader>
                <CardTitle>Existing Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <img src={product.image_url} alt={product.name} className="w-16 h-16 object-cover rounded" />
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-gray-500">{product.brand}</p>
                          <p className="text-sm font-medium">₹{product.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Categories View */}
        {currentView === "categories" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category_name">Category Name</Label>
                  <Input
                    id="category_name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <Label htmlFor="category_icon">Icon (emoji)</Label>
                  <Input
                    id="category_icon"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                    placeholder="Enter emoji icon"
                  />
                </div>
                <Button onClick={handleAddCategory} className="w-full bg-green-600 hover:bg-green-700">
                  Add Category
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{category.icon}</span>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
