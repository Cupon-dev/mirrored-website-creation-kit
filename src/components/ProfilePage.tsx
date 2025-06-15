
import { useState } from 'react';
import { User, Mail, Phone, MessageCircle, Camera, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProfilePageProps {
  onBack: () => void;
}

const ProfilePage = ({ onBack }: ProfilePageProps) => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobile_number || '');
  const [telegramId, setTelegramId] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  
  const handleSave = () => {
    // Here you would typically save to your backend
    toast({
      title: "Profile Updated",
      description: "Your profile has been saved successfully",
    });
  };

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicture(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
          <Button
            variant="ghost"
            onClick={logout}
            className="text-red-600 hover:bg-red-50"
          >
            Logout
          </Button>
        </div>

        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profilePicture} />
              <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-xl">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 bg-green-500 hover:bg-green-600 text-white rounded-full p-2 cursor-pointer">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-sm text-gray-500 mt-2">Tap to upload profile picture</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Full Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              Mobile Number
            </label>
            <Input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="Your mobile number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MessageCircle className="w-4 h-4 inline mr-1" />
              Telegram ID
            </label>
            <Input
              type="text"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="@yourtelegramid"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              WhatsApp Number
            </label>
            <Input
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="WhatsApp number"
            />
          </div>

          <Button
            onClick={handleSave}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
