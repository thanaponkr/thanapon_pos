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

export const dailySalesReport = onSchedule(
  {
    schedule: "every day 23:30",
    timeZone: "Asia/Bangkok",
  },
  async (event) => {
    logger.info("Starting daily sales report function...", {structuredData: true});

    // --- 1. Define today's time range ---
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // --- 2. Fetch today's orders from Firestore ---
    const ordersRef = db.collection("orders");
    const query = ordersRef
      .where("createdAt", ">=", startOfToday)
      .where("createdAt", "<=", endOfToday);
    
    const snapshot = await query.get();

    let message = `🔔 สรุปยอดขายร้านปุ๊ปั่นปอก\nประจำวันที่: ${now.toLocaleDateString("th-TH")}\n\n`;

    if (snapshot.empty) {
      logger.info("No sales today.", {structuredData: true});
      message += "วันนี้ไม่มียอดขายครับ";
    } else {
      // --- 3. Calculate total sales ---
      let totalSales = 0;
      snapshot.forEach((doc) => {
        totalSales += doc.data().totalPrice;
      });
      const orderCount = snapshot.size;

      // --- 4. Create the message to send ---
      message += `💰 ยอดขายรวม: ${totalSales.toLocaleString()} บาท\n🧾 จำนวนบิล: ${orderCount} บิล`;
    }

    // --- 5. Send the message to LINE ---
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
      logger.info("Successfully sent LINE message!", {structuredData: true});
    } catch (error) {
      logger.error("Error sending LINE message:", error);
    }
    // สังเกตว่าไม่มี return null; แล้ว
  }
);