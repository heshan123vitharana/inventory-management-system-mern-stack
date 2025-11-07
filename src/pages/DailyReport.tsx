import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Transaction } from '../types';
import { Calendar, Printer, Loader2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const DailyReport: React.FC = () => {
  const { settings } = useSettings();
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const fetchReport = useCallback(async (d?: string) => {
    try {
      setLoading(true);
      const res = await axios.get('/api/transactions', { params: { date: d || date } });
      setTransactions(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrint = () => {
    if (!reportRef.current) return;
    const grandTotal = transactions.reduce((s, t) => s + (t.total || 0), 0).toFixed(2);
    const html = `
      <html>
        <head>
          <title>Daily Transactions Report - ${date}</title>
          <style>
            body { font-family: 'Poppins', sans-serif; margin: 20px; color: #2D3748; }
            .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom: 2px solid #E2E8F0; padding-bottom: 10px; }
            .brand { font-size:24px; font-weight:700; color:#4A90E2; }
            .meta { text-align:right; font-size: 14px; color: #718096; }
            table { width:100%; border-collapse: collapse; margin-top:20px; }
            th, td { padding:12px 15px; border:1px solid #E2E8F0; text-align: left; }
            th { background-color: #F8F9FA; font-weight: 600; }
            tr:nth-child(even) { background-color: #F8F9FA; }
            .total { font-weight:700; font-size: 1.2em; }
            .right { text-align:right; }
            .footer { margin-top:30px; padding-top: 15px; border-top: 2px solid #E2E8F0; display:flex; justify-content:flex-end; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">IMS</div>
            <div class="meta">
              <div><b>Report Date:</b> ${date}</div>
              <div><b>Generated:</b> ${new Date().toLocaleString()}</div>
            </div>
          </div>
          <h2>Daily Transactions Report</h2>
          <div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th class="right">Unit Price</th>
                  <th class="right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${transactions.map((t, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${t.type}</td>
                    <td>${t.productName || ''}</td>
                    <td>${t.quantity}</td>
                    <td class="right">${settings.currencySymbol}${t.price.toFixed(2)}</td>
                    <td class="right">${settings.currencySymbol}${t.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
                 ${transactions.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding: 20px;">No transactions found for this date.</td></tr>` : ''}
              </tbody>
            </table>
          </div>
          <div class="footer">
            <div style="text-align:right;">
              <div>Grand Total:</div>
              <div class="total">${settings.currencySymbol}${grandTotal}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const grandTotal = transactions.reduce((s, t) => s + (t.total || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-text-primary">Daily Transactions Report</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
            <input
              id="report-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <button
            onClick={() => fetchReport(date)}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Load'}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-secondary text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-secondary/90 transition-colors"
          >
            <Printer size={20} />
            Print / PDF
          </button>
        </div>
      </div>

      <div ref={reportRef} className="bg-surface rounded-xl shadow-lg p-6">
        {loading ? (
          <div className="text-center py-10">
            <Loader2 className="animate-spin text-primary mx-auto" size={32} />
            <p className="mt-2 text-text-secondary">Loading Report...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : (
          <div>
            <div className="mb-4 pb-4 border-b border-border-color">
              <h2 className="text-xl font-semibold text-text-primary">Transactions for {date}</h2>
              <p className="text-sm text-text-secondary">Total items: {transactions.length}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border-color">
                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Product</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold text-text-secondary">Unit Price</th>
                    <th className="px-4 py-3 text-right font-semibold text-text-secondary">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? (
                    transactions.map((t, i) => (
                      <tr key={t._id} className="border-b border-border-color last:border-b-0 hover:bg-background">
                        <td className="px-4 py-3">{i + 1}</td>
                        <td className="px-4 py-3 capitalize">{t.type}</td>
                        <td className="px-4 py-3 font-medium text-text-primary">{t.productName}</td>
                        <td className="px-4 py-3">{t.quantity}</td>
                        <td className="px-4 py-3 text-right">{settings.currencySymbol}{t.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-text-primary">{settings.currencySymbol}{t.total.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-text-secondary">
                        No transactions found for this date.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-4 border-t border-border-color flex justify-end items-center">
              <div className="text-right">
                <div className="text-sm text-text-secondary">Grand Total</div>
                <div className="text-2xl font-bold text-primary">{settings.currencySymbol}{grandTotal.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReport;
