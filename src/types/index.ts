export interface User {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  phoneNumber: string;
  role?: string;
  createdAt?: Date;
}

export interface Product {
  _id?: string;
  name: string;
  productNumber: string;
  category: string;
  stock: number;
  price: number;
  description: string;
  imageUrl?: string;
  expirationDate?: Date | string;
  notificationSent?: boolean;
  createdAt?: Date;
}

export interface Category {
  _id?: string;
  name: string;
  createdAt?: Date;
}

export interface Supplier {
  _id?: string;
  name: string;
  email: string;
  phoneNumber: string;
  address?: string;
  createdAt?: Date;
}

export interface Transaction {
  _id?: string;
  type: 'purchase' | 'sale';
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  total: number;
  date: Date;
  userId?: string;
  supplierId?: string;
  supplierName?: string;
  notes?: string;
  createdAt?: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface ApiError {
  response?: {
    data?: {
      message?: string;
      msg?: string;
    };
  };
  message?: string;
}