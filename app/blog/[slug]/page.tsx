"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ref, query, orderByChild, equalTo, onValue } from "firebase/database"
import { onAuthStateChanged } from "firebase/auth"
import { auth, database } from "@/lib/firebase"
import Header from "@/app/components/Header"
import Footer from "@/app/components/Footer"
import { Download, Lock } from "lucide-react"
import Link from "next/link"
import type { SourceCode, User } from "@/lib/types"

export default function SourceCodePage() {
  const [sourceCode, setSourceCode] = useState<SourceCode | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const { slug } = useParams()

  useEffect(() => {
    const sourceCodesRef = ref(database, "sourceCodes")
    const codeQuery = query(sourceCodesRef, orderByChild("slug"), equalTo(slug))

    const unsubscribe = onValue(codeQuery, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const codeId = Object.keys(data)[0]
        const codeData = data[codeId]
        setSourceCode({ id: codeId, ...codeData })
      } else {
        setSourceCode(null)
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
  }, [slug])

  if (!sourceCode) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <article className="bg-gray-800 rounded-lg p-6 shadow-lg">
          {sourceCode.imageUrl && (
            <img
              src={sourceCode.imageUrl || "/placeholder.svg"}
              alt={sourceCode.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}
          <h1 className="text-3xl font-bold mb-4 text-white">
            {sourceCode.title}
            {sourceCode.isPremium && (
              <span className="ml-2 text-yellow-500">
                <Lock size={20} className="inline-block" /> Premium
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-400 mb-6">{new Date(sourceCode.createdAt).toLocaleDateString()}</p>
          <div className="text-gray-300 prose prose-invert max-w-none mb-6">
            {sourceCode.content.split("\n").map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
          {sourceCode.detailedDescription && (
            <div className="mt-8 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-green-500">Detailed Description</h2>
              <div className="text-gray-300 prose prose-invert max-w-none">
                {sourceCode.detailedDescription.split("\n").map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end items-center mb-6">
            {sourceCode.scriptUrl &&
              (user && (user.role === "premium" || !sourceCode.isPremium) ? (
                <Link
                  href={`/download/${sourceCode.id}`}
                  className="inline-flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                >
                  <Download className="mr-2" size={18} />
                  Download Source Code
                </Link>
              ) : (
                <div className="text-center">
                  <span className="inline-flex items-center bg-gray-600 text-gray-300 px-4 py-2 rounded-md cursor-not-allowed mb-2">
                    <Lock className="mr-2" size={18} />
                    {user ? "Premium Content" : "Login to Download"}
                  </span>
                  {user && user.role === "basic" && (
                    <p className="text-yellow-500 text-sm">Upgrade to premium to access this content!</p>
                  )}
                </div>
              ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}

