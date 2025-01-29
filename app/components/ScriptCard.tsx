import { ArrowRight } from "lucide-react"

interface ScriptCardProps {
  title: string
  description: string
  icon: string
}

export default function ScriptCard({ title, description, icon }: ScriptCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center space-x-4 mb-4">
        <div className="bg-green-500 rounded-full p-2">
          <span className="text-2xl" role="img" aria-label={title}>
            {icon}
          </span>
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <p className="text-gray-400 mb-4">{description}</p>
      <a href="#" className="inline-flex items-center text-green-500 hover:text-green-400">
        View Script <ArrowRight className="ml-2 w-4 h-4" />
      </a>
    </div>
  )
}

