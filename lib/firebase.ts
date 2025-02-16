import { initializeApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCvqJWZoIGudfxWzgadwO1w80Yq9gPnrSw",
  authDomain: "trialaccount-36589.firebaseapp.com",
  databaseURL: "https://trialaccount-36589-default-rtdb.firebaseio.com",
  projectId: "trialaccount-36589",
  storageBucket: "trialaccount-36589.firebasestorage.app",
  messagingSenderId: "201415507837",
  appId: "1:201415507837:web:b1888508b26f0692921614",
  measurementId: "G-7YW3WTNBTL"
};

const app = initializeApp(firebaseConfig);

export const database: Database = getDatabase(app);
