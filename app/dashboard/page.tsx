"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { ref, onValue } from "firebase/database"
import { auth, database } from "@/lib/firebase"
import Header from "@/app/components/Header"
import Footer from "@/app/components/Footer"
import SourceCodeList from "@/app/components/SourceCodeList"
import DeviceInfo from "@/app/components/DeviceInfo"
import type { User } from "@/lib/types"
import Link from "next/link"
import { MessageSquare } from "lucide-react"

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
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
              role: userData.role,
            })
          }
        })
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white text-xl">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-green-500">Dashboard</h1>
        <p className="text-white mb-4">Welcome, {user.email}!</p>
        <p className="text-white mb-8">
          Your account type: <span className="font-bold text-green-500">{user.role}</span>
        </p>

        <DeviceInfo />

        <Link
          href="/dashboard/ai-chat"
          className="inline-block bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors mb-8"
        >
          <MessageSquare className="inline-block mr-2" size={18} />
          Chat with AI
        </Link>
        <SourceCodeList userRole={user.role} />
      </main>
      <Footer />
    </div>
  )
}

