import { Download } from "lucide-react"

export default function DownloadSection() {
  return (
    <section className="bg-gray-800 rounded-lg p-8 shadow-lg">
      <h3 className="text-2xl font-bold mb-4 text-green-500">Download Source Code</h3>
      <p className="text-gray-300 mb-6">
        Get the latest version of our WhatsApp bot source code and start building your own automated responses!
      </p>
      <a
        href="/download/whatsapp-bot-v1.0.zip"
        className="inline-flex items-center bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
      >
        <Download className="mr-2" />
        Download Now
      </a>
    </section>
  )
}

