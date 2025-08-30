'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore"; 

// Interfaces
interface Category { id: string; name: string; order: number; }
interface Product { id: string; name: string; price: number; category: string; imageUrl?: string; order?: number; }
interface CartItem extends Product { quantity: number; }

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Effect สำหรับดึงข้อมูล Categories
  useEffect(() => {
    setIsClient(true);
    const fetchCategories = async () => {
      try {
        const categoriesQuery = query(collection(db, "categories"), orderBy("order"));
        const categorySnapshot = await getDocs(categoriesQuery);
        const categoryList = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
        setCategories(categoryList);
        if (categoryList.length > 0) {
          setSelectedCategory(categoryList[0].name);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Effect สำหรับดึงข้อมูล Products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsQuery = query(collection(db, "products"), orderBy("order", "asc"));
        const productSnapshot = await getDocs(productsQuery);
        const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false); 
      }
    };
    fetchProducts();
  }, []);

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
  
  const filteredProducts = products.filter((product) => product.category === selectedCategory);

  const handleSaveOrder = async () => {
    if (cart.length === 0) {
      alert("กรุณาเพิ่มสินค้าลงในตะกร้าก่อน");
      return;
    }
    try {
      const orderData = {
        totalPrice: totalPrice,
        items: cart,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "orders"), orderData);
      alert("บันทึกการขายสำเร็จ!");
      clearCart();
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
        {/* ... (ส่วนแสดงหมวดหมู่และสินค้า) ... */}
      </div>

      <div className="w-full md:w-1/3 bg-gray-100 p-4 flex flex-col">
        {/* ... (ส่วนแสดงรายการในบิล) ... */}
        <div className="mt-4 pt-4 border-t-2 border-dashed">
          <div className="flex justify-between items-center text-2xl font-bold text-gray-800 mb-4">
            <span>รวมทั้งหมด:</span>
            <span>{totalPrice.toLocaleString()} บาท</span>
          </div>
          <button 
            onClick={handleSaveOrder} 
            className="w-full bg-green-500 text-white font-bold text-2xl py-4 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400"
            disabled={cart.length === 0}
          >
            บันทึกการขาย
          </button>
        </div>
      </div>
    </main>
  );
}