"use client"

import { useState, useEffect } from "react"
import { Battery, Wifi } from "lucide-react"

export default function DeviceInfo() {
  const [batteryInfo, setBatteryInfo] = useState<{
    level: number
    charging: boolean
  } | null>(null)
  const [ipAddress, setIpAddress] = useState<string>("Loading...")

  useEffect(() => {
    // Get Battery Info
    const getBatteryInfo = async () => {
      try {
        // @ts-ignore - Battery API types
        const battery = await navigator.getBattery()
        setBatteryInfo({
          level: battery.level * 100,
          charging: battery.charging,
        })

        // Listen for battery changes
        battery.addEventListener("levelchange", () => {
          setBatteryInfo((prev) => ({
            ...prev!,
            level: battery.level * 100,
          }))
        })

        battery.addEventListener("chargingchange", () => {
          setBatteryInfo((prev) => ({
            ...prev!,
            charging: battery.charging,
          }))
        })
      } catch (error) {
        console.error("Battery API not supported")
      }
    }

    // Get IP Address
    const getIpAddress = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json")
        const data = await response.json()
        setIpAddress(data.ip)
      } catch (error) {
        setIpAddress("Failed to load")
      }
    }

    getBatteryInfo()
    getIpAddress()
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">BATTERY</h3>
          <div className="text-2xl font-bold text-white">
            {batteryInfo ? `${Math.round(batteryInfo.level)}%` : "N/A"}
          </div>
          <div className="text-sm text-gray-400">
            {batteryInfo ? (batteryInfo.charging ? "Charging" : "Not Charging") : "Unknown"}
          </div>
        </div>
        <Battery className={`w-8 h-8 ${batteryInfo?.charging ? "text-green-500" : "text-blue-500"}`} />
      </div>

      <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">ADDRESS</h3>
          <div className="text-2xl font-bold text-white">{ipAddress}</div>
        </div>
        <Wifi className="w-8 h-8 text-purple-500" />
      </div>
    </div>
  )
}

