"use client"

import { useState, useEffect } from "react"
import { ref, query, orderByChild, onValue } from "firebase/database"
import { database } from "@/lib/firebase"
import Link from "next/link"
import { Download, Lock, MessageCircle, ExternalLink, AlignLeft } from "lucide-react"
import SearchBar from "./SearchBar"
import type { SourceCode } from "@/lib/types"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

interface SourceCodeListProps {
  userRole: string
}

export default function SourceCodeList({ userRole }: SourceCodeListProps) {
  const [sourceCodes, setSourceCodes] = useState<SourceCode[]>([])
  const [filteredCodes, setFilteredCodes] = useState<SourceCode[]>([])

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

    return () => unsubscribe()
  }, [])

  const handleSearch = (query: string) => {
    const lowercaseQuery = query.toLowerCase()
    const filtered = sourceCodes.filter(
      (code) =>
        code.title.toLowerCase().includes(lowercaseQuery) || code.content.toLowerCase().includes(lowercaseQuery),
    )
    setFilteredCodes(filtered)
  }

  const handlePremiumDownload = () => {
    toast.info(
      <div>
        This is premium content. Please upgrade your account or contact admin.
        <a
          href="https://wa.me/1234567890"
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-2 text-green-500 hover:text-green-400"
        >
          <MessageCircle className="inline-block mr-1" size={16} />
          Contact Admin via WhatsApp
        </a>
      </div>,
      { autoClose: false },
    )
  }

  return (
    <section className="mt-12">
      <ToastContainer />
      <h2 className="text-2xl font-bold mb-6 text-green-500">Source Codes</h2>
      <SearchBar onSearch={handleSearch} />
      {filteredCodes.length > 0 ? (
        <div className="space-y-6">
          {filteredCodes.map((code) => (
            <div key={code.id} className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-2 text-white flex items-center">
                {code.title}
                {code.isPremium && (
                  <span className="ml-2 text-yellow-500">
                    <Lock size={16} className="inline-block" /> Premium
                  </span>
                )}
                {code.detailedDescription && (
                  <span className="ml-2 text-blue-500" title="Detailed description available">
                    <AlignLeft size={16} className="inline-block" />
                  </span>
                )}
              </h3>
              <p className="text-gray-300">
                {code.content ? code.content.substring(0, 150) + "..." : "No description available"}
              </p>
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-400">{new Date(code.createdAt).toLocaleDateString()}</p>
                <div className="space-x-2">
                  {code.scriptUrl &&
                    (userRole === "premium" || !code.isPremium ? (
                      code.isLink ? (
                        <a
                          href={code.scriptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-colors"
                        >
                          <ExternalLink className="mr-1" size={16} />
                          View Source
                        </a>
                      ) : (
                        <Link
                          href={`/download/${code.id}`}
                          className="inline-flex items-center bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-colors"
                        >
                          <Download className="mr-1" size={16} />
                          Download
                        </Link>
                      )
                    ) : (
                      <button
                        onClick={handlePremiumDownload}
                        className="inline-flex items-center bg-gray-600 text-gray-300 px-3 py-1 rounded-md cursor-not-allowed"
                      >
                        <Lock className="mr-1" size={16} />
                        Premium Only
                      </button>
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

