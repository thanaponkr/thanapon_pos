'use client';

import { useState, useEffect } from 'react';
// 1. Import เครื่องมือใหม่สำหรับ "การเขียน" ข้อมูล
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore"; 

// ... (ส่วน Interface เหมือนเดิม) ...
interface Category { id: string; name: string; order: number; }
interface Product { id: string; name: string; price: number; category: string; }
interface CartItem extends Product { quantity: number; }

export default function Home() {
  // ... (ส่วน State และฟังก์ชัน fetchData เหมือนเดิม) ...
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const categoriesQuery = query(collection(db, "categories"), orderBy("order"));
      const categorySnapshot = await getDocs(categoriesQuery);
      const categoryList = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
      setCategories(categoryList);
      
      if (categoryList.length > 0 && !selectedCategory) {
        setSelectedCategory(categoryList[0].name);
      }

      const productSnapshot = await getDocs(collection(db, "products"));
      const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(productList);

      setLoading(false);
    };
    fetchData();
  }, []);

  // ... (ฟังก์ชันจัดการ cart เหมือนเดิม) ...
  const addToCart = (product: Product) => {
    const existingProductIndex = cart.findIndex(item => item.id === product.id);
    if (existingProductIndex !== -1) {
      updateQuantity(product.id, 1);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

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

  const clearCart = () => {
    setCart([]);
  };
  
  const totalPrice = cart.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  const filteredProducts = products.filter(product => product.category === selectedCategory);

  // --- 2. สร้างฟังก์ชันใหม่สำหรับ "คิดเงิน" ---
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("กรุณาเพิ่มสินค้าลงในตะกร้าก่อน");
      return;
    }

    try {
      // สร้าง "เอกสารการขาย" 1 ชิ้น
      const orderData = {
        totalPrice: totalPrice,
        items: cart,
        createdAt: serverTimestamp() // บันทึกเวลาที่ขาย ณ ตอนนั้น
      };

      // ส่งเอกสารนี้ไปเก็บใน Collection "orders"
      await addDoc(collection(db, "orders"), orderData);
      
      alert("บันทึกการขายสำเร็จ!");
      clearCart(); // ล้างตะกร้าเพื่อรับลูกค้าคนต่อไป
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("เกิดข้อผิดพลาดในการบันทึกการขาย");
    }
  };

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center text-2xl font-bold">กำลังเชื่อมต่อฐานข้อมูล...</div>;
  }

  return (
    <main className="flex flex-col md:flex-row h-screen bg-gray-200 font-sans">
      
      <div className="w-full md:w-2/3 bg-white p-4 flex flex-col">
        {/* ... (ส่วนโค้ดด้านซ้ายเหมือนเดิม) ... */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">เลือกหมวดหมู่</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((category) => (<button key={category.id} onClick={() => setSelectedCategory(category.name)} className={`text-white font-bold text-lg py-4 px-2 rounded-lg shadow-md transition-all ${selectedCategory === category.name ? 'bg-blue-700 ring-4 ring-blue-300' : 'bg-blue-500 hover:bg-blue-600'}`}>{category.name}</button>))}
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg flex-grow overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">เลือกสินค้า ({selectedCategory || ''})</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (<button key={product.id} onClick={() => addToCart(product)} className="bg-green-500 text-white font-semibold p-4 rounded-lg shadow hover:bg-green-600 transition-colors text-center">{product.name}<br /><span className="text-sm font-normal">{product.price} บาท</span></button>))}
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/3 bg-gray-100 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">รายการสั่งซื้อ</h2>
            <button onClick={clearCart} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">ล้างบิล</button>
        </div>
        <div className="flex-grow bg-white rounded-lg p-4 overflow-y-auto">
          {cart.length === 0 ? (<p className="text-gray-500 text-center mt-10">ยังไม่มีรายการ</p>) : (cart.map((item, index) => (<div key={index} className="flex justify-between items-center mb-2 border-b pb-2"><div><span className="font-semibold">{item.name}</span><div className="flex items-center gap-2 mt-1"><button onClick={() => updateQuantity(item.id, -1)} className="bg-gray-300 w-6 h-6 rounded-full font-bold">-</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="bg-gray-300 w-6 h-6 rounded-full font-bold">+</button></div></div><div className="flex items-center gap-4"><span className='font-semibold'>{item.price * item.quantity} บาท</span><button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div></div>)))}
        </div>
        <div className="mt-4 pt-4 border-t-2 border-dashed">
          <div className="flex justify-between items-center text-2xl font-bold mb-4">
            <span>รวมทั้งหมด:</span>
            <span>{totalPrice} บาท</span>
          </div>
          {/* --- 3. เพิ่มปุ่ม "คิดเงิน" --- */}
          <button 
            onClick={handleCheckout} 
            className="w-full bg-green-500 text-white font-bold text-2xl py-4 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400"
            disabled={cart.length === 0}
          >
            ยืนยันการขาย
          </button>
        </div>
      </div>
    </main>
  )
}