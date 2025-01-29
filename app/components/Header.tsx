"use client"

import { useState, useEffect } from "react"
import { TerminalSquare, Menu, X, User, LogOut, MessageSquare, HelpCircle, Gift } from "lucide-react"
import Link from "next/link"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth, database } from "@/lib/firebase"
import { ref, onValue } from "firebase/database"
import type { User as UserType } from "@/lib/types"
import { useRouter } from "next/navigation"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<UserType | null>(null)
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
              username: userData.username,
              role: userData.role,
            })
          }
        })
      } else {
        setUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Error signing out: ", error)
    }
  }

  return (
    <header className="bg-gray-800 py-4 px-4 sm:px-6 relative">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TerminalSquare className="w-8 h-8 text-green-500" />
            <h1 className="text-2xl font-bold text-green-500">XdpzQ404</h1>
          </div>
          <nav className="hidden md:flex space-x-4">
            <Link href="/" className="text-gray-300 hover:text-green-500 transition-colors">
              Home
            </Link>
            {user ? (
              <>
                <Link href="/profile" className="text-gray-300 hover:text-green-500 transition-colors">
                  Profile
                </Link>
                <Link href="/dashboard" className="text-gray-300 hover:text-green-500 transition-colors">
                  Dashboard
                </Link>
                <Link href="/forum" className="text-gray-300 hover:text-green-500 transition-colors">
                  Forum
                </Link>
                <Link href="/daily-prizes" className="text-gray-300 hover:text-green-500 transition-colors">
                  Daily Prizes
                </Link>
                <Link href="/dashboard/ai-chat" className="text-gray-300 hover:text-green-500 transition-colors">
                  AI Chat
                </Link>
                <Link href="/customer-service" className="text-gray-300 hover:text-green-500 transition-colors">
                  Customer Service
                </Link>
                <button onClick={handleLogout} className="text-gray-300 hover:text-green-500 transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-300 hover:text-green-500 transition-colors">
                  Login
                </Link>
                <Link href="/register" className="text-gray-300 hover:text-green-500 transition-colors">
                  Register
                </Link>
              </>
            )}
          </nav>
          <button
            className="md:hidden text-gray-300 hover:text-green-500 transition-colors z-10"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            <span className="sr-only">{isMenuOpen ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <nav id="mobile-menu" className="absolute top-full left-0 right-0 bg-gray-800 py-4 px-4 shadow-lg md:hidden">
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                className="block py-2 px-4 text-gray-300 hover:bg-gray-700 hover:text-green-500 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
            </li>
            {user ? (
              <>
                <li>
                  <Link
                    href="/profile"
                    className="block py-2 px-4 text-gray-300 hover:bg-gray-700 hover:text-green-500 rounded transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="inline-block mr-2" size={16} />
                    Profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="block py-2 px-4 text-gray-300 hover:bg-gray-700 hover:text-green-500 rounded transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/forum"
                    className="block py-2 px-4 text-gray-300 hover:bg-gray-700 hover:text-green-500 rounded transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Forum
                  </Link>
                </li>
                <li>
                  <Link
                    href="/daily-prizes"
                    className="block py-2 px-4 text-gray-300 hover:bg-gray-700 hover:text-green-500 rounded transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Gift className="inline-block mr-2" size={16} />
                    Daily Prizes
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/ai-chat"
                    className="block py-2 px-4 text-gray-300 hover:bg-gray-700 hover:text-green-500 rounded transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MessageSquare className="inline-block mr-2" size={16} />
                    AI Chat
                  </Link>
                </li>
                <li>
                  <Link
                    href="/customer-service"
                    className="block py-2 px-4 text-gray-300 hover:bg-gray-700 hover:text-green-500 rounded transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <HelpCircle className="inline-block mr-2" size={16} />
                    Customer Service
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="w-full text-left py-2 px-4 text-gray-300 hover:bg-gray-700 hover:text-green-500 rounded transition-colors"
                  >
                    <LogOut className="inline-block mr-2" size={16} />
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    href="/login"
                    className="block py-2 px-4 text-gray-300 hover:bg-gray-700 hover:text-green-500 rounded transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="block py-2 px-4 text-gray-300 hover:bg-gray-700 hover:text-green-500 rounded transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      )}
    </header>
  )
}

