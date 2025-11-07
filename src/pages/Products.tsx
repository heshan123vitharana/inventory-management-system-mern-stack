import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Product, ApiError } from '../types';
import { useSettings } from '../context/SettingsContext';
import { Plus, Edit, Trash2, Search, Bell } from 'lucide-react';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [expiringProducts, setExpiringProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { settings } = useSettings();

  useEffect(() => {
    fetchProducts();
    fetchExpiringProducts();
    fetchLowStockProducts();
    
    const interval = setInterval(() => {
      fetchExpiringProducts();
      fetchLowStockProducts();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = products.filter(item =>
      item.name.toLowerCase().includes(lowercasedFilter) ||
      item.productNumber.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredProducts(filteredData);
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/products');
      setProducts(res.data);
      setFilteredProducts(res.data);
      setError(null);
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || 'Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockProducts = async () => {
    try {
      const res = await axios.get('/api/products/low-stock');
      setLowStockProducts(res.data);
    } catch (err) {
      console.error('Error fetching low stock products:', err);
    }
  };

  const fetchExpiringProducts = async () => {
    try {
      const res = await axios.get('/api/products/expiring');
      setExpiringProducts(res.data);
      
      res.data.forEach(async (product: Product) => {
        if ('Notification' in window && Notification.permission === 'granted') {
          const daysUntilExpiry = Math.ceil(
            (new Date(product.expirationDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          
          new Notification('Product Expiring Soon', {
            body: `${product.name} will expire in ${daysUntilExpiry} days.`,
            icon: '/vite.svg',
            tag: `product-${product._id}`
          });
        }
      });
    } catch (err) {
      console.error('Error fetching expiring products:', err);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await axios.delete(`/api/products/${id}`);
      setProducts(products.filter(product => product._id !== id));
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || 'Error deleting product');
    }
  };

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const expiringSoon = expiringProducts.filter(p => 
      p.expirationDate && new Date(p.expirationDate) > twentyFourHoursAgo && new Date(p.expirationDate) <= now
    );

    if (expiringSoon.length > 0) {
      const playAlarm = () => {
        const audio = new Audio('/alarm.mp3'); // Make sure you have an alarm.mp3 file in your public folder
        audio.play();
      };

      const intervalId = setInterval(playAlarm, 60 * 60 * 1000); // Play alarm every hour

      // Clear interval after 24 hours
      setTimeout(() => {
        clearInterval(intervalId);
      }, 24 * 60 * 60 * 1000);

      return () => clearInterval(intervalId);
    }
  }, [expiringProducts]);

  return (
    <div className="p-6 bg-background text-text-primary min-h-screen font-poppins">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Products</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 bg-surface border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <button
            onClick={() => navigate('/products/add')}
            className="flex items-center gap-2 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} /> Add Product
          </button>
        </div>
      </div>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}
      
      {lowStockProducts.length > 0 && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center">
            <Bell className="text-red-500 mr-3" />
            <h3 className="text-lg font-medium text-red-800">Low Stock Alert!</h3>
          </div>
          <div className="mt-2 text-sm text-red-700">
            The following products are low on stock: {lowStockProducts.map(p => `${p.name} (${p.stock} left)`).join(', ')}
          </div>
        </div>
      )}

      {expiringProducts.length > 0 && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center">
            <Bell className="text-red-500 mr-3" />
            <h3 className="text-lg font-medium text-red-800">Products Expiring Soon!</h3>
          </div>
          <div className="mt-2 text-sm text-red-700">
            {expiringProducts.map(p => `${p.name} (expires in ${Math.ceil((new Date(p.expirationDate!).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} days)`).join(', ')}
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8 text-text-secondary">Loading products...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-text-secondary">
          <h2 className="text-2xl font-semibold">No Products Found</h2>
          <p className="mt-2">Add your first product to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} onDelete={deleteProduct} settings={settings} />
          ))}
        </div>
      )}
    </div>
  );
};

import { Settings } from '../context/SettingsContext';

const ProductCard: React.FC<{ product: Product; onDelete: (id: string) => void; settings: Settings }> = ({ product, onDelete, settings }) => {
  const navigate = useNavigate();
  const isExpiring = product.expirationDate && new Date(product.expirationDate) <= new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  const isLowStock = product.stock <= settings.lowStockThreshold;

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `http://localhost:5000/${url.replace(/\\/g, '/')}`;
  };

  return (
    <div className={`bg-surface rounded-lg overflow-hidden border border-border-color transition-all duration-300 hover:shadow-lg hover:border-primary ${isExpiring ? 'border-red-500' : ''}`}>
      <div className="h-40 bg-background flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img src={getImageUrl(product.imageUrl)} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
        ) : (
          <div className="text-text-secondary">No image</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-text-primary truncate">{product.name}</h3>
        <p className="text-text-secondary text-sm mb-4">#{product.productNumber}</p>
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-text-secondary">Stock:</span>
          <span className={`font-bold px-2.5 py-1 rounded-full text-xs ${isLowStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {product.stock}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-text-secondary">Price:</span>
          <span className="font-bold text-xl text-primary">{settings.currencySymbol}{product.price.toFixed(2)}</span>
        </div>

        {product.expirationDate && (
          <div className="flex justify-between mb-4 text-sm">
            <span className="text-text-secondary">Expires:</span>
            <span className={`font-medium ${isExpiring ? 'text-red-600' : 'text-text-secondary'}`}>
              {new Date(product.expirationDate).toLocaleDateString()}
            </span>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={() => navigate(`/products/edit/${product._id}`)}
            className="flex-1 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-text-primary py-2 px-3 rounded-lg transition-colors text-sm font-semibold"
          >
            <Edit size={16} className="mr-1.5" />
            Edit
          </button>
          <button
            onClick={() => onDelete(product._id!)}
            className="flex-1 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 rounded-lg transition-colors text-sm font-semibold"
          >
            <Trash2 size={16} className="mr-1.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default Products;