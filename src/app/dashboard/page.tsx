'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore"; 

interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  totalPrice: number;
  createdAt: Timestamp;
  items: OrderItem[];
}

// Interface สำหรับเมนูขายดี
interface TopProduct {
  name: string;
  quantity: number;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const password = searchParams.get('password');
  const isAuthorized = password === process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalSales: 0, orderCount: 0 });
  // 1. สร้าง State ใหม่สำหรับเก็บข้อมูลเมนูขายดี
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }

    const fetchTodaysOrders = async () => {
      try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const ordersQuery = query(collection(db, "orders"), where("createdAt", ">=", startOfToday));
        
        const querySnapshot = await getDocs(ordersQuery);
        const todaysOrders = querySnapshot.docs.map(doc => ({
          id: doc.id, ...doc.data()
        })) as Order[];
        
        const totalSales = todaysOrders.reduce((sum, order) => sum + order.totalPrice, 0);
        const orderCount = todaysOrders.length;
        setSummary({ totalSales, orderCount });

        // --- 2. อัลกอริทึมวิเคราะห์หาเมนูขายดี ---
        const productCounts: { [key: string]: number } = {};
        
        // วิ่งไล่ดูทุกออเดอร์
        todaysOrders.forEach(order => {
          // ในแต่ละออเดอร์ ก็วิ่งไล่ดูสินค้าทุกชิ้น
          order.items.forEach(item => {
            // ถ้าเจอชื่อสินค้านี้แล้ว ให้บวกจำนวนเพิ่ม
            if (productCounts[item.name]) {
              productCounts[item.name] += item.quantity;
            } else {
              // ถ้ายังไม่เจอ ให้จดชื่อใหม่แล้วเริ่มนับ
              productCounts[item.name] = item.quantity;
            }
          });
        });

        // แปลงผลลัพธ์ที่นับได้ ไปจัดเรียงลำดับ
        const sortedProducts = Object.entries(productCounts)
          .map(([name, quantity]) => ({ name, quantity }))
          .sort((a, b) => b.quantity - a.quantity); // เรียงจากมากไปน้อย
        
        setTopProducts(sortedProducts.slice(0, 5)); // เอาแค่ 5 อันดับแรก

      } catch (error) {
        console.error("Error fetching orders: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysOrders();
  }, [isAuthorized]);

  if (!isAuthorized) {
    return <div className="flex h-screen w-full items-center justify-center bg-gray-800 text-white"><h1 className="text-2xl font-bold">Access Denied</h1></div>;
  }
  if (loading) {
    return <div className="p-8"><h1 className="text-3xl font-bold">Dashboard - สรุปยอดขาย</h1><p className="mt-2 text-gray-600">กำลังดึงข้อมูล...</p></div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard - สรุปยอดขาย</h1>
      <p className="mt-2 text-gray-600">ข้อมูลสรุป ณ วันที่ {new Date().toLocaleDateString('th-TH')}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-sm font-medium text-gray-500">ยอดขายวันนี้</h2>
          <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalSales.toLocaleString()} บาท</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-sm font-medium text-gray-500">จำนวนออเดอร์ (วันนี้)</h2>
          <p className="text-3xl font-bold text-gray-900 mt-2">{summary.orderCount} บิล</p>
        </div>
      </div>

      {/* --- 3. ส่วนแสดงผล "เมนูขายดี" --- */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">5 เมนูขายดีที่สุด (วันนี้)</h2>
        <div>
          {topProducts.length > 0 ? (
            <ul className="space-y-3">
              {topProducts.map((product, index) => (
                <li key={product.name} className="flex justify-between items-center text-gray-700">
                  <span>{index + 1}. {product.name}</span>
                  <span className="font-bold">{product.quantity} แก้ว</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">ยังไม่มีข้อมูลการขายสำหรับวันนี้</p>
          )}
        </div>
      </div>
    </div>
  )
}