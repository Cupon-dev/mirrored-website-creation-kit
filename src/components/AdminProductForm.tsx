
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, Link as LinkIcon, Play } from 'lucide-react';
import { useCategories } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MediaUpload from './MediaUpload';

interface AdminProductFormProps {
  onProductAdded: () => void;
}

interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
  isPrimary?: boolean;
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
    razorpay_link: "",
    demo_link: "",
    access_link: "",
    tags: "",
    rating: "",
    review_count: ""
  });

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

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
      const primaryImage = mediaFiles.find(file => file.isPrimary && file.type === 'image');

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
          image_url: primaryImage?.url || '',
          razorpay_link: productForm.razorpay_link,
          demo_link: productForm.demo_link,
          access_link: productForm.access_link,
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
        razorpay_link: "",
        demo_link: "",
        access_link: "",
        tags: "",
        rating: "",
        review_count: ""
      });

      setMediaFiles([]);
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
              <Label htmlFor="razorpay_link">
                <LinkIcon className="w-4 h-4 inline mr-1" />
                Razorpay Payment Link *
              </Label>
              <Input
                id="razorpay_link"
                value={productForm.razorpay_link}
                onChange={(e) => setProductForm({...productForm, razorpay_link: e.target.value})}
                placeholder="https://rzp.io/l/..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="demo_link">
                <Play className="w-4 h-4 inline mr-1" />
                Demo Link
              </Label>
              <Input
                id="demo_link"
                value={productForm.demo_link}
                onChange={(e) => setProductForm({...productForm, demo_link: e.target.value})}
                placeholder="https://youtube.com/watch?v=..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="access_link">
                <LinkIcon className="w-4 h-4 inline mr-1" />
                Access/Download Link
              </Label>
              <Input
                id="access_link"
                value={productForm.access_link}
                onChange={(e) => setProductForm({...productForm, access_link: e.target.value})}
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

        {/* Media Upload */}
        <div>
          <Label>Product Media (Images & Videos)</Label>
          <MediaUpload
            onMediaUpload={setMediaFiles}
            currentMedia={mediaFiles}
            maxFiles={10}
            className="mt-2"
          />
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
