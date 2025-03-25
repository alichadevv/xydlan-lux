import Header from "@/app/components/Header"
import Footer from "@/app/components/Footer"
import Forum from "@/app/components/Forum"
import DailyGacha from "@/app/components/DailyGacha"

export default function ForumPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center text-green-500">Xydlan Community</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Forum />
          </div>
          <div>
            <DailyGacha />
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Community Rules</h2>
              <ul className="list-disc list-inside text-white space-y-2">
                <li>Be respectful to other members</li>
                <li>No spamming or excessive self-promotion</li>
                <li>Keep discussions related to WhatsApp bots and scripting</li>
                <li>Do not share personal information</li>
                <li>Report any inappropriate behavior to moderators</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

