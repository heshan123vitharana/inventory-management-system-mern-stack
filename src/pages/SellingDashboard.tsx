import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { Product } from '../types';
import { useSettings } from '../context/SettingsContext';

interface CartItem extends Product {
  cartQuantity: number;
}

const SellingDashboard = () => {
  const { settings } = useSettings();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  const normalizeProduct = useCallback((rawProduct: Partial<Product & { price: number; stock: number; productNumber: string }>): Product => {
    return {
      _id: rawProduct._id || '',
      name: rawProduct.name || '',
      barcode: rawProduct.barcode || rawProduct.productNumber || '',
      sellingPrice: rawProduct.sellingPrice ?? rawProduct.price ?? 0,
      quantity: rawProduct.quantity ?? rawProduct.stock ?? 0,
      supplier: rawProduct.supplier || '',
      category: rawProduct.category || '',
      costPrice: rawProduct.costPrice ?? 0,
      expiryDate: rawProduct.expiryDate || '',
    };
  }, []);

  const applyProductDetails = useCallback((product: Product) => {
    setSelectedProduct(product);
    setSelectedQuantity(1);
    setInputValue(product.name);
    setSuggestions([]);
    setError(null);
    setIsScannerActive(false);
  }, []);

  const fetchProductById = useCallback(async (productId: string) => {
    if (!productId) return;
    setIsFetchingProduct(true);
    try {
      const response = await axios.get(`/api/products/${productId}`);
      const normalized = normalizeProduct(response.data);
      applyProductDetails(normalized);
    } catch (err) {
      setError('Error fetching product details.');
      console.error(err);
    } finally {
      setIsFetchingProduct(false);
    }
  }, [applyProductDetails, normalizeProduct]);

  const fetchProductByBarcode = useCallback(async (barcode: string) => {
    if (!barcode) return;
    setIsFetchingProduct(true);
    setError(null);
    try {
      const response = await axios.get(`/api/products/barcode/${barcode}`);
      const normalized = normalizeProduct(response.data);
      applyProductDetails(normalized);
      setScannedCode(barcode);
    } catch (err) {
      setError(`Product with barcode ${barcode} not found.`);
      console.error(err);
    } finally {
      setIsFetchingProduct(false);
    }
  }, [applyProductDetails, normalizeProduct]);

  useEffect(() => {
    if (!isScannerActive) return;

    const scanner = new Html5QrcodeScanner('reader', { qrbox: { width: 250, height: 250 }, fps: 5 }, false);
    const onScanSuccess = (decodedText: string) => {
      fetchProductByBarcode(decodedText);
    };
    const onScanError = () => { /* ignored */ };
    scanner.render(onScanSuccess, onScanError);

    return () => {
      scanner.clear().catch(error => console.error('Failed to clear scanner.', error));
    };
  }, [isScannerActive, fetchProductByBarcode]);

  useEffect(() => {
    const trimmed = inputValue.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const debounceTimer = setTimeout(() => {
      const fetchSuggestions = async () => {
        try {
          const response = await axios.get(`/api/products/search?q=${encodeURIComponent(trimmed)}`);
          const results: Product[] = response.data.map(normalizeProduct);
          setSuggestions(results);
        } catch (err) {
          console.error('Suggestion fetch error:', err);
          setSuggestions([]);
        }
      };
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [inputValue, normalizeProduct]);

  const addProductToCart = useCallback(() => {
    if (!selectedProduct || selectedQuantity <= 0) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === selectedProduct._id);
      if (existingItem) {
        return prevCart.map(item =>
          item._id === selectedProduct._id
            ? { ...item, cartQuantity: item.cartQuantity + selectedQuantity }
            : item
        );
      }
      return [...prevCart, { ...selectedProduct, cartQuantity: selectedQuantity }];
    });

    setSelectedProduct(null);
    setSelectedQuantity(1);
    setInputValue('');
    setSuggestions([]);
  }, [selectedProduct, selectedQuantity]);

  const updateCartQuantity = useCallback((productId: string, newQuantity: number) => {
    setCart(prevCart => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => item._id !== productId);
      }
      return prevCart.map(item =>
        item._id === productId ? { ...item, cartQuantity: newQuantity } : item
      );
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item._id !== productId));
  }, []);

  const totalAmount = useMemo(() => {
    return cart.reduce((total, item) => total + (item.sellingPrice ?? 0) * item.cartQuantity, 0);
  }, [cart]);

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setError("Cart is empty.");
      return;
    }
    try {
      const transaction = {
        products: cart.map(item => ({ product: item._id, quantity: item.cartQuantity, price: item.sellingPrice })),
        totalAmount: totalAmount,
        type: 'sale',
      };
      await axios.post('/api/transactions', transaction);

      alert("Sale Completed!");
      setCart([]);
      setError(null);
      setInputValue('');
      setSelectedProduct(null);
    } catch (err) {
      setError('Failed to complete sale.');
      console.error(err);
    }
  };

  const handleSubmitSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (/^\d{5,}$/.test(trimmed)) { 
      await fetchProductByBarcode(trimmed);
    } else {
        if (suggestions.length > 0) {
            await fetchProductById(suggestions[0]._id);
        } else {
            setError("No product selected or found from suggestions.");
        }
    }
  };

  const selectedLineTotal = useMemo(() => {
    if (!selectedProduct) return '0.00';
    const unitPrice = selectedProduct.sellingPrice ?? 0;
    return (unitPrice * selectedQuantity).toFixed(2);
  }, [selectedProduct, selectedQuantity]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white p-5 rounded-lg shadow-sm max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Selling Dashboard</h1>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        
        <div className="mb-6">
          <form onSubmit={handleSubmitSearch} className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="w-full md:flex-1">
              <label htmlFor="product-search" className="block text-lg font-semibold text-gray-700 mb-1">Lookup Product</label>
              <div className="relative">
                <input
                  id="product-search"
                  type="text"
                  value={inputValue}
                  onChange={event => setInputValue(event.target.value)}
                  placeholder="Enter product name or barcode"
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  autoComplete="off"
                />
                {suggestions.length > 0 && (
                  <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-md mt-1 shadow-md">
                    {suggestions.map(product => (
                      <li
                        key={product._id}
                        onMouseDown={() => fetchProductById(product._id)}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <p className="font-medium text-gray-800">{product.name}</p>
                        <p className="text-sm text-gray-500">Barcode: {product.barcode ?? 'N/A'}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2.5 rounded-md font-semibold hover:bg-primary-dark min-w-[120px]"
                disabled={isFetchingProduct}
              >
                {isFetchingProduct ? 'Finding...' : 'Find Product'}
              </button>
              <button
                type="button"
                onClick={() => setIsScannerActive(prev => !prev)}
                className={`px-4 py-2.5 rounded-md font-semibold min-w-[120px] ${isScannerActive ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-secondary text-white hover:bg-secondary/80'}`}
              >
                {isScannerActive ? 'Stop Scanner' : 'Scan Barcode'}
              </button>
            </div>
          </form>
        </div>

        {selectedProduct && (
          <div className="mb-8 bg-gray-100 p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{selectedProduct.name}</h2>
                <p className="text-sm text-gray-500">Barcode: {selectedProduct.barcode}</p>
                <p className="text-sm text-gray-500 mt-1">In stock: {selectedProduct.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-base text-gray-600">Unit Price</p>
                <p className="text-xl font-bold text-gray-800">{settings.currencySymbol}{(selectedProduct.sellingPrice ?? 0).toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col md:flex-row md:items-end gap-4">
              <div>
                <label htmlFor="selected-quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  id="selected-quantity"
                  type="number"
                  min={1}
                  value={selectedQuantity}
                  onChange={e => setSelectedQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-32 p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="md:ml-auto">
                <p className="text-sm text-gray-500">Line Total</p>
                <p className="text-xl font-bold text-gray-800">{settings.currencySymbol}{selectedLineTotal}</p>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={addProductToCart}
                  className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-md font-semibold"
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setInputValue('');
                  }}
                  className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-md font-semibold hover:bg-gray-200"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Barcode Scanner</h2>
            {isScannerActive ? (
              <div>
                <div id="reader" className="w-full max-w-md mx-auto border border-dashed border-gray-300 rounded-md p-3"></div>
                {scannedCode && <p className="text-center text-green-600 mt-3">Last scanned: {scannedCode}</p>}
              </div>
            ) : (
              <p className="text-gray-500 bg-gray-100 border border-dashed border-gray-300 rounded-md p-4 text-center">
                Scanner is inactive.
              </p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Shopping Cart</h2>
            <div className="bg-gray-100 p-3 rounded-lg min-h-[140px]">
              {cart.length === 0 ? (
                <p className="text-gray-500">No items added yet.</p>
              ) : (
                <ul className="space-y-2">
                  {cart.map(item => (
                    <li key={item._id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center border-b border-gray-200 pb-2">
                      <div>
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">Barcode: {item.barcode}</p>
                      </div>
                      <p className="text-sm text-gray-600">{settings.currencySymbol}{(item.sellingPrice ?? 0).toFixed(2)}</p>
                      <input
                        type="number"
                        min={1}
                        value={item.cartQuantity}
                        onChange={e => updateCartQuantity(item._id, parseInt(e.target.value, 10) || 1)}
                        aria-label={`Quantity for ${item.name}`}
                        className="w-20 p-2 border border-gray-300 rounded-md"
                      />
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">{settings.currencySymbol}{((item.sellingPrice ?? 0) * item.cartQuantity).toFixed(2)}</p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item._id)}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center text-xl font-bold text-gray-800">
                <span>Total:</span>
                <span>{settings.currencySymbol}{totalAmount.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCompleteSale}
                className="w-full mt-3 bg-green-500 text-white py-3 rounded-lg text-base font-semibold hover:bg-green-600 transition-colors"
                disabled={cart.length === 0}
              >
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellingDashboard;
