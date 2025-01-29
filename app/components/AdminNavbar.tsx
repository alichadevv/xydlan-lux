import { useState } from "react"
import Link from "next/link"
import { Menu, LayoutDashboard, MessageSquare, Gift, LogOut } from "lucide-react"

interface AdminNavbarProps {
  onLogout: () => void
}

export default function AdminNavbar({ onLogout }: AdminNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-gray-800 p-4 rounded-lg shadow-lg mb-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-green-500">Admin Dashboard</h2>
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        </div>
        <div className={`md:flex space-y-2 md:space-y-0 md:space-x-4 ${isMenuOpen ? "block" : "hidden"}`}>
          <Link
            href="/admin/dashboard"
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors inline-flex items-center"
          >
            <LayoutDashboard className="mr-2" size={18} />
            Dashboard
          </Link>
          <Link
            href="/admin/customer-service"
            className="bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 transition-colors inline-flex items-center"
          >
            <MessageSquare className="mr-2" size={18} />
            Customer Service
          </Link>
          <Link
            href="/admin/redeem-codes"
            className="bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors inline-flex items-center"
          >
            <Gift className="mr-2" size={18} />
            Redeem Codes
          </Link>
          <button
            onClick={onLogout}
            className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors inline-flex items-center"
          >
            <LogOut className="mr-2" size={18} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

