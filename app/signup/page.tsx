"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Eye, EyeOff, UserPlus, AlertCircle, Loader2, Mail, Lock, User, Phone, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import NavbarLayout from "@/components/NavbarLayout"
import Link from "next/link"

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    agreeToTerms: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
    agreeToTerms: false
  })
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setError("") // Clear error when user types
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const getFieldError = (field: string) => {
    if (!touched[field as keyof typeof touched]) return null
    
    switch (field) {
      case "name":
        return !formData.name.trim() ? "Name is required" : null
      case "email":
        return !formData.email.trim() 
          ? "Email is required" 
          : !formData.email.includes("@") 
            ? "Please enter a valid email" 
            : null
      case "phone":
        return !formData.phone.trim() ? "Phone number is required" : null
      case "password":
        return !formData.password.trim()
          ? "Password is required" 
          : formData.password.length < 6
            ? "Password must be at least 6 characters"
            : null
      case "agreeToTerms":
        return !formData.agreeToTerms ? "You must agree to the terms" : null
      default:
        return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Touch all fields to show validation errors
    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      agreeToTerms: true
    })
    
    // Check for validation errors
    const formErrors = [
      getFieldError("name"),
      getFieldError("email"),
      getFieldError("phone"),
      getFieldError("password"),
      getFieldError("agreeToTerms")
    ].filter(Boolean)
    
    if (formErrors.length > 0) {
      return
    }
    
    setError("")
    setIsLoading(true)

    try {
      // First, create the user account
      await axios.post("/api/auth/signup", formData)

      // Then attempt to log in
      try {
        const loginResponse = await axios.post("/api/auth/login", { 
          email: formData.email, 
          password: formData.password 
        })
        localStorage.setItem("token", loginResponse.data.token)
        
        // Brief delay to show loading state
        setTimeout(() => {
          router.push("/dashboard")
        }, 500)
      } catch (loginError) {
        console.error("Login after signup failed:", loginError)
        // Redirect to login with success message
        router.push("/login?registered=true")
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
    <NavbarLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
            <p className="text-gray-500">Sign up to get started with our service</p>
          </div>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              {error && (
                <Alert variant="destructive" className="mb-6 animate-in fade-in-50 duration-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="name" className="text-sm font-medium">
                      Full Name
                    </label>
                    {touched.name && getFieldError("name") && (
                      <span className="text-xs text-red-500">{getFieldError("name")}</span>
                    )}
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={() => handleBlur("name")}
                      className={`pl-10 transition-all ${
                        touched.name && getFieldError("name") 
                          ? "border-red-500 ring-red-100" 
                          : touched.name && !getFieldError("name") && formData.name.trim()
                            ? "border-green-500 ring-green-100"
                            : ""
                      }`}
                    />
                    {touched.name && !getFieldError("name") && formData.name.trim() && (
                      <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>

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
                    <label htmlFor="phone" className="text-sm font-medium">
                      Phone Number
                    </label>
                    {touched.phone && getFieldError("phone") && (
                      <span className="text-xs text-red-500">{getFieldError("phone")}</span>
                    )}
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(123) 456-7890"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={() => handleBlur("phone")}
                      className={`pl-10 transition-all ${
                        touched.phone && getFieldError("phone") 
                          ? "border-red-500 ring-red-100" 
                          : touched.phone && !getFieldError("phone") && formData.phone.trim()
                            ? "border-green-500 ring-green-100"
                            : ""
                      }`}
                    />
                    {touched.phone && !getFieldError("phone") && formData.phone.trim() && (
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
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={() => handleBlur("password")}
                      className={`pl-10 pr-10 transition-all ${
                        touched.password && getFieldError("password") 
                          ? "border-red-500 ring-red-100" 
                          : touched.password && !getFieldError("password") && formData.password.trim().length >= 6
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
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="agreeToTerms"
                      name="agreeToTerms"
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      onBlur={() => handleBlur("agreeToTerms")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-600">
                      I agree to the{" "}
                      <Link href="/terms" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                        Terms and Conditions
                      </Link>
                    </label>
                  </div>
                  {touched.agreeToTerms && getFieldError("agreeToTerms") && (
                    <span className="text-xs text-red-500 block">{getFieldError("agreeToTerms")}</span>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 mt-6 transition-all duration-300 bg-indigo-600 hover:bg-indigo-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <UserPlus className="mr-2 h-4 w-4" />
                      <span>Create account</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex justify-center pb-6 pt-2">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                  Sign in
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