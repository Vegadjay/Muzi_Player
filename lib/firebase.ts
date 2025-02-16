import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDr9tmAB03fnSAQwimMPkE-o_Q-jMAWzZE",
  authDomain: "muzi-app-65c2a.firebaseapp.com",
  projectId: "muzi-app-65c2a",
  storageBucket: "muzi-app-65c2a.firebasestorage.app",
  messagingSenderId: "659045825066",
  appId: "1:659045825066:web:d09cd4a13e045109dde153",
  measurementId: "G-487SDHS8K0"
};


const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);