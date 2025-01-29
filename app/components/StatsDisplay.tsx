"use client"

import { useState, useEffect } from "react"
import { ref, onValue, increment, set } from "firebase/database"
import { database } from "@/lib/firebase"

export default function StatsDisplay() {
  const [stats, setStats] = useState({
    users: 0,
    visitors: 0,
  })

  useEffect(() => {
    // Listen for users count
    const usersRef = ref(database, "users")
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const usersCount = snapshot.size || 0
      setStats((prev) => ({ ...prev, users: usersCount }))
    })

    // Listen for visitors count
    const visitorsRef = ref(database, "stats/visitors")
    const unsubscribeVisitors = onValue(visitorsRef, (snapshot) => {
      const visitorsCount = snapshot.val() || 0
      setStats((prev) => ({ ...prev, visitors: visitorsCount }))
    })

    // Increment visitors count
    const incrementVisitors = async () => {
      const visitorsRef = ref(database, "stats/visitors")
      try {
        // Check if this is a new session
        const hasVisited = sessionStorage.getItem("hasVisited")
        if (!hasVisited) {
          await set(visitorsRef, increment(1))
          sessionStorage.setItem("hasVisited", "true")
        }
      } catch (error) {
        console.error("Error incrementing visitors:", error)
      }
    }

    incrementVisitors()

    return () => {
      unsubscribeUsers()
      unsubscribeVisitors()
    }
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(0)}M+`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K+`
    }
    return num.toString()
  }

  return (
    <div className="flex justify-center items-center gap-16 bg-gray-800 p-8 rounded-lg shadow-lg">
      <div className="text-center">
        <div className="text-6xl font-bold text-green-500 mb-2">{formatNumber(stats.users)}</div>
        <div className="text-xl text-green-500">Users</div>
      </div>
      <div className="w-px h-20 bg-gray-700" /> {/* Divider */}
      <div className="text-center">
        <div className="text-6xl font-bold text-green-500 mb-2">{formatNumber(stats.visitors)}</div>
        <div className="text-xl text-green-500">Visitors</div>
      </div>
    </div>
  )
}

