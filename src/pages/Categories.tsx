import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Category, ApiError } from '../types';
import { Edit, Trash2, Plus, Layers, Loader2 } from 'lucide-react';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/categories');
      setCategories(res.data);
      setError(null);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'Error fetching categories');
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      setSubmitting(true);
      const res = await axios.post('/api/categories', { name: newCategory });
      setCategories([...categories, res.data]);
      setNewCategory('');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'Error adding category');
    } finally {
      setSubmitting(false);
    }
  };

  const updateCategory = async (id: string, name: string) => {
    if (editCategory?.name === name) {
      setEditCategory(null);
      return;
    }
    try {
      await axios.put(`/api/categories/${id}`, { name });
      setCategories(categories.map(cat =>
        cat._id === id ? { ...cat, name } : cat
      ));
      setEditCategory(null);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'Error updating category');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure? This will also affect all products in this category.')) return;

    try {
      await axios.delete(`/api/categories/${id}`);
      setCategories(categories.filter(cat => cat._id !== id));
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'Error deleting category');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Product Categories</h1>
        <p className="text-text-secondary">Organize your products by grouping them into categories.</p>
      </div>

      <div className="bg-surface rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-text-primary">All Categories</h2>
          <form onSubmit={addCategory} className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-4 py-2 w-64 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="Add new category name"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Plus size={20} /> {submitting ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-text-secondary bg-background rounded-lg">
            <Layers size={48} className="mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold text-text-primary">No Categories Found</h2>
            <p>Get started by adding your first product category using the form above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-border-color">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider">
                    Category Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-sm font-semibold text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {categories.map((category) => (
                  <tr key={category._id} className="hover:bg-background">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editCategory?._id === category._id ? (
                        <input
                          type="text"
                          value={editCategory.name}
                          onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                          className="w-full px-3 py-1.5 border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          onBlur={() => {
                            if (editCategory.name.trim()) {
                              updateCategory(category._id!, editCategory.name);
                            } else {
                              setEditCategory(null);
                            }
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && editCategory.name.trim()) {
                              updateCategory(category._id!, editCategory.name);
                            }
                          }}
                          autoFocus
                          title={`Edit category name for ${category.name}`}
                        />
                      ) : (
                        <span className="font-medium text-text-primary">{category.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => setEditCategory(category)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => deleteCategory(category._id!)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;