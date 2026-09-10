// firebase-config.js
// ---------------------------------------------------------------
// Replace the values below with the config object from your own
// Firebase project (Project settings → General → Your apps → SDK
// setup and configuration → Config). See README.md, Step 2.
// ---------------------------------------------------------------

export const firebaseConfig = {
  apiKey: "AIzaSyD9k5AMVn0MD36tuaNLMhGVjVqDVm9xsMM",
  authDomain: "sv-tv-signage.firebaseapp.com",
  projectId: "sv-tv-signage",
  storageBucket: "sv-tv-signage.firebasestorage.app",
  messagingSenderId: "55329890104",
  appId: "1:55329890104:web:4c449d113f58c71b6d2bcd"
};

// Firestore location of the single "live config" document that both
// pages read/write. Change this if you want to run several boards
// (e.g. one per showroom) from the same Firebase project.
export const CONFIG_COLLECTION = "digitalSignage";
export const CONFIG_DOC = "config";
