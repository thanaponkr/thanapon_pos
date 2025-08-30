import {onSchedule} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import axios from "axios";

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// !! Important: Edit these 2 lines !!
const LINE_CHANNEL_ACCESS_TOKEN = "d8kCZCQlurCf9/ofYn8rQBnR+vEDPnRFvEhnLHFNKNFeQYDjWVfGmSb16kQwTZKfY6H6Pr6aYyMjP71wcsXnfUCxCIRTfe7mfOkRzxsmXYblDFWO7YfH+i8GoHqAUVEH7gsf/RVaPGBn4dL3YihlUgdB04t89/1O/w1cDnyilFU=";
const YOUR_LINE_USER_ID = "U0f64e4fcee474034365e8b733721f6e0";

interface CartItem {
  name: string;
  quantity: number;
}

export const dailySalesReport = onSchedule(
  {
    schedule: "every day 23:30", // ตั้งเวลาที่คุณต้องการ
    timeZone: "Asia/Bangkok",
  },
  async (event) => {
    logger.info("Starting daily sales report function...");

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const ordersRef = db.collection("orders");
    const query = ordersRef
      .where("createdAt", ">=", startOfToday)
      .where("createdAt", "<=", endOfToday);
    
    const snapshot = await query.get();

    let message = `🔔 สรุปยอดขายร้านปุ๊ปั่นปอก\nประจำวันที่: ${now.toLocaleDateString("th-TH")}\n\n`;

    if (snapshot.empty) {
      message += "วันนี้ไม่มียอดขายครับ";
    } else {
      let totalSales = 0;
      // --- ส่วนที่เพิ่มเข้ามา: สร้างที่เก็บสำหรับนับสินค้า ---
      const productSummary: { [key: string]: number } = {};

      snapshot.forEach((doc) => {
        const orderData = doc.data();
        totalSales += orderData.totalPrice;

        // --- วิ่งไล่ดูสินค้าในแต่ละบิล ---
        if (orderData.items && Array.isArray(orderData.items)) {
          orderData.items.forEach((item: CartItem) => {
            if (productSummary[item.name]) {
              productSummary[item.name] += item.quantity;
            } else {
              productSummary[item.name] = item.quantity;
            }
          });
        }
      });
      
      const orderCount = snapshot.size;

      message += `💰 ยอดขายรวม: ${totalSales.toLocaleString()} บาท\n🧾 จำนวนบิล: ${orderCount} บิล\n\n`;
      message += "📋 รายการที่ขายได้:\n";

      // --- นำข้อมูลที่นับได้มาสร้างเป็นข้อความ ---
      for (const [name, quantity] of Object.entries(productSummary)) {
        message += `- ${name}: ${quantity} แก้ว\n`;
      }
    }

    // --- ส่งข้อความไปที่ LINE ---
    try {
      await axios.post(
        "https://api.line.me/v2/bot/message/push",
        {
          to: YOUR_LINE_USER_ID,
          messages: [{ type: "text", text: message }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
          },
        }
      );
      logger.info("Successfully sent LINE message!");
    } catch (error) {
      logger.error("Error sending LINE message:", error);
    }
  }
);