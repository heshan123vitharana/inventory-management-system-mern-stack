import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, TrendingUp, Package, Users, ShoppingCart, DollarSign } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Transaction {
  _id: string;
  type: 'purchase' | 'sale';
  productName: string;
  supplierName?: string;
  total: number;
  date: string;
}

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalSuppliers: number;
  totalPurchases: number;
  totalSales: number;
  recentTransactions: Transaction[];
  chartData: {
    labels: string[];
    datasets: {
      sales: number[];
      purchases: number[];
    };
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalSuppliers: 0,
    totalPurchases: 0,
    totalSales: 0,
    recentTransactions: [],
    chartData: {
      labels: [],
      datasets: {
        sales: [],
        purchases: []
      }
    }
  });

  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  useEffect(() => {
    const currentDate = new Date();
    setSelectedMonth(currentDate.toLocaleString('default', { month: 'long' }));
    setSelectedYear(currentDate.getFullYear().toString());
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/api/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    }
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: 'Sales and Purchases Overview',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 30
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context: TooltipItem<'line'>) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Month',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Amount ($)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function (value: string | number) {
            return `$${Number(value).toLocaleString()}`;
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3
      },
      point: {
        radius: 6,
        hoverRadius: 8,
        borderWidth: 2,
        hoverBorderWidth: 3
      }
    }
  };

  const chartData = {
    labels: stats.chartData.labels,
    datasets: [
      {
        label: 'Sales',
        data: stats.chartData.datasets.sales,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: 'white',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Purchases',
        data: stats.chartData.datasets.purchases,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Generate months and years for dropdowns
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  // Allow user to select any year in a wide range (past and future).
  // Generate years from currentYear - 50 to currentYear + 50.
  const years: number[] = [];
  const startYear = currentYear - 50;
  const endYear = currentYear + 50;
  for (let y = startYear; y <= endYear; y++) {
    years.push(y);
  }

  return (
    <div className="space-y-6">
      {/* Date selection and chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:space-x-4 mb-6">
          <div className="w-full md:w-1/2 mb-4 md:mb-0">
            <label htmlFor="select-month" className="block text-sm font-medium text-gray-700 mb-2">SELECT MONTH</label>
            <select
              id="select-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              {months.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-1/2">
            <label htmlFor="select-year" className="block text-sm font-medium text-gray-700 mb-2">SELECT YEAR</label>
            <select
              id="select-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-96 w-full">
          <Line options={chartOptions} data={chartData} />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatsCard
          title="Products"
          value={stats.totalProducts}
          icon={<Package className="text-blue-500" />}
          bgColor="bg-blue-100"
        />
        <StatsCard
          title="Categories"
          value={stats.totalCategories}
          icon={<BarChart className="text-purple-500" />}
          bgColor="bg-purple-100"
        />
        <StatsCard
          title="Suppliers"
          value={stats.totalSuppliers}
          icon={<Users className="text-green-500" />}
          bgColor="bg-green-100"
        />
        <StatsCard
          title="Purchases"
          value={stats.totalPurchases}
          icon={<ShoppingCart className="text-yellow-500" />}
          bgColor="bg-yellow-100"
        />
        <StatsCard
          title="Sales"
          value={stats.totalSales}
          icon={<DollarSign className="text-red-500" />}
          bgColor="bg-red-100"
        />
      </div>

      {/* Recent activities */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-6 py-4">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.recentTransactions.length > 0 ? (
            stats.recentTransactions.map((transaction: Transaction) => (
              <div key={transaction._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{transaction.productName}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {transaction.type === 'purchase' ? 'Purchased from' : 'Sold to'}: {transaction.supplierName || 'Customer'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-lg ${transaction.type === 'purchase' ? 'text-red-600' : 'text-green-600'
                      }`}>
                      {transaction.type === 'purchase' ? '-' : '+'} ${transaction.total.toFixed(2)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium">No recent transactions found</p>
              <p className="text-sm">Start by adding products and making transactions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, bgColor }) => (
  <div className={`${bgColor} rounded-lg shadow-md p-6 transition-transform hover:scale-105`}>
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value.toLocaleString()}</p>
      </div>
      <div className="p-3 rounded-full bg-white shadow-sm">
        {icon}
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm text-gray-600">
      <TrendingUp size={16} className="mr-2 text-green-500" />
      <span>Compared to last month</span>
    </div>
  </div>
);

export default Dashboard;