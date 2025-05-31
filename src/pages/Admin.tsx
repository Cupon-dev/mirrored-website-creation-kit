import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Save, Eye, Edit, Trash2, Package, ShoppingCart, Users } from "lucide-react";
import { useCategories, useProducts } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ImageUpload from "@/components/ImageUpload";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [currentView, setCurrentView] = useState<"dashboard" | "products" | "categories" | "payments">("dashboard");
  
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    original_price: "",
    discount_percentage: "",
    category_id: "",
    stock_quantity: "",
    brand: "",
    image_url: "",
    gallery_images: "",
    razorpay_link: "",
    tags: "",
    rating: "",
    review_count: ""
  });

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

  const handleAddProduct = async () => {
    try {
      const galleryArray = productForm.gallery_images ? productForm.gallery_images.split(',').map(url => url.trim()) : [];
      const tagsArray = productForm.tags ? productForm.tags.split(',').map(tag => tag.trim()) : [];

      const { error } = await supabase
        .from('products')
        .insert([{
          name: productForm.name,
          description: productForm.description,
          price: parseFloat(productForm.price),
          original_price: productForm.original_price ? parseFloat(productForm.original_price) : null,
          discount_percentage: productForm.discount_percentage ? parseInt(productForm.discount_percentage) : 0,
          category_id: productForm.category_id,
          stock_quantity: parseInt(productForm.stock_quantity),
          brand: productForm.brand,
          image_url: productForm.image_url,
          gallery_images: galleryArray,
          razorpay_link: productForm.razorpay_link,
          tags: tagsArray,
          rating: productForm.rating ? parseFloat(productForm.rating) : 0,
          review_count: productForm.review_count ? parseInt(productForm.review_count) : 0
        }]);

      if (error) throw error;

      toast({
        title: "Product Added!",
        description: "Product has been added successfully."
      });

      setProductForm({
        name: "",
        description: "",
        price: "",
        original_price: "",
        discount_percentage: "",
        category_id: "",
        stock_quantity: "",
        brand: "",
        image_url: "",
        gallery_images: "",
        razorpay_link: "",
        tags: "",
        rating: "",
        review_count: ""
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Add New Product</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={productForm.brand}
                        onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                        placeholder="Enter brand name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        value={productForm.price}
                        onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                        placeholder="Enter price"
                      />
                    </div>
                    <div>
                      <Label htmlFor="original_price">Original Price</Label>
                      <Input
                        id="original_price"
                        type="number"
                        value={productForm.original_price}
                        onChange={(e) => setProductForm({...productForm, original_price: e.target.value})}
                        placeholder="Enter original price"
                      />
                    </div>
                    <div>
                      <Label htmlFor="discount">Discount %</Label>
                      <Input
                        id="discount"
                        type="number"
                        value={productForm.discount_percentage}
                        onChange={(e) => setProductForm({...productForm, discount_percentage: e.target.value})}
                        placeholder="Enter discount percentage"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock">Stock Quantity</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={productForm.stock_quantity}
                        onChange={(e) => setProductForm({...productForm, stock_quantity: e.target.value})}
                        placeholder="Enter stock quantity"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="rating">Rating</Label>
                      <Input
                        id="rating"
                        type="number"
                        step="0.1"
                        max="5"
                        value={productForm.rating}
                        onChange={(e) => setProductForm({...productForm, rating: e.target.value})}
                        placeholder="Enter rating (0-5)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="review_count">Review Count</Label>
                      <Input
                        id="review_count"
                        type="number"
                        value={productForm.review_count}
                        onChange={(e) => setProductForm({...productForm, review_count: e.target.value})}
                        placeholder="Enter review count"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={productForm.category_id} onValueChange={(value) => setProductForm({...productForm, category_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.icon} {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="razorpay_link">Razorpay Payment Link</Label>
                      <Input
                        id="razorpay_link"
                        value={productForm.razorpay_link}
                        onChange={(e) => setProductForm({...productForm, razorpay_link: e.target.value})}
                        placeholder="Enter Razorpay payment link"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tags">Tags (comma separated)</Label>
                      <Input
                        id="tags"
                        value={productForm.tags}
                        onChange={(e) => setProductForm({...productForm, tags: e.target.value})}
                        placeholder="Enter tags separated by commas"
                      />
                    </div>
                  </div>
                </div>

                {/* Full Width Fields */}
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>

                {/* Image Upload Section */}
                <div>
                  <Label>Main Product Image</Label>
                  <ImageUpload
                    currentImage={productForm.image_url}
                    onImageUpload={(url) => setProductForm({...productForm, image_url: url})}
                  />
                </div>

                <div>
                  <Label htmlFor="gallery_images">Additional Gallery Images (comma separated URLs)</Label>
                  <Textarea
                    id="gallery_images"
                    value={productForm.gallery_images}
                    onChange={(e) => setProductForm({...productForm, gallery_images: e.target.value})}
                    placeholder="Enter additional image URLs separated by commas"
                    rows={2}
                  />
                </div>

                <Button onClick={handleAddProduct} className="w-full bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </CardContent>
            </Card>

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
                          <p className="text-sm font-medium">${product.price}</p>
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
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Add New Category</span>
                </CardTitle>
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
                  <Save className="w-4 h-4 mr-2" />
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
