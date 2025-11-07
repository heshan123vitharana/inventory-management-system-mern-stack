import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Product, ApiError } from '../types';
import { Plus, Edit, Trash2, Bell } from 'lucide-react';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [expiringProducts, setExpiringProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchExpiringProducts();
    
    // Check for expiring products every minute
    const interval = setInterval(fetchExpiringProducts, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/products');
      setProducts(res.data);
      setError(null);
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.response?.data?.msg || 'Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiringProducts = async () => {
    try {
      const res = await axios.get('/api/products/expiring');
      setExpiringProducts(res.data);
      
      // Send notifications for expiring products
      res.data.forEach(async (product: Product) => {
        if ('Notification' in window && Notification.permission === 'granted') {
          const daysUntilExpiry = Math.ceil(
            (new Date(product.expirationDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          
          new Notification('Product Expiring Soon', {
            body: `${product.name} will expire in ${daysUntilExpiry} days (${new Date(product.expirationDate!).toLocaleDateString()})`,
            icon: '/favicon.ico',
            tag: `product-${product._id}` // Prevent duplicate notifications
          });
          
          // Mark notification as sent
          await axios.put(`/api/products/notification/${product._id}`);
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
      setError(error.response?.data?.message || error.response?.data?.msg || 'Error deleting product');
    }
  };

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">PRODUCTS</h1>
        <div className="flex space-x-2">
        <button
          onClick={() => navigate('/products/add')}
          className="flex items-center bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          <Plus size={18} className="mr-1" /> Add Product
        </button>
        {/* Scan & Add was removed: scanning is now built into the Add Product form */}
        </div>
      </div>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      {expiringProducts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-center">
            <Bell className="text-red-400 mr-2" />
            <h3 className="text-lg font-medium text-red-800">Products Expiring Soon!</h3>
          </div>
          <div className="mt-2">
            {expiringProducts.map(product => {
              const daysUntilExpiry = Math.ceil(
                (new Date(product.expirationDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              
              return (
                <div key={product._id} className="flex justify-between items-center py-2 border-b border-red-200 last:border-0">
                  <div>
                    <span className="font-medium">{product.name}</span>
                    <p className="text-sm text-red-600">
                      Expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}
                    </p>
                  </div>
                  <span className="text-red-700 font-medium">
                    {new Date(product.expirationDate!).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No products found. Add your first product!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {products.map((product) => {
              const isExpiring = product.expirationDate && 
                new Date(product.expirationDate) <= new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
              
              return (
                <div key={product._id} className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                  isExpiring ? 'border-red-300 bg-red-50' : ''
                }`}>
                  <div className="h-40 bg-gray-200 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400">No image</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">#{product.productNumber}</p>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Stock:</span>
                      <span className="font-medium">{product.stock}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-bold">${product.price.toFixed(2)}</span>
                    </div>
                    {product.expirationDate && (
                      <div className="flex justify-between mb-4">
                        <span className="text-gray-600">Expires:</span>
                        <span className={`font-medium ${isExpiring ? 'text-red-600' : ''}`}>
                          {new Date(product.expirationDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <button
                        onClick={() => navigate(`/products/edit/${product._id}`)}
                        className="flex items-center justify-center w-1/2 mr-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 py-1.5 px-3 rounded transition-colors"
                      >
                        <Edit size={16} className="mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(product._id!)}
                        className="flex items-center justify-center w-1/2 ml-2 bg-red-100 hover:bg-red-200 text-red-800 py-1.5 px-3 rounded transition-colors"
                      >
                        <Trash2 size={16} className="mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;