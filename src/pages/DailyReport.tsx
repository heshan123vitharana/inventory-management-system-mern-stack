import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Transaction } from '../types';

const DailyReport: React.FC = () => {
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
    // Use window.print() to allow user to print or save as PDF
    // But first, we can open a new window with printable content for better control
    if (!reportRef.current) return;
    const html = `
      <html>
        <head>
          <title>Daily Transactions Report - ${date}</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; margin: 20px; color: #1f2937; }
            .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
            .brand { font-size:20px; font-weight:700; color:#0f172a; }
            .meta { text-align:right; }
            table { width:100%; border-collapse: collapse; margin-top:10px; }
            th, td { padding:12px 10px; border:1px solid #e5e7eb; }
            th { background: linear-gradient(90deg,#06b6d4, #0ea5a5); color:#fff; text-align:left; }
            tr:nth-child(even) td { background:#fbfbfd; }
            .total { font-weight:700; }
            .right { text-align:right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">Inventory Management System</div>
            <div class="meta">
              <div>Date: ${date}</div>
              <div>Generated: ${new Date().toLocaleString()}</div>
            </div>
          </div>

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
                    <td class="right">$${t.price.toFixed(2)}</td>
                    <td class="right">$${t.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="margin-top:20px; display:flex; justify-content:flex-end;">
            <div style="text-align:right;">
              <div>Grand Total:</div>
              <div class="total">$${transactions.reduce((s, t) => s + (t.total || 0), 0).toFixed(2)}</div>
            </div>
          </div>

        </body>
      </html>
    `;

    const w = window.open('', '_blank', 'noopener');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    // allow rendering then call print
    setTimeout(() => {
      w.print();
    }, 500);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Daily Transactions Report</h1>
        <div className="flex items-center space-x-3">
          <label htmlFor="report-date" className="sr-only">Report Date</label>
          <input
            id="report-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border rounded"
          />
          <button
            onClick={() => fetchReport(date)}
            className="px-4 py-2 bg-cyan-600 text-white rounded"
          >
            Load
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-teal-600 text-white rounded"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div ref={reportRef} className="bg-white rounded-lg shadow-md p-6">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Transactions for {date}</h2>
              <p className="text-sm text-gray-600">Total items: {transactions.length}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-cyan-600 text-white">
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Product</th>
                    <th className="px-4 py-2 text-left">Qty</th>
                    <th className="px-4 py-2 text-right">Unit Price</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr key={t._id} className="odd:bg-white even:bg-gray-50">
                      <td className="px-4 py-2">{i + 1}</td>
                      <td className="px-4 py-2">{t.type}</td>
                      <td className="px-4 py-2">{t.productName}</td>
                      <td className="px-4 py-2">{t.quantity}</td>
                      <td className="px-4 py-2 text-right">${t.price.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">${t.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end items-center">
              <div className="text-right">
                <div className="text-sm text-gray-600">Grand Total</div>
                <div className="text-xl font-bold">${transactions.reduce((s, t) => s + (t.total || 0), 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReport;
