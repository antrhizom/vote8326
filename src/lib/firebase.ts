// Firebase Configuration

import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyD1Q3oKoHxher3PStsuqzS3gXxP6d534b4",
  authDomain: "abstimmung-3-26-dc4d7.firebaseapp.com",
  projectId: "abstimmung-3-26-dc4d7",
  storageBucket: "abstimmung-3-26-dc4d7.firebasestorage.app",
  messagingSenderId: "627299478123",
  appId: "1:627299478123:web:66b1f01a9e5e9e9f005f2e"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
