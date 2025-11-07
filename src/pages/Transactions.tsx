import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Transaction, ApiError } from '../types';
import { Search, Printer, Eye } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const { settings } = useSettings();

  const formatCurrency = useCallback((v: number) => `${settings.currencySymbol}${v.toFixed(2)}`, [settings.currencySymbol]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/transactions', { params: date ? { date } : {} });
      setTransactions(res.data);
      setError(null);
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || 'Error fetching transactions');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const buildPrintableHtml = useCallback(() => {
    const tableHtml = document.querySelector('[data-report-table]')?.outerHTML || '';
    const totalSales = transactions.filter(t => t.type === 'sale').reduce((acc, t) => acc + t.total, 0);
    const totalPurchases = transactions.filter(t => t.type === 'purchase').reduce((acc, t) => acc + t.total, 0);

    return `
      <html>
        <head>
          <title>Transactions Report - ${date || 'all'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              @page { margin: 1in; }
              body { -webkit-print-color-adjust: exact; color-adjust: exact; }
            }
            body { font-family: 'Inter', sans-serif; }
          </style>
        </head>
        <body class="p-8">
          <header class="flex justify-between items-center pb-4 border-b">
            <div>
              <h1 class="text-2xl font-bold">Transactions Report</h1>
              <p class="text-gray-500">Date: ${date || 'All Dates'}</p>
            </div>
            <div class="text-right">
              <p class="text-sm">Inventory Management</p>
              <p class="text-sm">Generated: ${new Date().toLocaleString()}</p>
            </div>
          </header>
          <main class="mt-8">
            <div class="grid grid-cols-2 gap-4 mb-8">
              <div class="bg-green-100 p-4 rounded-lg">
                <h3 class="font-semibold text-green-800">Total Sales</h3>
                <p class="text-2xl font-bold text-green-900">${formatCurrency(totalSales)}</p>
              </div>
              <div class="bg-red-100 p-4 rounded-lg">
                <h3 class="font-semibold text-red-800">Total Purchases</h3>
                <p class="text-2xl font-bold text-red-900">${formatCurrency(totalPurchases)}</p>
              </div>
            </div>
            ${tableHtml}
          </main>
          <footer class="mt-8 text-center text-gray-500 text-sm">
            <p>Thank you for your business.</p>
          </footer>
        </body>
      </html>
    `;
  }, [transactions, date, formatCurrency]);

  const printReport = () => {
    const html = buildPrintableHtml();
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }
    document.body.removeChild(iframe);
  };

  const filteredTransactions = transactions.filter((transaction) =>
    transaction.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-surface rounded-xl p-6 text-text-primary">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-primary">Transactions</h1>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-background border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 bg-background border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
            title="Filter by date"
          />
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 bg-gray-100 text-text-primary font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
            <Eye size={18} /> Preview
          </button>
          <button onClick={printReport} className="flex items-center gap-2 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors">
            <Printer size={18} /> Print
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowPreview(false)}>
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Report Preview - {date || 'All Dates'}</h3>
              <div className="flex items-center space-x-2">
                <button onClick={printReport} className="flex items-center gap-2 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors">
                  <Printer size={18} /> Print
                </button>
                <button onClick={() => setShowPreview(false)} className="bg-gray-200 hover:bg-gray-300 text-text-primary font-semibold py-2 px-4 rounded-lg transition-colors">Close</button>
              </div>
            </div>
            <div className="p-4 flex-grow overflow-auto">
              <iframe srcDoc={buildPrintableHtml()} className="w-full h-full border-none rounded-b-lg" title="Report Preview" />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-text-secondary">Loading transactions...</div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-20 text-text-secondary">
          <h2 className="text-xl font-semibold">No transactions found</h2>
          <p>There are no transactions for the selected date.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table data-report-table className="min-w-full">
            <thead className="border-b border-border-color">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-text-secondary uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-text-secondary uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-text-secondary uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider">Supplier/Customer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filteredTransactions.map((t) => (
                <tr key={t._id} className="hover:bg-background">
                  <td className="px-6 py-4 whitespace-nowrap text-text-secondary">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      t.type === 'purchase' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">{t.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-text-secondary text-right">{t.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-text-secondary text-right">{formatCurrency(t.price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-text-primary text-right">{formatCurrency(t.total)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-text-secondary">{t.supplierName || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Transactions;