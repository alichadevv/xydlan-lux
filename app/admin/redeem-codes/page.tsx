"use client"

import { useState, useEffect } from "react"
import { ref, onValue, remove } from "firebase/database"
import { database } from "@/lib/firebase"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Trash2 } from "lucide-react"

interface RedeemCode {
  id: string
  code: string
  duration: number
  createdAt: number
  createdBy: string
  isUsed: boolean
  usageCount: number
  usageLimit: number
}

export default function RedeemCodesPage() {
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([])

  useEffect(() => {
    const redeemCodesRef = ref(database, "redeemCodes")
    const unsubscribe = onValue(redeemCodesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const codesArray = Object.entries(data).map(([id, code]: [string, any]) => ({
          id,
          ...code,
        }))
        setRedeemCodes(codesArray)
      } else {
        setRedeemCodes([])
      }
    })

    return () => unsubscribe()
  }, [])

  const handleDelete = async (codeId: string) => {
    if (window.confirm("Are you sure you want to delete this redeem code?")) {
      try {
        await remove(ref(database, `redeemCodes/${codeId}`))
        toast.success("Redeem code deleted successfully!")
      } catch (error) {
        console.error("Error deleting redeem code:", error)
        toast.error("Failed to delete redeem code. Please try again.")
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <ToastContainer />
      <h2 className="text-3xl font-bold text-green-500 mb-8">Redeem Codes List</h2>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        {redeemCodes.length > 0 ? (
          <table className="w-full text-left text-gray-300">
            <thead>
              <tr className="text-green-500">
                <th className="p-2">Code</th>
                <th className="p-2">Duration</th>
                <th className="p-2">Created At</th>
                <th className="p-2">Usage</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {redeemCodes.map((code) => (
                <tr key={code.id} className="border-t border-gray-700">
                  <td className="p-2">{code.code}</td>
                  <td className="p-2">{`${Math.ceil(code.duration / (1000 * 60 * 60 * 24))} days`}</td>
                  <td className="p-2">{new Date(code.createdAt).toLocaleString()}</td>
                  <td className="p-2">{`${code.usageCount || 0} / ${code.usageLimit || 1}`}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleDelete(code.id)}
                      className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-300">No redeem codes available.</p>
        )}
      </div>
    </div>
  )
}

