
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Plus, Save, Link, ImageIcon } from 'lucide-react';
import { useCategories } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminProductFormProps {
  onProductAdded: () => void;
}

const AdminProductForm = ({ onProductAdded }: AdminProductFormProps) => {
  const { toast } = useToast();
  const { data: categories = [] } = useCategories();
  
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
    razorpay_link: "",
    download_link: "",
    tags: "",
    rating: "",
    review_count: ""
  });

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setProductForm(prev => ({ ...prev, image_url: data.publicUrl }));
      
      toast({
        title: "Image uploaded!",
        description: "Product image has been uploaded successfully."
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleAddProduct = async () => {
    try {
      if (!productForm.name || !productForm.price) {
        toast({
          title: "Missing fields",
          description: "Please fill in product name and price",
          variant: "destructive"
        });
        return;
      }

      const tagsArray = productForm.tags ? productForm.tags.split(',').map(tag => tag.trim()) : [];

      const { error } = await supabase
        .from('products')
        .insert([{
          name: productForm.name,
          description: productForm.description,
          price: parseFloat(productForm.price),
          original_price: productForm.original_price ? parseFloat(productForm.original_price) : null,
          discount_percentage: productForm.discount_percentage ? parseInt(productForm.discount_percentage) : 0,
          category_id: productForm.category_id || null,
          stock_quantity: parseInt(productForm.stock_quantity) || 100,
          brand: productForm.brand,
          image_url: productForm.image_url,
          razorpay_link: productForm.razorpay_link,
          download_link: productForm.download_link,
          tags: tagsArray,
          rating: productForm.rating ? parseFloat(productForm.rating) : 4.5,
          review_count: productForm.review_count ? parseInt(productForm.review_count) : 0
        }]);

      if (error) throw error;

      toast({
        title: "Product Added!",
        description: "Product has been added successfully."
      });

      // Reset form
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
        razorpay_link: "",
        download_link: "",
        tags: "",
        rating: "",
        review_count: ""
      });

      onProductAdded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
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
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={productForm.name}
                onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                placeholder="Enter product name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={productForm.brand}
                onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                placeholder="Enter brand name"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="original_price">Original Price</Label>
                <Input
                  id="original_price"
                  type="number"
                  value={productForm.original_price}
                  onChange={(e) => setProductForm({...productForm, original_price: e.target.value})}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="discount">Discount %</Label>
                <Input
                  id="discount"
                  type="number"
                  max="100"
                  value={productForm.discount_percentage}
                  onChange={(e) => setProductForm({...productForm, discount_percentage: e.target.value})}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  value={productForm.stock_quantity}
                  onChange={(e) => setProductForm({...productForm, stock_quantity: e.target.value})}
                  placeholder="100"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={productForm.category_id} onValueChange={(value) => setProductForm({...productForm, category_id: value})}>
                <SelectTrigger className="mt-1">
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
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  max="5"
                  min="1"
                  value={productForm.rating}
                  onChange={(e) => setProductForm({...productForm, rating: e.target.value})}
                  placeholder="4.5"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="review_count">Reviews</Label>
                <Input
                  id="review_count"
                  type="number"
                  value={productForm.review_count}
                  onChange={(e) => setProductForm({...productForm, review_count: e.target.value})}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="razorpay_link">Razorpay Payment Link *</Label>
              <Input
                id="razorpay_link"
                value={productForm.razorpay_link}
                onChange={(e) => setProductForm({...productForm, razorpay_link: e.target.value})}
                placeholder="https://rzp.io/l/..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="download_link">Access/Download Link</Label>
              <Input
                id="download_link"
                value={productForm.download_link}
                onChange={(e) => setProductForm({...productForm, download_link: e.target.value})}
                placeholder="https://drive.google.com/..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={productForm.tags}
                onChange={(e) => setProductForm({...productForm, tags: e.target.value})}
                placeholder="course, premium, digital"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Full Width Fields */}
        <div>
          <Label htmlFor="description">Product Description</Label>
          <Textarea
            id="description"
            value={productForm.description}
            onChange={(e) => setProductForm({...productForm, description: e.target.value})}
            placeholder="Detailed product description..."
            rows={4}
            className="mt-1"
          />
        </div>

        {/* Image Upload */}
        <div>
          <Label>Product Image</Label>
          <div
            className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {productForm.image_url ? (
              <div className="space-y-3">
                <img
                  src={productForm.image_url}
                  alt="Product preview"
                  className="w-32 h-32 object-cover rounded-lg mx-auto"
                />
                <div className="flex items-center justify-center space-x-2">
                  <Badge className="bg-green-100 text-green-800">
                    Image uploaded successfully
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProductForm(prev => ({ ...prev, image_url: '' }))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {uploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto" />
                )}
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {uploading ? 'Uploading...' : 'Drop image here or click to upload'}
                  </p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer" disabled={uploading}>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </label>
              </div>
            )}
          </div>
        </div>

        <Button onClick={handleAddProduct} className="w-full bg-green-600 hover:bg-green-700">
          <Save className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminProductForm;
