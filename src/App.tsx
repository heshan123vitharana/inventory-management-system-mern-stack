import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import Transactions from './pages/Transactions';
import SellProduct from './pages/SellProduct';
import ReceiveInventory from './pages/ReceiveInventory';
import Profile from './pages/Profile';
import ScanAddProduct from './pages/ScanAddProduct';
import DailyReport from './pages/DailyReport';
import Settings from './pages/Settings';

// Layout component
import Layout from './components/Layout';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/products" element={
              <PrivateRoute>
                <Layout>
                  <Products />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/products/scan" element={
              <PrivateRoute>
                <Layout>
                  <ScanAddProduct />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/products/add" element={
              <PrivateRoute>
                <Layout>
                  <AddProduct />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/products/edit/:id" element={
              <PrivateRoute>
                <Layout>
                  <EditProduct />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/categories" element={
              <PrivateRoute>
                <Layout>
                  <Categories />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/suppliers" element={
              <PrivateRoute>
                <Layout>
                  <Suppliers />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/transactions" element={
              <PrivateRoute>
                <Layout>
                  <Transactions />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/report/daily" element={
              <PrivateRoute>
                <Layout>
                  <DailyReport />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/sell" element={
              <PrivateRoute>
                <Layout>
                  <SellProduct />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/purchase" element={
              <PrivateRoute>
                <Layout>
                  <ReceiveInventory />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Layout>
                  <Profile />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute>
                <Layout>
                  <Settings />
                </Layout>
              </PrivateRoute>
            } />
          </Routes>
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;