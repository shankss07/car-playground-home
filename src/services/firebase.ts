import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAUPOs9Uc2J5fNtWPYifYY2c9qofxyB8q8",
  authDomain: "chase-it-up.firebaseapp.com",
  projectId: "chase-it-up",
  storageBucket: "chase-it-up.firebasestorage.app",
  messagingSenderId: "503856550057",
  appId: "1:503856550057:web:4f93369dd0ac7e48a399b8",
  measurementId: "G-C57GS82XS5",
  databaseURL: "https://chase-it-up-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
console.log("Check firebase app", app,database);
