// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDH9hxXwfJecK9zjNnu13acbWDbgpEoYQ0",
  authDomain: "pukpunpok-pos.firebaseapp.com",
  projectId: "pukpunpok-pos",
  storageBucket: "pukpunpok-pos.firebasestorage.app",
  messagingSenderId: "428198283684",
  appId: "1:428198283684:web:b0b536a8b05e93a77e1931"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
// และ export db ออกไปเพื่อให้ไฟล์อื่นเรียกใช้ได้
export const db = getFirestore(app);