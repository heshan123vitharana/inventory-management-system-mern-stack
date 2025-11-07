import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import axios from 'axios';

const ScanAddProduct: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let codeReader: BrowserMultiFormatReader | null = null;

    const startScanner = async () => {
      codeReader = new BrowserMultiFormatReader();
      try {
        setScanning(true);
        const previewElem = videoRef.current as HTMLVideoElement;
        const deviceId = undefined; // allow browser to choose
        await codeReader.decodeFromVideoDevice(deviceId, previewElem, (result, err) => {
          if (result) {
            const text = result.getText();
            setCode(text);
            stopScanner();
          }
          if (err && !(err as any).message?.includes('No MultiFormat Readers')) {
            // ignore no-read errors
            // console.error(err);
          }
        });
      } catch (err) {
        console.error('Scanner start error', err);
        setScanning(false);
      }
    };

    const stopScanner = () => {
      if (codeReader) {
        try {
          codeReader.reset();
        } catch (e) {}
      }
      setScanning(false);
    };

    if (scanning) startScanner();

    return () => {
      if (codeReader) {
        try { codeReader.reset(); } catch (e) {}
      }
    };
  }, [scanning]);

  useEffect(() => {
    if (!code) return;

    const fetchLookup = async () => {
      try {
        const res = await axios.get(`/api/products/lookup/${code}`);
        setLookupResult(res.data);
      } catch (err) {
        console.error('Lookup error', err);
      }
    };

    fetchLookup();
  }, [code]);

  useEffect(() => {
    // fetch categories for dropdown
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/categories');
        setCategories(res.data);
      } catch (err) {
        // ignore errors - categories are optional here
        console.error('Failed to fetch categories', err);
      }
    };

    fetchCategories();
  }, []);

  const handleAddProduct = async () => {
    if (!lookupResult) return;

    // If product exists locally and source === local, we can increment stock via update
    if (lookupResult.source === 'local') {
      const product = lookupResult.product;
      try {
        await axios.put(`/api/products/${product._id}`, {
          stock: product.stock + quantity
        });
        alert('Quantity added to existing product.');
      } catch (err) {
        console.error(err);
        alert('Failed to update product');
      }
      return;
    }

    // Otherwise create a new product using the returned data. Use selectedCategory from dropdown
    if (!selectedCategory) return alert('Please select a category before creating the product');

    const payload = {
      name: lookupResult.product.name,
      productNumber: lookupResult.product.productNumber,
      category: selectedCategory,
      stock: quantity,
      price: lookupResult.product.price || 0,
      description: lookupResult.product.description || '',
      imageUrl: lookupResult.product.imageUrl || null
    };

    try {
      await axios.post('/api/products', payload);
      alert('Product created and quantity added');
      setLookupResult(null);
      setCode(null);
    } catch (err) {
      console.error(err);
      alert('Failed to create product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Scan product barcode</h3>

        {!scanning && (
          <button onClick={() => setScanning(true)} className="px-4 py-2 bg-cyan-600 text-white rounded">Start scanner</button>
        )}
        {scanning && (
          <div>
            <video ref={videoRef} className="w-full h-64 bg-black" />
            <div className="mt-2">
              <button onClick={() => setScanning(false)} className="px-3 py-1 bg-red-600 text-white rounded">Stop</button>
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Scanned Code or paste manually</label>
          <div className="flex space-x-2">
            <input
              className="mt-1 p-2 border rounded w-full"
              value={code || ''}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Scan a barcode or paste the code here"
            />
            <button onClick={async () => {
              // trigger lookup for whatever code is in the input
              if (!code) return alert('Enter or scan a code first');
              try {
                const res = await axios.get(`/api/products/lookup/${code}`);
                setLookupResult(res.data);
              } catch (err) {
                console.error('Lookup error', err);
                alert('Lookup failed');
              }
            }} className="mt-1 px-3 py-2 bg-cyan-600 text-white rounded">Lookup</button>
          </div>
        </div>

        {lookupResult && (
          <div className="mt-4 bg-gray-50 p-4 rounded">
            {lookupResult.found ? (
              <>
                <p><strong>Source:</strong> {lookupResult.source}</p>
                <p><strong>Name:</strong> {lookupResult.product.name}</p>
                <p><strong>Barcode:</strong> {lookupResult.product.productNumber}</p>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">Quantity to add</label>
                  <input type="number" value={quantity} min={1} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-1 p-2 border rounded w-32" />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700">Select Category</label>
                  <select value={selectedCategory || ''} onChange={(e) => setSelectedCategory(e.target.value || null)} className="mt-1 p-2 border rounded w-full">
                    <option value="">-- Select category --</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-4">
                  <button onClick={handleAddProduct} className="px-4 py-2 bg-green-600 text-white rounded">Add to inventory</button>
                </div>
              </>
            ) : (
              <p>Product not found. You can enter details manually in Add Product page.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanAddProduct;
