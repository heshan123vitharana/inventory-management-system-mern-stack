import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../types';
import { User, Mail, Phone, Lock, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, loading: authLoading, checkUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      setSubmittingProfile(true);
      await axios.put('/api/users/profile', {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber
      });
      await checkUser(); // Re-fetch user to update context
      setSuccess('Profile updated successfully');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'Error updating profile');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    try {
      setSubmittingPassword(true);
      await axios.put('/api/users/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setSuccess('Password updated successfully');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'Error updating password');
    } finally {
      setSubmittingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">My Profile</h1>
        <p className="text-text-secondary">Manage your personal information and password.</p>
      </div>
      
      {success && <Alert type="success" message={success} />}
      {error && <Alert type="error" message={error} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface rounded-xl p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4 border-b border-border-color pb-3">Profile Information</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <InputField icon={<User size={20}/>} label="Name" name="name" value={formData.name} onChange={handleChange} required />
            <InputField icon={<Mail size={20}/>} label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <InputField icon={<Phone size={20}/>} label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={submittingProfile}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submittingProfile ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {submittingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-surface rounded-xl p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4 border-b border-border-color pb-3">Change Password</h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <InputField icon={<Lock size={20}/>} label="Current Password" name="currentPassword" type="password" value={formData.currentPassword} onChange={handleChange} required />
            <InputField icon={<Lock size={20}/>} label="New Password" name="newPassword" type="password" value={formData.newPassword} onChange={handleChange} required minLength={6} />
            <InputField icon={<Lock size={20}/>} label="Confirm New Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required minLength={6} />
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={submittingPassword || !formData.currentPassword || !formData.newPassword || formData.newPassword !== formData.confirmPassword}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submittingPassword ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {submittingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
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
  minLength?: number;
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

interface AlertProps {
  type: 'success' | 'error';
  message: string;
}

const Alert: React.FC<AlertProps> = ({ type, message }) => {
  const bgColor = type === 'success' ? 'bg-green-100' : 'bg-red-100';
  const borderColor = type === 'success' ? 'border-green-400' : 'border-red-400';
  const textColor = type === 'success' ? 'text-green-700' : 'text-red-700';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`${bgColor} border ${borderColor} ${textColor} px-4 py-3 rounded-lg mb-4 flex items-center gap-3`}>
      <Icon size={20} />
      <span>{message}</span>
    </div>
  );
};

export default Profile;