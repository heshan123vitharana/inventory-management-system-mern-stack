import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Category, ApiError, Product } from '../types';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Result } from '@zxing/library';

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // we won't keep a typed reader reference to avoid mismatches across library versions

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
        setError(error.response?.data?.message || error.response?.data?.msg || 'Error fetching categories');
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'stock' || name === 'price' ? parseFloat(value) : value
    });
  };

  const lookupBarcode = async (code: string) => {
    if (!code) return;
    try {
      setLookupMessage(null);
      const res = await axios.get(`/api/products/lookup/${code}`);
      const data = res.data;
      if (data.found && data.source === 'local') {
        const product = data.product as Product;
        // If product exists locally, prefill form with existing product details so owner can edit
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
        setLookupMessage(`Found existing product: ${product.name}`);
      } else if (data.found && data.source === 'openfoodfacts') {
        // Prefill from OpenFoodFacts
        const of = data.openFoodFacts as OFFProduct;
        setFormData(prev => ({
          ...prev,
          name: of.product?.product_name || prev.name,
          productNumber: code,
          imageUrl: of.product?.image_front_small_url || prev.imageUrl,
          description: of.product?.generic_name || prev.description
        }));
        setLookupMessage('Prefilled product details from OpenFoodFacts — please review and save.');
      } else {
        setLookupMessage('No product found. Fill the details and save to add new product.');
      }
    } catch (err) {
      console.error('Lookup error', err);
      setLookupMessage('Lookup failed');
    }
  };

  const startScanner = async () => {
    setScanError(null);
    try {
      setScanning(true);
      await new BrowserMultiFormatReader().decodeFromVideoDevice(undefined, videoRef.current as HTMLVideoElement, (result: Result | undefined) => {
        if (result) {
          const code = result.getText();
          setFormData(prev => ({ ...prev, productNumber: code }));
          stopScanner();
          lookupBarcode(code);
        }
        // ignore continuous not found errors
      });
    } catch (err) {
      console.error('Scanner error', err);
      setScanError('Unable to access camera or start scanner');
      setScanning(false);
    }
  };

  const stopScanner = () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    } catch (e) {
      console.warn(e);
    }
    setScanning(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await axios.post('/api/products', formData);
      navigate('/products');
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.response?.data?.msg || 'Error adding product');
      setLoading(false);
    }
  };

  useEffect(() => {
    const vid = videoRef.current;
    return () => {
      // cleanup scanner on unmount: stop any active camera tracks
      try {
        if (vid && vid.srcObject) {
          const stream = vid.srcObject as MediaStream;
          stream.getTracks().forEach((t) => t.stop());
          vid.srcObject = null;
        }
      } catch (e) { console.warn(e); }
    };
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Add Product</h1>
        <button
          onClick={() => navigate('/products')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
        >
          Back to Products
        </button>
      </div>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                title="Product name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Number
              </label>
              <div className="flex">
                <input
                  type="text"
                  name="productNumber"
                  value={formData.productNumber}
                  onChange={handleChange}
                  title="Barcode / Product Number"
                  placeholder="Scan or enter barcode"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                  required
                />
                <button type="button" onClick={() => scanning ? stopScanner() : startScanner()} className="ml-2 px-3 py-2 bg-gray-800 text-white rounded-md">
                  {scanning ? 'Stop' : 'Scan'}
                </button>
              </div>
              {lookupMessage && <p className="text-sm text-gray-600 mt-2">{lookupMessage}</p>}
              {scanning && (
                <div className="mt-3">
                  <video ref={videoRef} className="w-full max-h-80" />
                  {scanError && <p className="text-sm text-red-600">{scanError}</p>}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                required
                title="Category"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                title="Stock quantity"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                title="Price"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL (optional)
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                title="Image URL"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                name="expirationDate"
                value={formData.expirationDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                title="Expiration date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              title="Description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              required
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-medium py-2 px-6 rounded-md transition-all disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;