import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD-jyl7YyPU2cDLZKZ-kieRUpcb-3ziqEQ",
  authDomain: "walkie-talkie-374a1.firebaseapp.com",
  projectId: "walkie-talkie-374a1",
  storageBucket: "walkie-talkie-374a1.firebasestorage.app",
  messagingSenderId: "31700431360",
  appId: "1:31700431360:web:d3a8b2b278194627909ee5",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
