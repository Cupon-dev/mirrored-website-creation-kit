
import { useState, useCallback } from "react";
import { Upload, X, Image, Video, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
  isPrimary?: boolean;
}

interface MediaUploadProps {
  onMediaUpload: (files: MediaFile[]) => void;
  currentMedia?: MediaFile[];
  maxFiles?: number;
  className?: string;
}

const MediaUpload = ({ 
  onMediaUpload, 
  currentMedia = [], 
  maxFiles = 5,
  className = "" 
}: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File): Promise<MediaFile | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-media')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('product-media')
        .getPublicUrl(filePath);

      const mediaType = file.type.startsWith('image/') ? 'image' : 'video';

      return {
        id: fileName,
        url: data.publicUrl,
        type: mediaType,
        name: file.name,
        isPrimary: currentMedia.length === 0 // First upload is primary
      };
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const handleFiles = async (files: FileList) => {
    if (currentMedia.length + files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const uploadPromises = Array.from(files).map(uploadFile);
    const uploadedFiles = await Promise.all(uploadPromises);
    const validFiles = uploadedFiles.filter(Boolean) as MediaFile[];

    if (validFiles.length > 0) {
      const updatedMedia = [...currentMedia, ...validFiles];
      onMediaUpload(updatedMedia);
      
      toast({
        title: "Files uploaded successfully!",
        description: `${validFiles.length} file(s) uploaded`
      });
    }

    setUploading(false);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [currentMedia]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (fileId: string) => {
    const updatedMedia = currentMedia.filter(file => file.id !== fileId);
    onMediaUpload(updatedMedia);
  };

  const setPrimary = (fileId: string) => {
    const updatedMedia = currentMedia.map(file => ({
      ...file,
      isPrimary: file.id === fileId
    }));
    onMediaUpload(updatedMedia);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-green-500 bg-green-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleChange}
          className="hidden"
          id="media-upload"
          multiple
          disabled={uploading}
        />
        <label
          htmlFor="media-upload"
          className="cursor-pointer flex flex-col items-center space-y-2"
        >
          {uploading ? (
            <div className="animate-spin">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
          ) : (
            <Camera className="w-8 h-8 text-gray-400" />
          )}
          <span className="text-sm text-gray-600">
            {uploading ? "Uploading..." : "Drag & drop media or click to browse"}
          </span>
          <span className="text-xs text-gray-500">
            Images (PNG, JPG, GIF) or Videos (MP4, WebM) up to 50MB
          </span>
          <span className="text-xs text-gray-500">
            {currentMedia.length}/{maxFiles} files
          </span>
        </label>
      </div>

      {/* Preview Grid */}
      {currentMedia.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {currentMedia.map((file) => (
            <div key={file.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border">
                {file.type === 'image' ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Video className="w-8 h-8 text-gray-400" />
                    <span className="text-xs text-gray-500 ml-2">Video</span>
                  </div>
                )}
              </div>
              
              {/* Controls */}
              <div className="absolute top-2 right-2 flex space-x-1">
                {file.isPrimary && (
                  <Badge className="bg-green-500 text-white text-xs">
                    Primary
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>

              {/* Set Primary Button */}
              {!file.isPrimary && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute bottom-2 left-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setPrimary(file.id)}
                >
                  Set Primary
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
