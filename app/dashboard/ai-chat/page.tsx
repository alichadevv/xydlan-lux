"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { ref, onValue } from "firebase/database"
import { auth, database } from "@/lib/firebase"
import Header from "@/app/components/Header"
import Footer from "@/app/components/Footer"
import type { User } from "@/lib/types"
import { Send, Loader2 } from "lucide-react"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI("AIzaSyBtA98UZg1JC6JDcURgU0EGILpV7hKrPbE")

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: number
}

export default function AiChat() {
  const [user, setUser] = useState<User | null>(null)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    scrollToBottom()
  }, []) // Removed unnecessary dependency: messages

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Use Gemini to generate a response
      const model = genAI.getGenerativeModel({ model: "gemini-pro" })
      const result = await model.generateContent(input)
      const response = await result.response
      const text = response.text()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: text || "Sorry, I couldn't process that request.",
        isUser: false,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Error fetching AI response:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, there was an error processing your request.",
        isUser: false,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
    setIsLoading(false)
  }

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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-green-500">AI Chat (Powered by Gemini)</h1>
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="h-[500px] overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">Start a conversation with the Gemini AI assistant</div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.isUser ? "bg-green-500 text-white" : "bg-gray-700 text-white"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.text}</p>
                        <span className="text-xs opacity-75 mt-1 block">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-700 text-white rounded-lg p-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-gray-700 p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

