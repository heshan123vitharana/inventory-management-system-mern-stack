import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Product, Category, ApiError } from '../types';
import { UploadCloud, Package, Tag, Layers, Hash, DollarSign, Calendar, FileText, ArrowLeft, Loader2 } from 'lucide-react';

const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<Partial<Product>>({});
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductAndCategories = async () => {
      try {
        setLoading(true);
        const [productRes, categoriesRes] = await Promise.all([
          axios.get(`/api/products/${id}`),
          axios.get('/api/categories')
        ]);
        
        const product = productRes.data;
        if (product.expirationDate) {
          product.expirationDate = new Date(product.expirationDate).toISOString().split('T')[0];
        }
        
        setFormData(product);
        setCategories(categoriesRes.data);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.response?.data?.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndCategories();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['stock', 'price'].includes(name) ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await axios.put(`/api/products/${id}`, formData);
      navigate('/products');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'Error updating product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Edit Product</h1>
          <p className="text-text-secondary">Update the details for {formData.name || 'this product'}.</p>
        </div>
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 bg-surface hover:bg-background text-text-primary font-medium py-2 px-4 rounded-lg transition-colors border border-border-color"
        >
          <ArrowLeft size={16} />
          Back to Products
        </button>
      </div>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
      
      <div className="bg-surface rounded-xl p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField icon={<Package size={20}/>} label="Product Name" name="name" value={formData.name || ''} onChange={handleChange} required />
            <InputField icon={<Tag size={20}/>} label="Product Number" name="productNumber" value={formData.productNumber || ''} onChange={handleChange} required />
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-text-primary mb-1">Category</label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                <select
                  id="category"
                  name="category"
                  value={formData.category || ''}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none appearance-none bg-white"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>
            </div>

            <InputField icon={<Hash size={20}/>} label="Stock Quantity" name="stock" type="number" value={formData.stock ?? ''} onChange={handleChange} required min="0" />
            <InputField icon={<DollarSign size={20}/>} label="Price" name="price" type="number" value={formData.price ?? ''} onChange={handleChange} required min="0" step="0.01" />
            <InputField icon={<Calendar size={20}/>} label="Expiration Date" name="expirationDate" type="date" value={(formData.expirationDate as string) || ''} onChange={handleChange} />
            <InputField icon={<FileText size={20}/>} label="Image URL (optional)" name="imageUrl" type="url" value={formData.imageUrl || ''} onChange={handleChange} />

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-1">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              ></textarea>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 w-full md:w-auto bg-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadCloud size={20} />
              {submitting ? 'Saving...' : 'Save Changes'}
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

export default EditProduct;