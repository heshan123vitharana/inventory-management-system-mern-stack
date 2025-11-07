import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight,
  LogOut,
  BarChart3,
  Settings,
  User,
  Tags,
  Truck
} from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Products', path: '/products', icon: <Package size={20} /> },
    { name: 'Categories', path: '/categories', icon: <Tags size={20} /> },
    { name: 'Suppliers', path: '/suppliers', icon: <Truck size={20} /> },
    { name: 'Transactions', path: '/transactions', icon: <ArrowLeftRight size={20} /> },
    { name: 'Reports', path: '/report/daily', icon: <BarChart3 size={20} /> },
  ];

  const bottomMenuItems = [
    { name: 'Profile', path: '/profile', icon: <User size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ]

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink: React.FC<{item: {name: string, path: string, icon: React.ReactNode}}> = ({ item }) => (
    <li>
      <a
        href={item.path}
        onClick={(e) => {
          e.preventDefault();
          navigate(item.path);
        }}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
          location.pathname === item.path 
            ? 'bg-primary text-white' 
            : 'text-text-secondary hover:bg-gray-100'
        }`}
      >
        {item.icon}
        <span className="font-medium">{item.name}</span>
      </a>
    </li>
  );

  return (
    <div className="min-h-screen bg-background font-poppins">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-64 bg-surface text-text-primary flex flex-col z-20 border-r border-border-color">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 flex-shrink-0">
          <div className="bg-primary p-2 rounded-lg">
            <LayoutDashboard size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-pacifico text-primary">Ceyleo</h1>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 flex flex-col justify-between p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </ul>
          
          <ul className="space-y-2">
            {bottomMenuItems.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
            <li>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="ml-64">
        {/* Page content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;