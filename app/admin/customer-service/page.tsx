"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { ref, onValue, push, set, serverTimestamp, remove } from "firebase/database"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, database, storage } from "@/lib/firebase"
import { Send, Paperclip, Trash2, Check } from "lucide-react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import UserList from "@/components/UserList"

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

export default function AdminCustomerService() {
  const [user, setUser] = useState<{ uid: string; email: string; username?: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
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
        router.push("/admin/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (selectedUser) {
      const chatRef = ref(database, `chats/${selectedUser}`)
      const unsubscribe = onValue(chatRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const messagesArray = Object.entries(data).map(([id, message]: [string, any]) => ({
            id,
            ...message,
          }))
          setMessages(messagesArray.sort((a, b) => a.timestamp - b.timestamp))
        } else {
          setMessages([])
        }
      })

      return () => unsubscribe()
    }
  }, [selectedUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages]) //Corrected dependency

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const censorEmail = (email: string) => {
    const [username, domain] = email.split("@")
    return `${username[0]}${"*".repeat(username.length - 2)}${username[username.length - 1]}@${domain}`
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedUser || (!newMessage.trim() && !image)) return

    try {
      let imageUrl = ""
      if (image) {
        const imageRef = storageRef(storage, `chat-images/${Date.now()}_${image.name}`)
        const snapshot = await uploadBytes(imageRef, image)
        imageUrl = await getDownloadURL(snapshot.ref)
      }

      const chatRef = ref(database, `chats/${selectedUser}`)
      const newMessageRef = push(chatRef)
      await set(newMessageRef, {
        senderId: user.uid,
        senderEmail: user.email,
        senderUsername: user.username,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        imageUrl: imageUrl || null,
        isAdmin: true,
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
    if (!selectedUser) return
    try {
      await remove(ref(database, `chats/${selectedUser}/${messageId}`))
      toast.success("Message deleted successfully")
    } catch (error) {
      console.error("Error deleting message:", error)
      toast.error("Failed to delete message. Please try again.")
    }
  }

  const handleClearChat = async () => {
    if (!selectedUser) return
    if (window.confirm("Are you sure you want to clear this chat? This action cannot be undone.")) {
      try {
        await remove(ref(database, `chats/${selectedUser}`))
        toast.success("Chat cleared successfully")
      } catch (error) {
        console.error("Error clearing chat:", error)
        toast.error("Failed to clear chat. Please try again.")
      }
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
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <ToastContainer />
      <nav className="bg-gray-800 p-4">
        <h2 className="text-2xl font-bold text-green-500">Admin Customer Service</h2>
      </nav>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        <div className="p-4">
          <UserList currentUserId={user.uid} selectedUser={selectedUser} onSelectUser={setSelectedUser} />
        </div>
        <div className="flex-grow bg-gray-700 p-4 flex flex-col">
          {selectedUser ? (
            <>
              <div className="flex-grow overflow-y-auto mb-4 bg-gray-800 rounded-lg p-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-2 ${message.senderId === user.uid ? "text-right" : "text-left"}`}
                  >
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
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="text-xs text-gray-400 hover:text-red-500 mt-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="flex items-center mb-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-grow px-3 py-2 bg-gray-600 text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Type your message..."
                />
                <label className="cursor-pointer bg-gray-600 text-white px-3 py-2">
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
              <button
                onClick={handleClearChat}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
              >
                <Check className="w-6 h-6 inline-block mr-2" />
                Clear Chat (Issue Resolved)
              </button>
            </>
          ) : (
            <p className="text-white text-center">Select a user to start chatting</p>
          )}
        </div>
      </div>
    </div>
  )
}

