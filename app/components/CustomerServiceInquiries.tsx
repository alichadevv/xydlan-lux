"use client"

import { useState, useEffect } from "react"
import { ref, onValue, update, remove } from "firebase/database"
import { database } from "@/lib/firebase"
import { Check, X, Trash2 } from "lucide-react"
import { toast } from "react-toastify"

interface Inquiry {
  id: string
  userId: string
  userEmail: string
  question: string
  status: "pending" | "resolved"
  createdAt: number
  answer?: string
}

export default function CustomerServiceInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [answer, setAnswer] = useState("")

  useEffect(() => {
    const inquiriesRef = ref(database, "customerServiceInquiries")
    const unsubscribe = onValue(inquiriesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const inquiriesArray = Object.entries(data).map(([id, inquiry]: [string, any]) => ({
          id,
          ...inquiry,
        }))
        setInquiries(inquiriesArray.reverse())
      } else {
        setInquiries([])
      }
    })

    return () => unsubscribe()
  }, [])

  const handleResolve = async (inquiry: Inquiry) => {
    try {
      await update(ref(database, `customerServiceInquiries/${inquiry.id}`), {
        status: "resolved",
        answer,
      })
      toast.success("Inquiry resolved successfully!")
      setSelectedInquiry(null)
      setAnswer("")
    } catch (error) {
      console.error("Error resolving inquiry:", error)
      toast.error("Failed to resolve inquiry. Please try again.")
    }
  }

  const handleDelete = async (inquiry: Inquiry) => {
    if (window.confirm("Are you sure you want to delete this inquiry?")) {
      try {
        await remove(ref(database, `customerServiceInquiries/${inquiry.id}`))
        toast.success("Inquiry deleted successfully!")
      } catch (error) {
        console.error("Error deleting inquiry:", error)
        toast.error("Failed to delete inquiry. Please try again.")
      }
    }
  }

  return (
    <div>
      {inquiries.length > 0 ? (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <div key={inquiry.id} className="bg-gray-700 p-4 rounded-md">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-white font-semibold">{inquiry.userEmail}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(inquiry.createdAt).toLocaleString()} - {inquiry.status}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(inquiry)}
                  className="text-red-500 hover:text-red-600"
                  title="Delete Inquiry"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <p className="text-gray-300 mb-2">{inquiry.question}</p>
              {inquiry.status === "resolved" && inquiry.answer && (
                <div className="bg-gray-600 p-2 rounded-md mt-2">
                  <p className="text-sm text-gray-300">Answer: {inquiry.answer}</p>
                </div>
              )}
              {inquiry.status === "pending" && (
                <button
                  onClick={() => setSelectedInquiry(inquiry)}
                  className="bg-blue-500 text-white py-1 px-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
                >
                  Respond
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-300">No inquiries available.</p>
      )}

      {selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h4 className="text-xl font-semibold mb-4 text-white">Respond to Inquiry</h4>
            <p className="text-gray-300 mb-4">{selectedInquiry.question}</p>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-32 mb-4"
              placeholder="Type your answer here..."
            ></textarea>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setSelectedInquiry(null)}
                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                <X className="inline-block mr-1" size={18} />
                Cancel
              </button>
              <button
                onClick={() => handleResolve(selectedInquiry)}
                className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
              >
                <Check className="inline-block mr-1" size={18} />
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

