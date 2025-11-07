import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Product, ApiError } from '../types';
import { Barcode, ShoppingCart, DollarSign, Hash, Info, CheckCircle } from 'lucide-react';

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
        if (quantity > product.stock) {
          setQuantity(1);
        }
      }
    } else {
      setProductDetails(null);
    }
  }, [selectedProduct, products, quantity]);

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
      setProducts(res.data.filter((product: Product) => product.stock > 0));
      setError(null);
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || 'Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !productDetails) {
      setError('Please select a product.');
      return;
    }
    if (quantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }
    if (quantity > productDetails.stock) {
      setError(`Quantity cannot exceed available stock of ${productDetails.stock}.`);
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
      setError(error.response?.data?.message || 'Error processing sale.');
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Sell Product</h1>
        <p className="text-text-secondary">Create a new sales transaction.</p>
      </div>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface rounded-xl p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="barcode-input" className="block text-sm font-medium text-text-primary mb-1">
                Scan Barcode
              </label>
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                <input
                  id="barcode-input"
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const prod = products.find((p) => p.productNumber === barcode.trim());
                      if (prod) {
                        setSelectedProduct(prod._id || '');
                        setError(null);
                      } else {
                        setError('Product not found for that barcode.');
                      }
                    }
                  }}
                  placeholder="Scan or type barcode and press Enter"
                  className="w-full pl-10 pr-4 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="product-select" className="block text-sm font-medium text-text-primary mb-1">
                Or Select Product Manually
              </label>
              <select
                id="product-select"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                required
              >
                <option value="">{loading ? 'Loading products...' : 'Select a product'}</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} (Stock: {product.stock})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="quantity-input" className="block text-sm font-medium text-text-primary mb-1">
                Quantity
              </label>
              <input
                id="quantity-input"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max={productDetails?.stock || 1}
                className="w-full px-3 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={!productDetails}
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="notes-input" className="block text-sm font-medium text-text-primary mb-1">
                Notes (optional)
              </label>
              <textarea
                id="notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              ></textarea>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-surface rounded-xl p-6 sticky top-24">
            <h3 className="text-xl font-semibold text-text-primary mb-4 border-b pb-3">Sale Summary</h3>
            {productDetails ? (
              <div>
                <div className="space-y-3 text-sm mb-6">
                  <InfoItem icon={<Info size={16}/>} label="Product" value={productDetails.name} />
                  <InfoItem icon={<Barcode size={16}/>} label="Barcode" value={productDetails.productNumber} />
                  <InfoItem icon={<Hash size={16}/>} label="Available Stock" value={productDetails.stock} />
                  <InfoItem icon={<DollarSign size={16}/>} label="Unit Price" value={`$${productDetails.price.toFixed(2)}`} />
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">Unit Price</span>
                    <span className="font-medium">${productDetails.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">Quantity</span>
                    <span className="font-medium">x {quantity}</span>
                  </div>
                  <div className="border-t my-2"></div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-text-primary">Total</span>
                    <span className="text-primary">${(productDetails.price * quantity).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!selectedProduct || submitting || quantity <= 0}
                  className="w-full mt-6 flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={20} />
                  {submitting ? 'Processing...' : 'Confirm & Sell'}
                </button>
              </div>
            ) : (
              <div className="text-center py-10 text-text-secondary">
                <ShoppingCart size={40} className="mx-auto mb-2" />
                <p>Select a product to see the sale summary.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{icon: React.ReactNode, label: string, value: string | number}> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-text-secondary">
      {icon}
      <span>{label}</span>
    </div>
    <span className="font-semibold text-text-primary">{value}</span>
  </div>
);

export default SellProduct;