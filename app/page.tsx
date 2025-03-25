import Header from "./components/Header"
import Footer from "./components/Footer"
import StatsDisplay from "./components/StatsDisplay"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center text-green-500">Welcome to Xydlan Lux</h2>
        <p className="text-center text-gray-300 mb-12">
          Discover powerful WhatsApp bot scripts and enhance your messaging experience.
        </p>

        <div className="max-w-4xl mx-auto mb-12">
          <StatsDisplay />
        </div>

        <div className="text-center">
          <a
            href="/login"
            className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors inline-block"
          >
            Get Started
          </a>
        </div>
      </main>
      <Footer />
    </div>
  )
}

