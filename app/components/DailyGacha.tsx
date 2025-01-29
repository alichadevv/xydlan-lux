"use client"

import { useState, useEffect } from "react"
import { ref, get, set, push, serverTimestamp } from "firebase/database"
import { database, auth } from "@/lib/firebase"
import type { User } from "@/lib/types"
import { Gift } from "lucide-react"
import { toast } from "react-toastify"

function generateRedeemCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export default function DailyGacha() {
  const [user, setUser] = useState<User | null>(null)
  const [lastGachaTime, setLastGachaTime] = useState<number | null>(null)
  const [gachaResult, setGachaResult] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        const userRef = ref(database, `users/${authUser.uid}`)
        get(userRef).then((snapshot) => {
          const userData = snapshot.val()
          if (userData) {
            setUser({
              uid: authUser.uid,
              email: authUser.email!,
              username: userData.username,
              role: userData.role,
            })
            setLastGachaTime(userData.lastGachaTime || null)
          }
        })
      } else {
        setUser(null)
        setLastGachaTime(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const canPlayGacha = () => {
    if (!lastGachaTime) return true
    const now = Date.now()
    const oneDayInMs = 24 * 60 * 60 * 1000
    return now - lastGachaTime > oneDayInMs
  }

  const playGacha = async () => {
    if (!user || !canPlayGacha()) return

    const gachaChance = Math.random()
    let result = ""

    if (gachaChance < 0.25) {
      const redeemCode = generateRedeemCode()
      const redeemRef = ref(database, "redeemCodes")
      await push(redeemRef, {
        code: redeemCode,
        duration: 1 * 60 * 60 * 1000, // 1 hour in milliseconds
        createdAt: serverTimestamp(),
        createdBy: "system",
        isUsed: false,
      })

      result = `Congratulations! You've won a redeem code for 1 hour of premium access: ${redeemCode}`

      // Save the prize to user's gachaPrizes
      const userGachaPrizesRef = ref(database, `users/${user.uid}/gachaPrizes`)
      await push(userGachaPrizesRef, {
        type: "redeemCode",
        code: redeemCode,
        timestamp: serverTimestamp(),
      })
    } else {
      result = "Better luck next time! Try again tomorrow."
    }

    setGachaResult(result)
    await set(ref(database, `users/${user.uid}/lastGachaTime`), serverTimestamp())
    setLastGachaTime(Date.now())

    toast.success("Daily gacha played successfully!")
  }

  if (!user || user.role !== "basic") return null

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-green-500 mb-4">Daily Gacha</h2>
      {canPlayGacha() ? (
        <button
          onClick={playGacha}
          className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors flex items-center"
        >
          <Gift className="mr-2" />
          Play Daily Gacha
        </button>
      ) : (
        <p className="text-gray-400">
          You can play the gacha again in{" "}
          {Math.ceil((lastGachaTime! + 24 * 60 * 60 * 1000 - Date.now()) / (60 * 60 * 1000))} hours.
        </p>
      )}
      {gachaResult && (
        <div className="mt-4 p-4 bg-gray-700 rounded-lg">
          <p className="text-white">{gachaResult}</p>
        </div>
      )}
    </div>
  )
}

