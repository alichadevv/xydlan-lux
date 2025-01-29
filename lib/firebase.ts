import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase, ref, update } from "firebase/database"
import { getStorage } from "firebase/storage"
import { getAnalytics } from "firebase/analytics"
import type { User } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyB6M9U5D0kushojA6KIfmWHOj5UBmyzMOw",
  authDomain: "forumchatchit.firebaseapp.com",
  databaseURL: "https://forumchatchit-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "forumchatchit",
  storageBucket: "forumchatchit.appspot.com",
  messagingSenderId: "932630102853",
  appId: "1:932630102853:web:ac42d48fc7ddfc0ae3b42c",
  measurementId: "G-Q90RXJE4V7",
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const database = getDatabase(app)
const storage = getStorage(app)
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null

export { app, auth, database, storage, analytics }

export const checkAndUpdateUserRole = async (user: User) => {
  if (user.role === "premium" && user.premiumExpiration) {
    const now = Date.now()
    if (now > user.premiumExpiration) {
      await update(ref(database, `users/${user.uid}`), {
        role: "basic",
        premiumExpiration: null,
      })
      return { ...user, role: "basic", premiumExpiration: null }
    }
  }
  return user
}

