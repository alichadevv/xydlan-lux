import { useState, useEffect } from "react"
import { ref, onValue } from "firebase/database"
import { database } from "@/lib/firebase"
import type { User } from "@/lib/types"

interface UserListProps {
  currentUserId: string
  selectedUser: string | null
  onSelectUser: (userId: string) => void
}

export default function UserList({ currentUserId, selectedUser, onSelectUser }: UserListProps) {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    const usersRef = ref(database, "users")
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val()
      if (usersData) {
        const usersArray = Object.entries(usersData).map(([uid, userData]: [string, any]) => ({
          uid,
          email: userData.email,
          username: userData.username || censorEmail(userData.email),
          role: userData.role,
        }))
        setUsers(usersArray.filter((u) => u.uid !== currentUserId))
      }
    })

    return () => unsubscribe()
  }, [currentUserId])

  const censorEmail = (email: string) => {
    const [username, domain] = email.split("@")
    return `${username[0]}${"*".repeat(username.length - 2)}${username[username.length - 1]}@${domain}`
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg overflow-x-auto">
      <h3 className="text-xl font-semibold text-white mb-4">Users</h3>
      <div className="flex space-x-2">
        {users.map((u) => (
          <button
            key={u.uid}
            className={`flex-shrink-0 p-2 rounded transition-colors ${
              selectedUser === u.uid ? "bg-green-500 text-white" : "text-gray-300 hover:bg-gray-700"
            }`}
            onClick={() => onSelectUser(u.uid)}
          >
            <span className="font-semibold">{u.username}</span>
            <span className="text-xs block">{u.email}</span>
            <span
              className={`text-xs px-1 py-0.5 rounded ${
                u.role === "premium" ? "bg-yellow-500 text-black" : "bg-gray-600 text-white"
              }`}
            >
              {u.role}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

