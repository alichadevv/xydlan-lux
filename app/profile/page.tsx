"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { ref, onValue, update } from "firebase/database"
import { auth, database } from "@/lib/firebase"
import Header from "@/app/components/Header"
import Footer from "@/app/components/Footer"
import type { User } from "@/lib/types"
import { MessageCircle, Clock } from "lucide-react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import RedeemCode from "@/app/components/RedeemCode"

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState("")
  const [showUpgradeNotification, setShowUpgradeNotification] = useState(false)
  const [premiumTimeLeft, setPremiumTimeLeft] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        const userRef = ref(database, `users/${authUser.uid}`)
        onValue(userRef, (snapshot) => {
          const userData = snapshot.val()
          if (userData) {
            setUser({
              uid: authUser.uid,
              email: authUser.email!,
              username: userData.username,
              role: userData.role,
              premiumExpiration: userData.premiumExpiration,
            })
            setUsername(userData.username)
            updatePremiumTimeLeft(userData.premiumExpiration)
          }
        })
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const timer = setInterval(() => {
      if (user && user.premiumExpiration) {
        updatePremiumTimeLeft(user.premiumExpiration)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [user])

  const updatePremiumTimeLeft = (expirationTime: number | undefined) => {
    if (!expirationTime) {
      setPremiumTimeLeft(null)
      return
    }

    const now = Date.now()
    const timeLeft = expirationTime - now

    if (timeLeft <= 0) {
      setPremiumTimeLeft(null)
      if (user && user.role === "premium") {
        update(ref(database, `users/${user.uid}`), { role: "basic", premiumExpiration: null })
      }
    } else {
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
      setPremiumTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }
  }

  const handleUpgrade = () => {
    setShowUpgradeNotification(true)
  }

  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      await update(ref(database, `users/${user.uid}`), { username })
      toast.success("Username updated successfully!")
    } catch (error) {
      console.error("Error updating username:", error)
      toast.error("Failed to update username. Please try again.")
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <Header />
      <ToastContainer />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-green-500">User Profile</h1>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <p className="text-white mb-4">
            <strong>Email:</strong> {user.email}
          </p>
          <form onSubmit={handleUsernameChange} className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <div className="flex items-center">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-grow px-3 py-2 bg-gray-700 text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <button
                type="submit"
                className="bg-green-500 text-white py-2 px-4 rounded-r-md hover:bg-green-600 transition-colors"
              >
                Update
              </button>
            </div>
          </form>
          <p className="text-white mb-4">
            <strong>Role:</strong> {user.role}
          </p>
          {user.role === "premium" && premiumTimeLeft && (
            <p className="text-white mb-4 flex items-center">
              <Clock className="mr-2" size={18} />
              <strong>Premium Time Left:</strong> {premiumTimeLeft}
            </p>
          )}
          {user.role === "basic" && (
            <button
              onClick={handleUpgrade}
              className="bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors"
            >
              Upgrade to Premium
            </button>
          )}
          {user.role === "premium" && !premiumTimeLeft && (
            <p className="text-green-500">You have a permanent premium account. Enjoy access to all source codes!</p>
          )}
        </div>
        <RedeemCode />
      </main>
      <Footer />
      {showUpgradeNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-green-500">Upgrade to Premium</h2>
            <p className="text-white mb-4">Upgrade your account to access all premium content!</p>
            <p className="text-white mb-4">Price: Rp10.000/Permanent</p>
            <a
              href="https://wa.me/6285736486023"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors text-center mb-4"
            >
              <MessageCircle className="inline-block mr-2" size={20} />
              Buy via WhatsApp
            </a>
            <button
              onClick={() => setShowUpgradeNotification(false)}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

