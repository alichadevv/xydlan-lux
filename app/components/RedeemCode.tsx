"use client"

import { useState } from "react"
import { ref, query, orderByChild, equalTo, get, update, serverTimestamp } from "firebase/database"
import { database, auth } from "@/lib/firebase"
import { toast } from "react-toastify"
import { Gift } from "lucide-react"

export default function RedeemCode() {
  const [code, setCode] = useState("")

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Redeem code function called with code:", code)
    const user = auth.currentUser

    if (!user) {
      toast.error("You must be logged in to redeem a code.")
      return
    }

    if (!code.trim()) {
      toast.error("Please enter a redeem code.")
      return
    }

    const redeemCodesRef = ref(database, "redeemCodes")
    const codeQuery = query(redeemCodesRef, orderByChild("code"), equalTo(code))

    try {
      const snapshot = await get(codeQuery)
      if (snapshot.exists()) {
        const codeData = Object.values(snapshot.val())[0] as any
        const codeId = Object.keys(snapshot.val())[0]

        if (!codeData || !codeId) {
          throw new Error("Invalid code data")
        }

        if (codeData.usageCount >= codeData.usageLimit) {
          toast.error("This code has reached its usage limit.")
          return
        }

        const now = Date.now()
        const expirationTime = now + codeData.duration

        // Update user role
        await update(ref(database, `users/${user.uid}`), {
          role: "premium",
          premiumExpiration: expirationTime,
        })

        // Update code usage
        await update(ref(database, `redeemCodes/${codeId}`), {
          usageCount: (codeData.usageCount || 0) + 1,
          lastUsedBy: user.uid,
          lastUsedAt: serverTimestamp(),
        })

        const durationInDays = Math.ceil(codeData.duration / (1000 * 60 * 60 * 24))
        toast.success(`Code redeemed successfully! You now have premium access for ${durationInDays} days.`)
        setCode("")
      } else {
        toast.error("Invalid redeem code.")
      }
    } catch (error) {
      console.error("Error redeeming code:", error)
      toast.error(`Failed to redeem code: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-green-500 flex items-center">
        <Gift className="mr-2" size={24} />
        Redeem Code
      </h2>
      <form onSubmit={handleRedeem} className="flex items-center">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter redeem code"
          className="flex-grow px-4 py-2 bg-gray-700 text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded-r-md hover:bg-green-600 transition-colors"
        >
          Redeem
        </button>
      </form>
    </div>
  )
}

