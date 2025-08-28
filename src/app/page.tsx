'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore"; 
import QRCode from 'qrcode';
import promptpay from 'promptpay-qr';

// Interfaces
interface Category { id: string; name: string; order: number; }
// เพิ่ม imageUrl เข้าไปใน Product Interface
interface Product { id: string; name: string; price: number; category: string; imageUrl?: string; }
interface CartItem extends Product { quantity: number; }

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const fetchData = async () => {
      setLoading(true);
      try {
        const categoriesQuery = query(collection(db, "categories"), orderBy("order"));
        const categorySnapshot = await getDocs(categoriesQuery);
        const categoryList = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
        setCategories(categoryList);
        
        if (categoryList.length > 0) {
          setSelectedCategory(categoryList[0].name);
        }

        const productSnapshot = await getDocs(collection(db, "products"));
        const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        setProducts(productList);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false); 
      }
    };
    fetchData();
  }, []);

  // ... (ฟังก์ชันจัดการ cart ทั้งหมดเหมือนเดิม) ...
  const addToCart = (product: Product) => {
    const existingProductIndex = cart.findIndex(item => item.id === product.id);
    if (existingProductIndex !== -1) {
      updateQuantity(product.id, 1);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };
  const removeFromCart = (productId: string) => { setCart(cart.filter(item => item.id !== productId)); };
  const updateQuantity = (productId: string, amount: number) => {
    const updatedCart = [...cart];
    const productIndex = updatedCart.findIndex(item => item.id === productId);
    if (productIndex !== -1) {
      const newQuantity = updatedCart[productIndex].quantity + amount;
      if (newQuantity <= 0) {
        removeFromCart(productId);
      } else {
        updatedCart[productIndex].quantity = newQuantity;
        setCart(updatedCart);
      }
    }
  };
  const clearCart = () => { setCart([]); };
  const totalPrice = cart.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  const filteredProducts = products.filter(product => product.category === selectedCategory);

  const handleGenerateQR = () => {
    if (cart.length === 0) return;
    const promptpayId = '081-234-5678'; // <-- !! แก้ไขเป็นพร้อมเพย์ของคุณ !!
    const payload = promptpay(promptpayId, { amount: totalPrice });
    QRCode.toDataURL(payload, (err, url) => {
      if (err) { console.error(err); return; }
      setQrCodeData(url);
      setIsModalOpen(true);
    });
  };

  const handleConfirmPayment = async () => {
    try {
      const orderData = {
        totalPrice: totalPrice,
        items: cart,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "orders"), orderData);
      alert("บันทึกการขายสำเร็จ!");
      clearCart();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("เกิดข้อผิดพลาดในการบันทึกการขาย");
    }
  };

  if (!isClient || loading) {
    return <div className="flex h-screen w-full items-center justify-center text-2xl font-bold">กำลังโหลดข้อมูลร้าน...</div>;
  }

  return (
    <main className="flex flex-col md:flex-row h-screen bg-gray-200 font-sans">
      
      <div className="w-full md:w-2/3 bg-white p-4 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">เลือกหมวดหมู่</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((category) => (
            <button key={category.id} onClick={() => setSelectedCategory(category.name)} className={`text-white font-bold text-lg py-4 px-2 rounded-lg shadow-md transition-all ${selectedCategory === category.name ? 'bg-blue-700 ring-4 ring-blue-300' : 'bg-blue-500 hover:bg-blue-600'}`}>
              {category.name}
            </button>
          ))}
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg flex-grow overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">เลือกสินค้า ({selectedCategory || ''})</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              // --- นี่คือส่วนที่แก้ไข ---
              <button key={product.id} onClick={() => addToCart(product)} className="bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 transition-colors text-center flex flex-col justify-between">
                {/* ส่วนรูปภาพ */}
                <div className="w-full h-24 bg-gray-200 rounded-t-lg flex items-center justify-center">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover rounded-t-lg" />
                  ) : (
                    <span className="text-gray-400 text-xs">No Image</span>
                  )}
                </div>
                
                {/* ส่วนข้อความ */}
                <div className="p-2 flex flex-col justify-center flex-grow">
                  <span className="font-semibold text-gray-800 text-sm">{product.name}</span>
                  <span className="text-xs text-gray-600">{product.price} บาท</span>
                  
                  {/* --- บรรทัดสำหรับทดสอบ --- */}
                  <span className="text-xs text-red-500 break-all">{product.imageUrl}</span>
                </div>
              </button>
              // --- สิ้นสุดส่วนที่แก้ไข ---
            ))}
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/3 bg-gray-100 p-4 flex flex-col">
        {/* ... (ส่วนโค้ดด้านขวาเหมือนเดิม) ... */}
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">รายการสั่งซื้อ</h2>
            <button onClick={clearCart} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">ล้างบิล</button>
        </div>
        <div className="flex-grow bg-white rounded-lg p-4 overflow-y-auto">{/* ... */}</div>
        <div className="mt-4 pt-4 border-t-2 border-dashed">{/* ... */}</div>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">{/* ... */}</div>
      )}
    </main>
  );
}