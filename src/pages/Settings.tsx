import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Settings: React.FC = () => {
  const { settings, setSettings } = useSettings();
  const [lowStockThreshold, setLowStockThreshold] = useState(settings.lowStockThreshold);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);

  const handleSave = () => {
    setSettings({
      lowStockThreshold,
      currencySymbol,
    });
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="p-6 bg-background text-text-primary min-h-screen">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <h1 className="text-3xl font-bold mb-6 text-primary">Settings</h1>
      <div className="max-w-2xl mx-auto bg-surface p-8 rounded-lg shadow-lg">
        <div className="space-y-6">
          <div>
            <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-text-secondary mb-2">
              Low Stock Threshold
            </label>
            <input
              type="number"
              id="lowStockThreshold"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              className="w-full px-4 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-gray-400 mt-1">
              Get a warning when a product's stock falls below this number.
            </p>
          </div>
          <div>
            <label htmlFor="currencySymbol" className="block text-sm font-medium text-text-secondary mb-2">
              Currency Symbol
            </label>
            <select
              id="currencySymbol"
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="$">USD ($)</option>
              <option value="€">EUR (€)</option>
              <option value="£">GBP (£)</option>
              <option value="¥">JPY (¥)</option>
              <option value="₹">INR (₹)</option>
              <option value="A$">AUD (A$)</option>
              <option value="C$">CAD (C$)</option>
              <option value="CHF">CHF (CHF)</option>
              <option value="CN¥">CNY (CN¥)</option>
              <option value="HK$">HKD (HK$)</option>
              <option value="NZ$">NZD (NZ$)</option>
              <option value="SEK">SEK (kr)</option>
              <option value="KRW">KRW (₩)</option>
              <option value="SGD">SGD (S$)</option>
              <option value="NOK">NOK (kr)</option>
              <option value="MX$">MXN (MX$)</option>
              <option value="BRL">BRL (R$)</option>
              <option value="RUB">RUB (₽)</option>
              <option value="ZAR">ZAR (R)</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              The currency symbol to be used across the application.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
