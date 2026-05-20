import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyA5IY4Z9RulucnlfhnYh4DGswbpmBgxw2A",
  authDomain: "sistemaderifas-4dd07.firebaseapp.com",
  projectId: "sistemaderifas-4dd07",
  storageBucket: "sistemaderifas-4dd07.firebasestorage.app",
  messagingSenderId: "790799804815",
  appId: "1:790799804815:web:6bb9e2a2805d2bd81bc3fa"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
