/* eslint-disable @typescript-eslint/no-require-imports */
"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import axios from "axios"
import { Eye, EyeOff, LogIn, AlertCircle, Loader2, Mail, Lock, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import NavbarLayout from "@/components/NavbarLayout"
import Link from "next/link"

// Create a separate component to handle the search params logic
function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isSuspended, setIsSuspended] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  })
  
  const router = useRouter()
  
  // Use the imported hook instead of requiring it
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if user just registered
    const registered = searchParams?.get("registered")
    if (registered === "true") {
      setSuccessMessage("Account created successfully! You can now sign in.")
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError("") // Clear error when user types
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const getFieldError = (field: string) => {
    if (!touched[field as keyof typeof touched]) return null
    
    switch (field) {
      case "email":
        return !formData.email.trim() 
          ? "Email is required" 
          : !formData.email.includes("@") 
            ? "Please enter a valid email" 
            : null
      case "password":
        return !formData.password.trim()
          ? "Password is required" 
          : null
      default:
        return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Touch all fields to show validation errors
    setTouched({
      email: true,
      password: true,
    })
    
    if (!formData.email.trim() || !formData.email.includes("@") || !formData.password.trim()) {
      return
    }
    
    setError("")
    setSuccessMessage("")
    setIsSuspended(false)
    setIsLoading(true)

    try {
      const response = await axios.post("/api/auth/login", formData)
      localStorage.setItem("token", response.data.token)
      
      // Brief delay to show loading state
      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 403 && error.response.data.suspended) {
          setIsSuspended(true)
        } else {
          setError(error.response.data.error || "An error occurred during login")
        }
      } else {
        setError("An unexpected error occurred")
      }
      console.error("Login failed:", error)
    } finally {
      setIsLoading(false)
    }
  } // Added closing brace for handleSubmit function

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-6 animate-in fade-in-50 duration-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {successMessage && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200 animate-in fade-in-50 duration-300">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {isSuspended && (
          <div className="mb-4 text-red-500">
            Your account has been suspended. Please make a payment or call 0111363697 to reactivate your account.
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            {touched.email && getFieldError("email") && (
              <span className="text-xs text-red-500">{getFieldError("email")}</span>
            )}
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur("email")}
              className={`pl-10 transition-all ${
                touched.email && getFieldError("email") 
                  ? "border-red-500 ring-red-100" 
                  : touched.email && !getFieldError("email") && formData.email.includes("@")
                    ? "border-green-500 ring-green-100"
                    : ""
              }`}
            />
            {touched.email && !getFieldError("email") && formData.email.includes("@") && (
              <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            {touched.password && getFieldError("password") && (
              <span className="text-xs text-red-500">{getFieldError("password")}</span>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              onBlur={() => handleBlur("password")}
              className={`pl-10 pr-10 transition-all ${
                touched.password && getFieldError("password") 
                  ? "border-red-500 ring-red-100" 
                  : touched.password && !getFieldError("password") && formData.password.trim()
                    ? "border-green-500 ring-green-100"
                    : ""
              }`}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {showPassword ? "Hide password" : "Show password"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex justify-end">
            <Link 
              href="/forgot-password" 
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 mt-6 transition-all duration-300 bg-indigo-600 hover:bg-indigo-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <LogIn className="mr-2 h-4 w-4" />
              <span>Sign in</span>
            </div>
          )}
        </Button>
      </form>
    </>
  )
}

// Loading fallback component
function LoginFormLoading() {
  return (
    <div className="flex justify-center items-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  )
}

export default function Login() {
  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-gray-500">Sign in to your account to continue</p>
          </div>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <Suspense fallback={<LoginFormLoading />}>
                <LoginForm />
              </Suspense>
            </CardContent>
            
            <CardFooter className="flex justify-center pb-6 pt-2">
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                  Create an account
                </Link>
              </p>
            </CardFooter>
          </Card>
          
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link href="/rights" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
              Rights
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
              Privacy
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
              Terms
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/support" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </NavbarLayout>
  )
}