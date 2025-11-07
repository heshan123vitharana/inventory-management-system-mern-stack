import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Supplier, ApiError } from '../types';
import { Edit, Trash2, Plus, Search } from 'lucide-react';

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Supplier>({
    name: '',
    email: '',
    phoneNumber: '',
    address: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = suppliers.filter(item =>
      item.name.toLowerCase().includes(lowercasedFilter) ||
      item.email.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredSuppliers(filteredData);
  }, [searchTerm, suppliers]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/suppliers');
      setSuppliers(res.data);
      setFilteredSuppliers(res.data);
      setError(null);
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || 'Error fetching suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phoneNumber: '', address: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/suppliers/${editingId}`, formData);
      } else {
        await axios.post('/api/suppliers', formData);
      }
      resetForm();
      setShowForm(false);
      fetchSuppliers(); // Refetch all suppliers
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || 'Error saving supplier');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData(supplier);
    setEditingId(supplier._id!);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await axios.delete(`/api/suppliers/${id}`);
      fetchSuppliers(); // Refetch all suppliers
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || 'Error deleting supplier');
    }
  };

  return (
    <div className="bg-surface rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Suppliers</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} /> Add Supplier
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-border-color">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            {editingId ? 'Edit Supplier' : 'Add New Supplier'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <InputField label="Name" name="name" value={formData.name} onChange={handleChange} required />
              <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              <InputField label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
              <InputField label="Address" name="address" value={formData.address || ''} onChange={handleChange} />
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 hover:bg-gray-300 text-text-primary font-semibold py-2 px-6 rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary/90 transition-colors">{editingId ? 'Update' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-text-secondary">Loading suppliers...</div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-20 text-text-secondary">
          <h2 className="text-xl font-semibold">No suppliers found</h2>
          <p>Add your first supplier to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-border-color">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">{supplier.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-text-secondary">{supplier.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-text-secondary">{supplier.phoneNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-text-secondary">{supplier.address || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-4">
                    <button onClick={() => handleEdit(supplier)} className="text-primary hover:text-primary/80" title="Edit"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(supplier._id!)} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const InputField: React.FC<{label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, required?: boolean}> = 
({ label, name, value, onChange, type = 'text', required = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-text-primary mb-1">{label}</label>
    <input
      id={name}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      required={required}
    />
  </div>
);

export default Suppliers;