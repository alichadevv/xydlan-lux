"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ref, get, update, increment } from "firebase/database"
import { database } from "@/lib/firebase"

export default function DownloadPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  useEffect(() => {
    const downloadSourceCode = async () => {
      const { id } = params
      const sourceCodeRef = ref(database, `sourceCodes/${id}`)

      try {
        const snapshot = await get(sourceCodeRef)
        const sourceCode = snapshot.val()

        if (sourceCode && sourceCode.scriptUrl) {
          // Redirect to the actual download URL
          window.location.href = sourceCode.scriptUrl

          // After a short delay, redirect back to the source code page
          setTimeout(() => {
            router.push(`/blog/${sourceCode.slug}`)
          }, 1000) // Adjust the delay as needed
        } else {
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Error downloading source code:", error)
        router.push("/dashboard")
      }
    }

    downloadSourceCode()
  }, [params, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <p className="text-white text-xl">Initiating download... You will be redirected shortly.</p>
    </div>
  )
}

