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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
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

        // --- ส่วนที่แก้ไข ---
        const productsQuery = query(collection(db, "products"), orderBy("order", "asc"));
        const productSnapshot = await getDocs(productsQuery);
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

  const addToCart = (product: Product) => { /* ... */ };
  const removeFromCart = (productId: string) => { /* ... */ };
  const updateQuantity = (productId: string, amount: number) => { /* ... */ };
  const clearCart = () => { setCart([]); };
  const totalPrice = cart.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  const handleSaveOrder = async () => { /* ... */ };

  // --- แก้ไขส่วน filter ให้ไม่ต้อง sort ซ้ำซ้อน ---
  const filteredProducts = products
    .filter((product) => product.category === selectedCategory);

  if (!isClient || loading) {
    return <div className="flex h-screen w-full items-center justify-center text-2xl font-bold">กำลังโหลดข้อมูลร้าน...</div>;
  }

  return (
    // ... ส่วน JSX ที่เหลือทั้งหมดเหมือนเดิมทุกประการ ...
    <main className="flex flex-col md:flex-row h-screen bg-gray-200 font-sans">
      <div className="w-full md:w-2/3 bg-white p-4 flex flex-col">{/*...*/}</div>
      <div className="w-full md:w-1/3 bg-gray-100 p-4 flex flex-col">{/*...*/}</div>
    </main>
  );
}