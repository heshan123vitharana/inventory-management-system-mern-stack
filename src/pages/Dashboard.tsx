import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSettings } from '../context/SettingsContext';
import { Package, Folder, Truck, ArrowRightLeft } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
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
  const { settings } = useSettings();
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

  useEffect(() => {
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

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#2D3748',
        bodyColor: '#718096',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function (context: TooltipItem<'bar'>) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y).replace('$', settings.currencySymbol);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#718096',
          font: {
            family: "'Poppins', sans-serif",
          }
        },
        border: {
          color: '#E2E8F0',
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#E2E8F0',
        },
        ticks: {
          color: '#718096',
          font: {
            family: "'Poppins', sans-serif",
          },
          callback: function(value) {
            if (Number(value) >= 1000) {
              return `${settings.currencySymbol}` + (Number(value) / 1000) + 'K';
            }
            return `${settings.currencySymbol}` + value;
          }
        },
        border: {
          display: false,
        }
      },
    },
    elements: {
      bar: {
        backgroundColor: 'rgba(74, 144, 226, 0.5)',
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(74, 144, 226, 0.8)',
      }
    }
  };

  const chartData = {
    labels: stats.chartData.labels,
    datasets: [
      {
        label: 'Sales',
        data: stats.chartData.datasets.sales,
        backgroundColor: 'rgba(80, 227, 194, 0.5)',
        hoverBackgroundColor: 'rgba(80, 227, 194, 0.8)',
        borderColor: 'rgba(80, 227, 194, 1)',
        borderWidth: 1,
        barThickness: 15,
        borderRadius: 4,
      },
      {
        label: 'Purchases',
        data: stats.chartData.datasets.purchases,
        backgroundColor: 'rgba(245, 166, 35, 0.5)',
        hoverBackgroundColor: 'rgba(245, 166, 35, 0.8)',
        borderColor: 'rgba(245, 166, 35, 1)',
        borderWidth: 1,
        barThickness: 15,
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="p-4 bg-background text-text-primary font-poppins">
      <h1 className="text-2xl font-bold mb-4 text-primary">Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Left Column */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard title="Total Products" value={stats.totalProducts.toLocaleString()} icon={<Package size={20} className="text-primary" />} />
            <StatsCard title="Total Categories" value={stats.totalCategories.toLocaleString()} icon={<Folder size={20} className="text-accent" />} />
            <StatsCard title="Total Suppliers" value={stats.totalSuppliers.toLocaleString()} icon={<Truck size={20} className="text-secondary" />} />
          </div>

          <div className="bg-surface rounded-xl p-4 shadow-md flex-grow">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Sales & Purchases Overview</h2>
            <div className="h-80">
              <Bar options={chartOptions} data={chartData} />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-surface rounded-xl p-4 shadow-md">
            <h2 className="text-lg font-semibold text-text-primary mb-3">Financial Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-text-secondary text-sm">Total Sales</span>
                <span className="font-semibold text-green-500 text-sm">+{settings.currencySymbol}{stats.totalSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-text-secondary text-sm">Total Purchases</span>
                <span className="font-semibold text-red-500 text-sm">-{settings.currencySymbol}{stats.totalPurchases.toFixed(2)}</span>
              </div>
              <div className="border-t border-border-color my-1"></div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary">Net Profit</span>
                <span className="font-bold text-primary">{settings.currencySymbol}{(stats.totalSales - stats.totalPurchases).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl p-4 shadow-md flex-grow">
            <h2 className="text-lg font-semibold text-text-primary mb-3">Recent Transactions</h2>
            <div className="space-y-3">
              {stats.recentTransactions.map(t => (
                <div key={t._id} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-background">
                  <div className={`p-1.5 rounded-full ${t.type === 'sale' ? 'bg-green-100' : 'bg-red-100'}`}>
                    <ArrowRightLeft size={16} className={`${t.type === 'sale' ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-text-primary text-xs">{t.productName}</p>
                    <p className="text-xs text-text-secondary">{t.type === 'sale' ? 'Sold' : `From ${t.supplierName}`}</p>
                  </div>
                  <p className={`font-semibold text-xs ${t.type === 'sale' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'sale' ? '+' : '-'}{settings.currencySymbol}{t.total.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon }) => (
  <div className="bg-surface rounded-xl p-4 flex items-center gap-3 shadow-md transition-all duration-300 hover:shadow-lg hover:border-border-color border border-transparent">
    <div className="p-2 bg-background rounded-lg">
      {icon}
    </div>
    <div>
      <h3 className="text-xs font-medium text-text-secondary">{title}</h3>
      <p className="text-xl font-bold text-text-primary mt-1">{value}</p>
    </div>
  </div>
);

export default Dashboard;