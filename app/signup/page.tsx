"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function Signup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // First, create the user account
      await axios.post("/api/auth/signup", { name, email, phone, password, agreeToTerms })

      // Then attempt to log in
      try {
        const loginResponse = await axios.post("/api/auth/login", { email, password })
        localStorage.setItem("token", loginResponse.data.token)
        router.push("/dashboard")
      } catch (loginError) {
        console.error("Login after signup failed:", loginError)
        setError("Account created successfully, but automatic login failed. Please go to the login page.")
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.data.details) {
          // Handle validation errors
          const validationErrors = error.response.data.details
          if (Array.isArray(validationErrors)) {
            setError(validationErrors.map((err) => err.message).join(", "))
          } else {
            setError(error.response.data.details || error.response.data.error || "An error occurred during signup")
          }
        } else {
          setError(error.response.data.error || "An error occurred during signup")
        }
      } else {
        setError("An unexpected error occurred")
      }
      console.error("Signup failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold mb-8">Sign Up</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 font-bold mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="phone" className="block text-gray-700 font-bold mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div className="mb-6 relative">
          <label htmlFor="password" className="block text-gray-700 font-bold mb-2">
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
          >
            {showPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
          </button>
        </div>
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">
              I agree to the{" "}
              <Link href="/terms" className="text-blue-500 hover:text-blue-600">
                Terms and Conditions
              </Link>
            </span>
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          disabled={isLoading}
        >
          {isLoading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
      <p className="mt-4">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-blue-500 hover:text-blue-600"
          onClick={(e) => {
            e.preventDefault()
            router.push("/login")
          }}
        >
          Login
        </Link>
      </p>
    </div>
  )
}

