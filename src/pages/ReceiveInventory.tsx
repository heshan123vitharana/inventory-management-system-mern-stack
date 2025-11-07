import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Product, Supplier, ApiError } from '../types';
import { Barcode, Package, Truck, Hash, Info, CheckCircle } from 'lucide-react';

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
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.productId) {
      const product = products.find(p => p._id === formData.productId);
      if (product) {
        setProductDetails(product);
        setFormData(prev => ({ ...prev, price: product.price }));
      }
    } else {
      setProductDetails(null);
    }
  }, [formData.productId, products]);

  useEffect(() => {
    if (!barcode) return;
    const prod = products.find((p) => p.productNumber === barcode.trim());
    if (prod) {
      setFormData(prev => ({ ...prev, productId: prod._id as string }));
      setError(null);
    }
  }, [barcode, products]);

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
      setError(error.response?.data?.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['quantity', 'price'].includes(name) ? parseFloat(value) || 0 : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.supplierId) {
      setError('Please select both a product and a supplier.');
      return;
    }
    if (formData.quantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }
    if (formData.price <= 0) {
      setError('Price must be greater than zero.');
      return;
    }
    
    try {
      setSubmitting(true);
      await axios.post('/api/transactions/purchase', formData);
      navigate('/transactions');
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || 'Error processing purchase.');
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Receive Inventory</h1>
        <p className="text-text-secondary">Record a new purchase and update stock levels.</p>
      </div>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface rounded-xl p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="barcode-input" className="block text-sm font-medium text-text-primary mb-1">Scan Barcode</label>
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                  <input
                    id="barcode-input"
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Scan or type barcode"
                    className="w-full pl-10 pr-4 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="product-select" className="block text-sm font-medium text-text-primary mb-1">Product</label>
                <select id="product-select" name="productId" value={formData.productId} onChange={handleChange} required className="w-full px-3 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                  <option value="">{loading ? 'Loading...' : 'Select a product'}</option>
                  {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="supplier-select" className="block text-sm font-medium text-text-primary mb-1">Supplier</label>
                <select id="supplier-select" name="supplierId" value={formData.supplierId} onChange={handleChange} required className="w-full px-3 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                  <option value="">{loading ? 'Loading...' : 'Select a supplier'}</option>
                  {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="quantity-input" className="block text-sm font-medium text-text-primary mb-1">Quantity</label>
                <input id="quantity-input" name="quantity" type="number" value={formData.quantity} onChange={handleChange} min="1" required className="w-full px-3 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label htmlFor="price-input" className="block text-sm font-medium text-text-primary mb-1">Purchase Price (per unit)</label>
                <input id="price-input" name="price" type="number" value={formData.price} onChange={handleChange} min="0.01" step="0.01" required className="w-full px-3 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="notes-input" className="block text-sm font-medium text-text-primary mb-1">Notes (optional)</label>
                <textarea id="notes-input" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
              </div>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-surface rounded-xl p-6 sticky top-24">
            <h3 className="text-xl font-semibold text-text-primary mb-4 border-b pb-3">Purchase Summary</h3>
            {productDetails ? (
              <div>
                <div className="space-y-3 text-sm mb-6">
                  <InfoItem icon={<Package size={16}/>} label="Product" value={productDetails.name} />
                  <InfoItem icon={<Barcode size={16}/>} label="Barcode" value={productDetails.productNumber} />
                  <InfoItem icon={<Hash size={16}/>} label="Current Stock" value={productDetails.stock} />
                  <InfoItem icon={<Truck size={16}/>} label="Supplier" value={suppliers.find(s => s._id === formData.supplierId)?.name || 'N/A'} />
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">Purchase Price</span>
                    <span className="font-medium">${formData.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">Quantity</span>
                    <span className="font-medium">x {formData.quantity}</span>
                  </div>
                  <div className="border-t my-2"></div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-text-primary">Total Cost</span>
                    <span className="text-primary">${(formData.price * formData.quantity).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!formData.productId || !formData.supplierId || submitting || formData.quantity <= 0 || formData.price <= 0}
                  className="w-full mt-6 flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={20} />
                  {submitting ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </div>
            ) : (
              <div className="text-center py-10 text-text-secondary">
                <Info size={40} className="mx-auto mb-2" />
                <p>Select a product and supplier to see the purchase summary.</p>
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
    <span className="font-semibold text-text-primary text-right">{value}</span>
  </div>
);

export default ReceiveInventory;