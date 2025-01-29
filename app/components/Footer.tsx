import { Github } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-800 py-6 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <p>&copy; 2025 v404. All rights reserved.</p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 hover:text-green-400"
          >
            <Github className="w-6 h-6" />
          </a>
        </div>
      </div>
    </footer>
  )
}

