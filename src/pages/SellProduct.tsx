import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Product, ApiError } from '../types';

const SellProduct: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [barcode, setBarcode] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      const product = products.find(p => p._id === selectedProduct);
      if (product) {
        setProductDetails(product);
        // Reset quantity if it's more than available stock
        if (quantity > product.stock) {
          setQuantity(1);
        }
      }
    } else {
      setProductDetails(null);
    }
  }, [selectedProduct, products, quantity]);

  // When barcode is provided, try to find matching product by productNumber
  useEffect(() => {
    if (!barcode) return;
    const prod = products.find((p) => p.productNumber === barcode.trim());
    if (prod) {
      setSelectedProduct(prod._id || '');
      setError(null);
    }
  }, [barcode, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/products');
      // Filter out products with zero stock
      setProducts(res.data.filter((product: Product) => product.stock > 0));
      setError(null);
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.response?.data?.msg || 'Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !productDetails) {
      setError('Please select a product');
      return;
    }
    
    if (quantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }
    
    if (quantity > productDetails.stock) {
      setError('Quantity cannot exceed available stock');
      return;
    }
    
    try {
      setSubmitting(true);
      await axios.post('/api/transactions/sell', {
        productId: selectedProduct,
        quantity,
        notes
      });
      
      navigate('/transactions');
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.response?.data?.msg || 'Error processing sale');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Sell Product</h1>
      </div>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Product Information</h3>
          
          <div className="mb-4">
            <label htmlFor="barcode-input" className="block text-sm font-medium text-gray-700 mb-1">
              Barcode (scan or type)
            </label>
            <input
              id="barcode-input"
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // prevent form submit
                  e.preventDefault();
                  const prod = products.find((p) => p.productNumber === barcode.trim());
                  if (prod) {
                    setSelectedProduct(prod._id || '');
                    setError(null);
                  } else {
                    setError('Product not found for that barcode');
                  }
                }
              }}
              placeholder="Scan barcode or type then press Enter"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Product
            </label>
            <select
              id="product-select"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              required
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} - ${product.price.toFixed(2)} (Stock: {product.stock})
                </option>
              ))}
            </select>
          </div>
          
          {productDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 p-4 bg-gray-50 rounded-md">
              <div>
                <p className="text-sm text-gray-600">Product:</p>
                <p className="font-medium">{productDetails.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Product Number:</p>
                <p className="font-medium">{productDetails.productNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Stock:</p>
                <p className="font-medium">{productDetails.stock}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Unit Price:</p>
                <p className="font-medium">${productDetails.price.toFixed(2)}</p>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="quantity-input" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              id="quantity-input"
              type="number"
              value={quantity}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0) {
                  setQuantity(value);
                }
              }}
              min="1"
              max={productDetails?.stock || 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              required
            />
          </div>
          
          {productDetails && (
            <div className="bg-blue-50 p-4 rounded-md mb-4">
              <div className="flex justify-between text-sm font-medium">
                <span>Unit Price:</span>
                <span>${productDetails.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Quantity:</span>
                <span>{quantity}</span>
              </div>
              <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                <span>Total:</span>
                <span>${(productDetails.price * quantity).toFixed(2)}</span>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="notes-input" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            ></textarea>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!selectedProduct || submitting || quantity <= 0}
            className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-medium py-2 px-6 rounded-md transition-all disabled:opacity-50"
          >
            {submitting ? 'Processing...' : 'Sell Product'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellProduct;