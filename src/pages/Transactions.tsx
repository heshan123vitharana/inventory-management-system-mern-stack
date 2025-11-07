import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Transaction, ApiError } from '../types';
import { Search } from 'lucide-react';

// Helper to format currency
const formatCurrency = (v: number) => `$${v.toFixed(2)}`;

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [date, setDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const reportRef = useRef<HTMLDivElement | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/transactions', { params: date ? { date } : {} });
      setTransactions(res.data);
      setError(null);
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || error.response?.data?.msg || 'Error fetching transactions');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const loadForDate = async () => {
    await fetchTransactions();
  };

  

  const buildPrintableHtml = () => {
    const tableHtml = document.querySelector('[data-report-table]')?.outerHTML || '';
    return `
      <html>
        <head>
          <title>Daily Transactions - ${date || 'all'}</title>
          <style>
            @media print {
              @page { margin: 20mm }
              body { -webkit-print-color-adjust: exact; color-adjust: exact; }
              header { position: fixed; top: 0; left: 0; right: 0; height: 70px; }
              footer { position: fixed; bottom: 0; left: 0; right: 0; height: 40px; }
              .print-content { margin-top: 90px; margin-bottom: 60px; }
              .page-number:after { content: "Page " counter(page); }
            }
            body { font-family: Arial, Helvetica, sans-serif; margin:20px; color:#1f2937 }
            .report-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px }
            .brand { font-size:18px; font-weight:700; color:#0f172a }
            table{width:100%; border-collapse:collapse}
            th,td{padding:10px;border:1px solid #e5e7eb}
            th{background:#0ea5a5;color:#fff}
            .report-meta { text-align:right; font-size:12px; color:#374151 }
            footer { font-size:12px; color:#6b7280; text-align:right; padding:8px 12px }
          </style>
        </head>
        <body>
          <header>
            <div class="report-header">
              <div class="brand">Inventory Management System</div>
              <div class="report-meta">
                <div>Date: ${date || 'All'}</div>
                <div>Generated: ${new Date().toLocaleString()}</div>
              </div>
            </div>
          </header>
          <div class="print-content">
            ${tableHtml}
          </div>
          <footer>
            <span class="page-number"></span>
          </footer>
        </body>
      </html>
    `;
  };

  const [showPreview, setShowPreview] = React.useState(false);

  const previewReport = () => {
    setShowPreview(true);
  };

  const printReport = () => {
    const html = buildPrintableHtml();
    const w = window.open('', '_blank', 'noopener');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 700);
  };

  const filteredTransactions = transactions.filter((transaction) => 
    transaction.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">TRANSACTIONS</h1>
        
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border rounded"
            title="Filter by date"
          />
          <button onClick={loadForDate} className="px-3 py-2 bg-cyan-600 text-white rounded">Load</button>
          <button onClick={previewReport} className="px-3 py-2 bg-teal-600 text-white rounded">Preview</button>
          <button onClick={printReport} className="px-3 py-2 bg-gray-700 text-white rounded">Print</button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 w-full md:w-64"
          />
        </div>
      </div>
      
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-auto rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Preview - Transactions {date ? `for ${date}` : ''}</h3>
              <div className="flex items-center space-x-2">
                <button onClick={() => printReport()} className="px-3 py-1 bg-gray-800 text-white rounded">Print</button>
                <button onClick={() => setShowPreview(false)} className="px-3 py-1 bg-red-600 text-white rounded">Close</button>
              </div>
            </div>
            <div className="p-4">
              {/* Reuse the same table layout for preview */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Supplier/Customer</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((t) => (
                      <tr key={t._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{t.type === 'purchase' ? 'Purchase' : 'Sale'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{t.productName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{t.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(t.price)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(t.total)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{t.supplierName || 'Customer'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Printable content wrapper */}
        <div ref={reportRef} className="px-4 py-4">
        <div className="overflow-x-auto">
          <table data-report-table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-indigo-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Supplier/Customer
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.type === 'purchase' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {transaction.type === 'purchase' ? 'Purchase' : 'Sale'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(transaction.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {formatCurrency(transaction.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.supplierName || 'Customer'}
                  </td>
                </tr>
              ))}
              
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
          </div>
      </div>
    </div>
  );
};

export default Transactions;