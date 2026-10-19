import { useState, useRef } from 'react';
import { Upload, X, Image } from 'lucide-react';
import { validateImageFile } from '../../utils/helpers';

export default function ImageUpload({ value, onChange, label = 'Photo (optional)' }) {
  const [preview, setPreview] = useState(value || null);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const remove = () => {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-navy-700 mb-1.5">{label}</label>
      {preview ? (
        <div className="relative w-full max-w-xs">
          <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
          <button
            type="button"
            onClick={remove}
            className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow-sm hover:bg-white"
            aria-label="Remove image"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full max-w-xs h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-teal-400 hover:bg-teal-50/50 transition-colors"
        >
          <Upload className="w-6 h-6 text-gray-400" />
          <span className="text-xs text-gray-500">Click to upload image</span>
          <span className="text-[10px] text-gray-400">JPEG, PNG, WebP — Max 5 MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
        aria-label="Upload photo"
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
