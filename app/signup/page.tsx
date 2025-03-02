"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Eye, EyeOff, Loader2, User, Mail, Lock, ArrowRight, CheckCircle2, Phone } from "lucide-react"
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
    phone:"",
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    email: false,
    password: false,
  })
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("") // Clear error when user types
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  // Password strength indicators
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "" }
    if (password.length < 6) return { strength: 1, label: "Weak" }
    if (password.length < 10) return { strength: 2, label: "Medium" }
    if (password.length >= 10) return { strength: 3, label: "Strong" }
    return { strength: 0, label: "" }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  const getFieldError = (field: string) => {
    if (!touched[field as keyof typeof touched]) return null
    
    switch (field) {
      case "name":
        return !formData.name.trim() ? "Name is required" : null
        case "phone":
          return !formData.phone.trim() ? "Phone is required" : null
      case "email":
        return !formData.email.trim() 
          ? "Email is required" 
          : !formData.email.includes("@") 
            ? "Please enter a valid email" 
            : null
      case "password":
        return formData.password.length < 6 
          ? "Password must be at least 6 characters" 
          : null
      default:
        return null
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required"
    if (!formData.phone.trim()) return "Phone is required"
    if (!formData.email.trim()) return "Email is required"
    if (!formData.email.includes("@")) return "Please enter a valid email"
    if (formData.password.length < 6) return "Password must be at least 6 characters"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Touch all fields to show validation errors
    setTouched({
      name: true,
      phone: true,
      email: true,
      password: true,
    })
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setError("")
    setIsLoading(true)

    try {
      await axios.post("/api/auth/signup", formData)
      router.push("/login?registered=true")
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.error || "An error occurred during signup")
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
            <h1 className="text-3xl font-bold tracking-tight">Join Us</h1>
            <p className="text-gray-500">Create your account in just a few steps</p>
          </div>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              {error && (
                <Alert variant="destructive" className="mb-6 animate-in fade-in-50 duration-300">
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
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("name")}
                      className={`pl-10 transition-all ${
                        touched.name && getFieldError("name") 
                          ? "border-red-500 ring-red-100" 
                          : touched.name && !getFieldError("name")
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
                    <label htmlFor="name" className="text-sm font-medium">
                      Phone Number
                    </label>
                    {touched.phone && getFieldError("name") && (
                      <span className="text-xs text-red-500">{getFieldError("phone")}</span>
                    )}
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("phone")}
                      className={`pl-10 transition-all ${
                        touched.phone && getFieldError("phone") 
                          ? "border-red-500 ring-red-100" 
                          : touched.phone && !getFieldError("phone")
                            ? "border-green-500 ring-green-100"
                            : ""
                      }`}
                    />
                    {touched.name && !getFieldError("phone") && formData.phone.trim() && (
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
                      onChange={handleInputChange}
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
                      placeholder="Create a secure password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("password")}
                      className={`pl-10 pr-10 transition-all ${
                        touched.password && getFieldError("password") 
                          ? "border-red-500 ring-red-100" 
                          : formData.password.length >= 6
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
                  
                  {formData.password && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-2">
                        {[1, 2, 3].map((segment) => (
                          <div 
                            key={segment}
                            className={`h-1 flex-1 rounded-full ${
                              passwordStrength.strength >= segment 
                                ? segment === 1 
                                  ? "bg-red-400" 
                                  : segment === 2 
                                    ? "bg-yellow-400" 
                                    : "bg-green-400"
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      
                      <div className="flex items-center text-xs justify-between">
                        <p className="text-gray-500">
                          {passwordStrength.label || "Enter a password"}
                        </p>
                        <p className="text-gray-500">
                          Min 6 characters required
                        </p>
                      </div>
                    </div>
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
                      <span>Creating your account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span>Create account</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
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
          
          <p className="text-center text-xs text-gray-500 mt-6">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-gray-700">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-gray-700">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </NavbarLayout>
  )
}