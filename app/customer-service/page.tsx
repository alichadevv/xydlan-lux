"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { ref, onValue, push, set, serverTimestamp, remove } from "firebase/database"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, database, storage } from "@/lib/firebase"
import Header from "@/app/components/Header"
import Footer from "@/app/components/Footer"
import { Send, Paperclip, Trash2 } from "lucide-react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

interface Message {
  id: string
  senderId: string
  senderEmail: string
  senderUsername: string
  text: string
  timestamp: number
  imageUrl?: string
  isAdmin?: boolean
}

export default function CustomerService() {
  const [user, setUser] = useState<{ uid: string; email: string; username?: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        const userRef = ref(database, `users/${authUser.uid}`)
        onValue(userRef, (snapshot) => {
          const userData = snapshot.val()
          setUser({
            uid: authUser.uid,
            email: authUser.email!,
            username: userData?.username || censorEmail(authUser.email!),
          })
        })
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (user) {
      const chatRef = ref(database, `chats/${user.uid}`)
      const unsubscribe = onValue(chatRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const messagesArray = Object.entries(data).map(([id, message]: [string, any]) => ({
            id,
            ...message,
          }))
          setMessages(messagesArray.sort((a, b) => a.timestamp - b.timestamp))
        }
      })

      return () => unsubscribe()
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, []) //Removed unnecessary dependency: messages

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const censorEmail = (email: string) => {
    const [username, domain] = email.split("@")
    return `${username[0]}${"*".repeat(username.length - 2)}${username[username.length - 1]}@${domain}`
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || (!newMessage.trim() && !image)) return

    try {
      let imageUrl = ""
      if (image) {
        const imageRef = storageRef(storage, `chat-images/${Date.now()}_${image.name}`)
        const snapshot = await uploadBytes(imageRef, image)
        imageUrl = await getDownloadURL(snapshot.ref)
      }

      const chatRef = ref(database, `chats/${user.uid}`)
      const newMessageRef = push(chatRef)
      await set(newMessageRef, {
        senderId: user.uid,
        senderEmail: user.email,
        senderUsername: user.username,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        imageUrl: imageUrl || null,
      })

      setNewMessage("")
      setImage(null)
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message. Please try again.")
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0])
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return
    try {
      await remove(ref(database, `chats/${user.uid}/${messageId}`))
      toast.success("Message deleted successfully")
    } catch (error) {
      console.error("Error deleting message:", error)
      toast.error("Failed to delete message. Please try again.")
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <Header />
      <ToastContainer />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-green-500">Customer Service</h1>
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="h-96 overflow-y-auto mb-4 p-4 bg-gray-700 rounded-lg">
            {messages.map((message) => (
              <div key={message.id} className={`mb-2 ${message.senderId === user.uid ? "text-right" : "text-left"}`}>
                <div
                  className={`inline-block p-2 rounded-lg ${
                    message.senderId === user.uid ? "bg-green-500 text-white" : "bg-gray-600 text-gray-200"
                  }`}
                >
                  <p className="text-sm font-semibold flex items-center">
                    {message.senderUsername}
                    {message.isAdmin && (
                      <span className="ml-2 bg-yellow-500 text-xs font-bold px-2 py-1 rounded">Admin</span>
                    )}
                  </p>
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl || "/placeholder.svg"}
                      alt="Shared image"
                      className="max-w-xs max-h-48 mb-2 rounded"
                    />
                  )}
                  <p>{message.text}</p>
                  {message.senderId === user.uid && (
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="text-xs text-gray-400 hover:text-red-500 mt-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="flex items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-grow px-3 py-2 bg-gray-700 text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Type your message..."
            />
            <label className="cursor-pointer bg-gray-700 text-white px-3 py-2">
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              <Paperclip className="w-6 h-6" />
            </label>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-r-md hover:bg-green-600 transition-colors"
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}

