export interface User {
  uid: string
  email: string
  username: string
  role: "basic" | "premium" | "admin"
  premiumExpiration?: number
}

export interface SourceCode {
  id: string
  title: string
  content: string
  detailedDescription?: string
  imageUrl?: string
  scriptUrl?: string
  createdAt: number
  slug: string
  isPremium: boolean
  isLink?: boolean
}

export interface Message {
  id: string
  senderId: string
  senderEmail: string
  senderUsername: string
  text: string
  timestamp: number
  imageUrl?: string
  isAdmin?: boolean
}

