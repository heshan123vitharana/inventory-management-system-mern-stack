import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Product, Supplier, ApiError } from '../types';

const ReceiveInventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState({
    productId: '',
    supplierId: '',
    quantity: 1,
    price: 0,
    notes: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [barcode, setBarcode] = useState<string>('');
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.productId) {
      const product = products.find(p => p._id === formData.productId);
      if (product) {
        setProductDetails(product);
        setFormData(prev => ({
          ...prev,
          price: product.price
        }));
      }
    } else {
      setProductDetails(null);
    }
  }, [formData.productId, products]);

  const handleLookupByBarcode = async () => {
    if (!barcode) return setLookupMessage('Please enter or scan a barcode');

    try {
      setLookupMessage(null);
      // First try local products by productNumber
      const local = products.find((p) => p.productNumber === barcode.trim());
      if (local) {
        setFormData(prev => ({ ...prev, productId: local._id as string }));
        setLookupMessage(`Found local product: ${local.name}`);
        return;
      }

      // Fallback to server lookup (may check external sources)
      const res = await axios.get(`/api/products/lookup/${barcode}`);
      const data = res.data;
      if (data.found && data.source === 'openfoodfacts') {
        setLookupMessage('Product found in OpenFoodFacts. Create it from Products > Scan & Add or add manually.');
      } else {
        setLookupMessage('Product not found. You can create it from Products > Scan & Add.');
      }
    } catch (err) {
      console.error('Barcode lookup error', err);
      setLookupMessage('Lookup failed');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, suppliersRes] = await Promise.all([
        axios.get('/api/products'),
        axios.get('/api/suppliers')
      ]);
      setProducts(productsRes.data);
      setSuppliers(suppliersRes.data);
      setError(null);
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.response?.data?.msg || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name === 'price' ? parseFloat(value) : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.supplierId) {
      setError('Please select both product and supplier');
      return;
    }
    
    if (formData.quantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }
    
    if (formData.price <= 0) {
      setError('Price must be greater than zero');
      return;
    }
    
    try {
      setSubmitting(true);
      await axios.post('/api/transactions/purchase', formData);
      navigate('/transactions');
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.response?.data?.msg || 'Error processing purchase');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Receive Inventory</h1>
      </div>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Scan/Paste Barcode</label>
              <div className="flex">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => { setBarcode(e.target.value); setLookupMessage(null); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLookupByBarcode();
                    }
                  }}
                  placeholder="Scan or paste barcode here (press Enter or scan)"
                  title="Scan or paste barcode"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              {lookupMessage && <p className="text-sm text-gray-600 mt-2">{lookupMessage}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Product
              </label>
              <select
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                required
                title="Select product"
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Supplier
              </label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                required
                title="Select supplier"
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            
            {productDetails && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Stock
                  </label>
                  <input
                    type="text"
                    value={productDetails.stock}
                    title="Current stock"
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Number
                  </label>
                  <input
                    type="text"
                    value={productDetails.productNumber}
                    title="Product number"
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
                    disabled
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                title="Quantity"
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
                min="0.01"
                step="0.01"
                title="Price"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              title="Notes (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            ></textarea>
          </div>
          
          {formData.productId && formData.quantity > 0 && formData.price > 0 && (
            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <div className="flex justify-between text-sm font-medium">
                <span>Unit Price:</span>
                <span>${formData.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Quantity:</span>
                <span>{formData.quantity}</span>
              </div>
              <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                <span>Total:</span>
                <span>${(formData.price * formData.quantity).toFixed(2)}</span>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!formData.productId || !formData.supplierId || submitting || formData.quantity <= 0 || formData.price <= 0}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-medium py-2 px-6 rounded-md transition-all disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Purchase Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiveInventory;