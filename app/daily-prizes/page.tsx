"use client"

import { useState, useEffect } from "react"
import { ref, onValue } from "firebase/database"
import { database, auth } from "@/lib/firebase"
import Header from "@/app/components/Header"
import Footer from "@/app/components/Footer"
import { useRouter } from "next/navigation"

interface GachaPrize {
  id: string
  type: string
  code: string
  timestamp: number
}

export default function DailyPrizesPage() {
  const [prizes, setPrizes] = useState<GachaPrize[]>([])
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const prizesRef = ref(database, `users/${user.uid}/gachaPrizes`)
        onValue(prizesRef, (snapshot) => {
          const data = snapshot.val()
          if (data) {
            const prizesArray = Object.entries(data).map(([id, prize]: [string, any]) => ({
              id,
              ...prize,
            }))
            setPrizes(prizesArray.sort((a, b) => b.timestamp - a.timestamp))
          } else {
            setPrizes([])
          }
        })
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center text-green-500">Your Daily Gacha Prizes</h1>
        {prizes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prizes.map((prize) => (
              <div key={prize.id} className="bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-green-400 mb-2">
                  {prize.type === "redeemCode" ? "Premium Access Code" : "Unknown Prize"}
                </h3>
                {prize.type === "redeemCode" && <p className="text-white mb-2">Code: {prize.code}</p>}
                <p className="text-gray-400">Won on: {new Date(prize.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-white">You haven't won any prizes yet. Try your luck with the Daily Gacha!</p>
        )}
      </main>
      <Footer />
    </div>
  )
}

