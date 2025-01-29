"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Upload,
  FileText,
  LogOut,
  ImageIcon,
  Trash2,
  FileUp,
  LucideLink,
  AlignLeft,
  MessageSquare,
  Gift,
} from "lucide-react"
import { ref, push, set, remove, onValue, serverTimestamp, get } from "firebase/database"
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { signOut, onAuthStateChanged } from "firebase/auth"
import { auth, database, storage } from "@/lib/firebase"
import type { SourceCode, User } from "@/lib/types"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import CustomerServiceInquiries from "@/app/components/CustomerServiceInquiries"
import AdminNavbar from "@/app/components/AdminNavbar"

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [detailedDescription, setDetailedDescription] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [script, setScript] = useState<File | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sourceCodes, setSourceCodes] = useState<SourceCode[]>([])
  const [linkTitle, setLinkTitle] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkDescription, setLinkDescription] = useState("")
  const [linkDetailedDescription, setLinkDetailedDescription] = useState("")
  const [redeemCode, setRedeemCode] = useState("")
  const [redeemDuration, setRedeemDuration] = useState({ years: 0, days: 0, hours: 0 })
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/admin/login")
      } else {
        setIsLoading(false)
        fetchSourceCodes()
      }
    })

    return () => unsubscribe()
  }, [router])

  const fetchSourceCodes = () => {
    const sourceCodesRef = ref(database, "sourceCodes")
    onValue(sourceCodesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const codesArray = Object.entries(data).map(([id, code]: [string, any]) => ({
          id,
          ...code,
        }))
        setSourceCodes(codesArray.reverse())
      } else {
        setSourceCodes([])
      }
    })
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
  }

  const checkDuplicateTitle = async (title: string): Promise<boolean> => {
    const sourceCodesRef = ref(database, "sourceCodes")
    const snapshot = await get(sourceCodesRef)
    const data = snapshot.val()
    if (data) {
      return Object.values(data).some((code: any) => code.title.toLowerCase() === title.toLowerCase())
    }
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const isDuplicate = await checkDuplicateTitle(title)
      if (isDuplicate) {
        toast.error("A script with this title already exists. Please choose a different title.")
        setIsLoading(false)
        return
      }

      let imageUrl = ""
      if (image) {
        const imageRef = storageRef(storage, `source-images/${Date.now()}_${image.name}`)
        const snapshot = await uploadBytes(imageRef, image)
        imageUrl = await getDownloadURL(snapshot.ref)
      }

      let scriptUrl = ""
      if (script) {
        const scriptRef = storageRef(storage, `source-scripts/${Date.now()}_${script.name}`)
        const snapshot = await uploadBytes(scriptRef, script)
        scriptUrl = await getDownloadURL(snapshot.ref)
      }

      const slug = generateSlug(title)
      const sourceCodesRef = ref(database, "sourceCodes")
      const newCodeRef = push(sourceCodesRef)
      await set(newCodeRef, {
        title,
        content,
        detailedDescription: detailedDescription || null,
        imageUrl,
        scriptUrl,
        createdAt: Date.now(),
        slug,
        isPremium,
      })

      toast.success("Source code added successfully!")
      setTitle("")
      setContent("")
      setDetailedDescription("")
      setImage(null)
      setScript(null)
      setIsPremium(false)
    } catch (error) {
      console.error("Error adding source code: ", error)
      toast.error("Failed to add source code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0])
    }
  }

  const handleScriptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScript(e.target.files[0])
    }
  }

  const handleDelete = async (code: SourceCode) => {
    if (window.confirm(`Are you sure you want to delete "${code.title}"?`)) {
      try {
        await remove(ref(database, `sourceCodes/${code.id}`))
        if (code.imageUrl) {
          const imageRef = storageRef(storage, code.imageUrl)
          await deleteObject(imageRef)
        }
        if (code.scriptUrl) {
          const scriptRef = storageRef(storage, code.scriptUrl)
          await deleteObject(scriptRef)
        }
        toast.success("Source code deleted successfully!")
      } catch (error) {
        console.error("Error deleting source code: ", error)
        toast.error("Failed to delete source code. Please try again.")
      }
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/admin/login")
    } catch (error) {
      console.error("Error signing out: ", error)
    }
  }

  const handleSubmitLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const isDuplicate = await checkDuplicateTitle(linkTitle)
      if (isDuplicate) {
        toast.error("A script with this title already exists. Please choose a different title.")
        setIsLoading(false)
        return
      }

      const slug = generateSlug(linkTitle)
      const sourceCodesRef = ref(database, "sourceCodes")
      const newCodeRef = push(sourceCodesRef)
      await set(newCodeRef, {
        title: linkTitle,
        content: linkDescription,
        detailedDescription: linkDetailedDescription || null,
        scriptUrl: linkUrl,
        createdAt: Date.now(),
        slug,
        isPremium,
        isLink: true,
      })

      toast.success("Source code link added successfully!")
      setLinkTitle("")
      setLinkUrl("")
      setLinkDescription("")
      setLinkDetailedDescription("")
      setIsPremium(false)
    } catch (error) {
      console.error("Error adding source code link: ", error)
      toast.error("Failed to add source code link. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!redeemCode) {
      toast.error("Please enter a redeem code.")
      return
    }

    const totalDurationMs =
      redeemDuration.years * 365 * 24 * 60 * 60 * 1000 +
      redeemDuration.days * 24 * 60 * 60 * 1000 +
      redeemDuration.hours * 60 * 60 * 1000

    if (totalDurationMs === 0) {
      toast.error("Please set a duration for the redeem code.")
      return
    }

    try {
      const redeemCodesRef = ref(database, "redeemCodes")
      await push(redeemCodesRef, {
        code: redeemCode,
        duration: totalDurationMs,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid,
        isUsed: false,
        usageCount: 0,
        usageLimit: 1, // Set the usage limit to 1
      })

      toast.success("Redeem code created successfully!")
      setRedeemCode("")
      setRedeemDuration({ years: 0, days: 0, hours: 0 })
    } catch (error) {
      console.error("Error creating redeem code:", error)
      toast.error(`Failed to create redeem code: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <ToastContainer />
      <AdminNavbar onLogout={handleLogout} />
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h3 className="text-xl font-semibold mb-4 text-white">Add New Source Code</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-32"
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="detailedDescription" className="block text-sm font-medium text-gray-300 mb-2">
              Detailed Description (Optional)
            </label>
            <textarea
              id="detailedDescription"
              value={detailedDescription}
              onChange={(e) => setDetailedDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-32"
            ></textarea>
          </div>
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-300 mb-2">
              Image (Optional)
            </label>
            <input type="file" id="image" accept="image/*" onChange={handleImageChange} className="hidden" />
            <label
              htmlFor="image"
              className="cursor-pointer bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors inline-flex items-center"
            >
              <ImageIcon className="mr-2" size={18} />
              {image ? "Change Image" : "Upload Image"}
            </label>
            {image && <span className="ml-2 text-gray-300">{image.name}</span>}
          </div>
          <div>
            <label htmlFor="script" className="block text-sm font-medium text-gray-300 mb-2">
              Script File
            </label>
            <input
              type="file"
              id="script"
              accept=".js,.py,.php,.txt"
              onChange={handleScriptChange}
              className="hidden"
            />
            <label
              htmlFor="script"
              className="cursor-pointer bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors inline-flex items-center"
            >
              <FileUp className="mr-2" size={18} />
              {script ? "Change Script" : "Upload Script"}
            </label>
            {script && <span className="ml-2 text-gray-300">{script.name}</span>}
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="form-checkbox h-5 w-5 text-green-500"
              />
              <span className="ml-2 text-gray-300">Premium Content</span>
            </label>
          </div>
          <button
            type="submit"
            className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors inline-flex items-center"
            disabled={isLoading}
          >
            <FileText className="mr-2" size={18} />
            {isLoading ? "Adding..." : "Add Source Code"}
          </button>
        </form>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h3 className="text-xl font-semibold mb-4 text-white">Add Source Code via Link</h3>
        <form onSubmit={handleSubmitLink} className="space-y-4">
          <div>
            <label htmlFor="linkTitle" className="block text-sm font-medium text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              id="linkTitle"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-300 mb-2">
              Source Code URL
            </label>
            <input
              type="url"
              id="linkUrl"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label htmlFor="linkDescription" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="linkDescription"
              value={linkDescription}
              onChange={(e) => setLinkDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-32"
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="linkDetailedDescription" className="block text-sm font-medium text-gray-300 mb-2">
              Detailed Description (Optional)
            </label>
            <textarea
              id="linkDetailedDescription"
              value={linkDetailedDescription}
              onChange={(e) => setLinkDetailedDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-32"
            ></textarea>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="form-checkbox h-5 w-5 text-green-500"
              />
              <span className="ml-2 text-gray-300">Premium Content</span>
            </label>
          </div>
          <button
            type="submit"
            className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors inline-flex items-center"
            disabled={isLoading}
          >
            <LucideLink className="mr-2" size={18} />
            {isLoading ? "Adding..." : "Add Source Code Link"}
          </button>
        </form>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h3 className="text-xl font-semibold mb-4 text-white">Create Redeem Code</h3>
        <form onSubmit={handleCreateRedeemCode} className="space-y-4">
          <div>
            <label htmlFor="redeemCode" className="block text-sm font-medium text-gray-300 mb-2">
              Redeem Code
            </label>
            <input
              type="text"
              id="redeemCode"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div className="flex space-x-4">
            <div>
              <label htmlFor="years" className="block text-sm font-medium text-gray-300 mb-2">
                Years
              </label>
              <input
                type="number"
                id="years"
                value={redeemDuration.years}
                onChange={(e) => setRedeemDuration({ ...redeemDuration, years: Number.parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="days" className="block text-sm font-medium text-gray-300 mb-2">
                Days
              </label>
              <input
                type="number"
                id="days"
                value={redeemDuration.days}
                onChange={(e) => setRedeemDuration({ ...redeemDuration, days: Number.parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="hours" className="block text-sm font-medium text-gray-300 mb-2">
                Hours
              </label>
              <input
                type="number"
                id="hours"
                value={redeemDuration.hours}
                onChange={(e) => setRedeemDuration({ ...redeemDuration, hours: Number.parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors inline-flex items-center"
          >
            <Gift className="mr-2" size={18} />
            Create Redeem Code
          </button>
        </form>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h3 className="text-xl font-semibold mb-4 text-white">Existing Source Codes</h3>
        {sourceCodes.length > 0 ? (
          <ul className="space-y-4">
            {sourceCodes.map((code) => (
              <li key={code.id} className="flex items-center justify-between bg-gray-700 p-4 rounded-md">
                <span className="text-white">
                  {code.title} {code.isPremium && <span className="text-yellow-500">(Premium)</span>}
                </span>
                <button
                  onClick={() => handleDelete(code)}
                  className="bg-red-500 text-white py-1 px-2 rounded-md hover:bg-red-600 transition-colors inline-flex items-center"
                >
                  <Trash2 size={16} className="mr-1" />
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-300">No source codes available.</p>
        )}
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mt-8">
        <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
          <MessageSquare className="mr-2" size={24} />
          Customer Service Inquiries
        </h3>
        <CustomerServiceInquiries />
      </div>
    </div>
  )
}

