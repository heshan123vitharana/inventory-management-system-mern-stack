import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Category, ApiError, Product } from '../types';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { Camera, X, UploadCloud, Package, Tag, Layers, Hash, DollarSign, Calendar, FileText, Info } from 'lucide-react';

const AddProduct: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    productNumber: '',
    category: '',
    stock: 0,
    price: 0,
    description: '',
    imageUrl: '',
    expirationDate: ''
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader>(new BrowserMultiFormatReader());

  type OFFProduct = { product?: { product_name?: string; image_front_small_url?: string; generic_name?: string } };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/categories');
        setCategories(res.data);
      } catch (err) {
        const error = err as ApiError;
        setError(error.response?.data?.message || 'Error fetching categories');
      }
    };
    fetchCategories();
    return () => {
      stopScanner();
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['stock', 'price'].includes(name) ? parseFloat(value) || 0 : value
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const lookupBarcode = async (code: string) => {
    if (!code) return;
    try {
      setLookupMessage('Looking up barcode...');
      const res = await axios.get(`/api/products/lookup/${code}`);
      const data = res.data;
      if (data.found && data.source === 'local') {
        const product = data.product as Product;
        setFormData(prev => ({
          ...prev,
          name: product.name || prev.name,
          productNumber: product.productNumber || code,
          category: product.category || prev.category || '',
          stock: product.stock ?? prev.stock,
          price: product.price ?? prev.price,
          imageUrl: product.imageUrl || prev.imageUrl,
          description: product.description || prev.description
        }));
        setLookupMessage(`Found existing product: ${product.name}. You can edit and save.`);
      } else if (data.found && data.source === 'openfoodfacts') {
        const of = data.openFoodFacts as OFFProduct;
        setFormData(prev => ({
          ...prev,
          name: of.product?.product_name || prev.name,
          productNumber: code,
          imageUrl: of.product?.image_front_small_url || prev.imageUrl,
          description: of.product?.generic_name || prev.description
        }));
        setLookupMessage('Prefilled details from OpenFoodFacts. Please review.');
      } else {
        setLookupMessage('No product found. Fill details to add a new product.');
      }
    } catch (err) {
      console.error('Lookup error', err);
      setLookupMessage('Lookup failed. Please try again.');
    }
  };

  const startScanner = async () => {
    if (!videoRef.current) return;
    setScanError(null);
    setScanning(true);
    try {
      await codeReader.current.decodeFromVideoDevice(null, videoRef.current, (result: Result | undefined) => {
        if (result) {
          const code = result.getText();
          setFormData(prev => ({ ...prev, productNumber: code }));
          stopScanner();
          lookupBarcode(code);
        }
      });
    } catch (err) {
      console.error('Scanner error', err);
      setScanError('Could not start scanner. Check camera permissions.');
      setScanning(false);
    }
  };

  const stopScanner = () => {
    codeReader.current.reset();
    setScanning(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      let imageUrl = formData.imageUrl;
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('image', imageFile);
        const res = await axios.post('/api/products/upload', uploadData);
        imageUrl = res.data.imageUrl;
      }

      await axios.post('/api/products', { ...formData, imageUrl });
      navigate('/products');
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || 'Error adding product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Add New Product</h1>
        <p className="text-text-secondary">Fill in the details below to add a new item to your inventory.</p>
      </div>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
      
      <div className="bg-surface rounded-xl p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="productNumber" className="block text-sm font-medium text-text-primary mb-1">Product Number (Barcode)</label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                  <input
                    id="productNumber"
                    type="text"
                    name="productNumber"
                    value={formData.productNumber}
                    onChange={handleChange}
                    placeholder="Scan or enter barcode"
                    className="w-full pl-10 pr-4 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={scanning ? stopScanner : startScanner}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  title={scanning ? 'Stop Scanner' : 'Scan Barcode'}
                >
                  {scanning ? <X size={20} /> : <Camera size={20} />}
                </button>
              </div>
              {lookupMessage && <p className="text-sm text-text-secondary mt-2 flex items-center gap-2"><Info size={14}/> {lookupMessage}</p>}
            </div>

            {scanning && (
              <div className="md:col-span-2 bg-background rounded-lg p-4">
                <video ref={videoRef} className="w-full h-64 object-cover rounded-md" />
                {scanError && <p className="text-sm text-red-600 mt-2">{scanError}</p>}
                <button type="button" onClick={stopScanner} className="mt-2 w-full text-center text-sm text-primary hover:underline">Close Scanner</button>
              </div>
            )}

            <InputField icon={<Package size={20}/>} label="Product Name" name="name" value={formData.name} onChange={handleChange} required />
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-text-primary mb-1">Category</label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none appearance-none bg-white"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>
            </div>

            <InputField icon={<Hash size={20}/>} label="Stock Quantity" name="stock" type="number" value={formData.stock} onChange={handleChange} required min="0" />
            <InputField icon={<DollarSign size={20}/>} label="Price" name="price" type="number" value={formData.price} onChange={handleChange} required min="0" step="0.01" />
            <InputField icon={<Calendar size={20}/>} label="Expiration Date" name="expirationDate" type="date" value={formData.expirationDate} onChange={handleChange} min={new Date().toISOString().split('T')[0]} />
            
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-text-primary mb-1">Product Image</label>
              <div className="relative">
                <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                <input
                  id="image"
                  type="file"
                  name="image"
                  onChange={handleImageChange}
                  className="w-full pl-10 pr-4 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-1">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              ></textarea>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full md:w-auto bg-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadCloud size={20} />
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface InputFieldProps {
  icon: React.ReactNode;
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  min?: string | number;
  step?: string;
}

const InputField: React.FC<InputFieldProps> = ({ icon, label, name, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-text-primary mb-1">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">{icon}</span>
      <input
        id={name}
        name={name}
        {...props}
        className="w-full pl-10 pr-4 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
      />
    </div>
  </div>
);

export default AddProduct;