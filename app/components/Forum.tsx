"use client"

import { useState, useEffect } from "react"
import { ref, onValue, push, set, serverTimestamp } from "firebase/database"
import { database, auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import type { Message, User } from "@/lib/types"
import { Send, ThumbsUp } from "lucide-react"

export default function Forum() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        const userRef = ref(database, `users/${authUser.uid}`)
        onValue(userRef, (snapshot) => {
          const userData = snapshot.val()
          if (userData) {
            setUser({
              uid: authUser.uid,
              email: authUser.email!,
              username: userData.username,
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
    const messagesRef = ref(database, "forumMessages")
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const messagesArray = Object.entries(data).map(([id, message]: [string, any]) => ({
          id,
          ...message,
        }))
        setMessages(messagesArray.sort((a, b) => b.timestamp - a.timestamp))
      }
    })

    return () => unsubscribe()
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newMessage.trim()) return

    try {
      const messagesRef = ref(database, "forumMessages")
      const newMessageRef = push(messagesRef)
      await set(newMessageRef, {
        senderId: user.uid,
        senderUsername: user.username,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        likes: 0,
      })

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleLike = async (messageId: string) => {
    if (!user) return

    const messageRef = ref(database, `forumMessages/${messageId}`)
    onValue(
      messageRef,
      (snapshot) => {
        const messageData = snapshot.val()
        if (messageData) {
          set(messageRef, {
            ...messageData,
            likes: (messageData.likes || 0) + 1,
          })
        }
      },
      { onlyOnce: true },
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-green-500 mb-6">Community Forum</h2>
      <div className="space-y-4 mb-6 h-96 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className="bg-gray-700 rounded-lg p-4 shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-green-400">{message.senderUsername}</span>
              <span className="text-xs text-gray-400">{new Date(message.timestamp).toLocaleString()}</span>
            </div>
            <p className="text-white mb-2">{message.text}</p>
            <button
              onClick={() => handleLike(message.id)}
              className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ThumbsUp size={16} className="mr-1" />
              {message.likes || 0}
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="flex items-center">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow px-4 py-2 bg-gray-700 text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Type your message..."
        />
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded-r-md hover:bg-green-600 transition-colors"
        >
          <Send className="w-6 h-6" />
        </button>
      </form>
    </div>
  )
}

