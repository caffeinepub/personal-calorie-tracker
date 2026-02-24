import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { Upload, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageDropzoneProps {
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
  previewUrl: string | null;
  onClear: () => void;
}

export default function ImageDropzone({ onFileSelected, selectedFile, previewUrl, onClear }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelected(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelected(file);
    }
  };

  if (previewUrl && selectedFile) {
    return (
      <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 bg-muted">
        <img
          src={previewUrl}
          alt="Food preview"
          className="w-full h-56 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="text-white text-sm font-medium truncate max-w-[70%] drop-shadow">
            {selectedFile.name}
          </span>
          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-foreground"
            onClick={onClear}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-4 
        h-56 rounded-2xl border-2 border-dashed cursor-pointer
        transition-all duration-200
        ${isDragging
          ? 'border-primary bg-primary/10 scale-[1.01]'
          : 'border-border bg-muted/50 hover:border-primary/50 hover:bg-primary/5'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-primary/20' : 'bg-muted'}`}>
        {isDragging ? (
          <ImageIcon className="w-8 h-8 text-primary" />
        ) : (
          <Upload className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <div className="text-center px-4">
        <p className="font-semibold text-foreground">
          {isDragging ? 'Drop your food photo here' : 'Upload a food photo'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Drag & drop or click to browse · JPG, PNG, WEBP
        </p>
      </div>
    </div>
  );
}
