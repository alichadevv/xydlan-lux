"use client"

import { useState, useEffect } from "react"
import { ref, onValue, query, orderByChild } from "firebase/database"
import { onAuthStateChanged } from "firebase/auth"
import { auth, database } from "@/lib/firebase"
import Link from "next/link"
import { Download, Lock } from "lucide-react"
import SearchBar from "./SearchBar"
import type { SourceCode, User } from "@/lib/types"

export default function SourceCodeList() {
  const [sourceCodes, setSourceCodes] = useState<SourceCode[]>([])
  const [filteredCodes, setFilteredCodes] = useState<SourceCode[]>([])
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const sourceCodesRef = ref(database, "sourceCodes")
    const recentCodesQuery = query(sourceCodesRef, orderByChild("createdAt"))

    const unsubscribe = onValue(recentCodesQuery, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const codesArray = Object.entries(data).map(([id, code]: [string, any]) => ({
          id,
          ...code,
        }))
        setSourceCodes(codesArray.reverse())
        setFilteredCodes(codesArray)
      }
    })

    const authUnsubscribe = onAuthStateChanged(auth, (authUser) => {
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
        setUser(null)
      }
    })

    return () => {
      unsubscribe()
      authUnsubscribe()
    }
  }, [])

  const handleSearch = (query: string) => {
    const lowercaseQuery = query.toLowerCase()
    const filtered = sourceCodes.filter(
      (code) =>
        code.title.toLowerCase().includes(lowercaseQuery) || code.content.toLowerCase().includes(lowercaseQuery),
    )
    setFilteredCodes(filtered)
  }

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6 text-green-500">Source Codes</h2>
      <SearchBar onSearch={handleSearch} />
      {filteredCodes.length > 0 ? (
        <div className="space-y-6">
          {filteredCodes.map((code) => (
            <div key={code.id} className="bg-gray-800 rounded-lg p-6 shadow-lg">
              {code.imageUrl && (
                <img
                  src={code.imageUrl || "/placeholder.svg"}
                  alt={code.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-xl font-semibold mb-2 text-white">
                {code.title}
                {code.isPremium && (
                  <span className="ml-2 text-yellow-500">
                    <Lock size={16} className="inline-block" /> Premium
                  </span>
                )}
              </h3>
              <p className="text-gray-300">{code.content.substring(0, 150)}...</p>
              <div className="flex justify-between items-center mt-4">
                <div>
                  <p className="text-sm text-gray-400">{new Date(code.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-400">Downloads: {code.downloadCount}</p>
                </div>
                <div className="space-x-2">
                  {code.scriptUrl &&
                    (user && (user.role === "premium" || !code.isPremium) ? (
                      <Link
                        href={`/download/${code.id}`}
                        className="inline-flex items-center bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-colors"
                      >
                        <Download className="mr-1" size={16} />
                        Download
                      </Link>
                    ) : (
                      <span className="inline-flex items-center bg-gray-600 text-gray-300 px-3 py-1 rounded-md cursor-not-allowed">
                        <Lock className="mr-1" size={16} />
                        {user ? "Premium Only" : "Login to Download"}
                      </span>
                    ))}
                  <Link href={`/blog/${code.slug}`} className="text-green-500 hover:text-green-400">
                    Read more
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-300">No source codes available.</p>
      )}
    </section>
  )
}

