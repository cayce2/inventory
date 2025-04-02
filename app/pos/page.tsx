/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, 
  Printer, DollarSign, X, Tag, Package2, ReceiptText,
  Smartphone, CheckCircle, Filter, ArrowLeft
} from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams } from "next/navigation"

interface InventoryItem {
  _id: string
  name: string
  quantity: number
  price: number
  image: string
  category?: string
}

interface CartItem extends InventoryItem {
  cartQuantity: number
}

interface PaymentInfo {
  method: "cash" | "card" | "mobile"
  amountTendered: number
  cardDetails?: {
    last4: string
    type: string
  }
}


export default function POSPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [cashAmount, setCashAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mobile">("cash")
  const [cardNumber, setCardNumber] = useState("")
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [change, setChange] = useState(0)
  const [salesId, setSalesId] = useState("")
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [quickAmounts, setQuickAmounts] = useState<number[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const receiptRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const barcodeParam = searchParams.get("barcode")

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Focus search input on load
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // Handle barcode parameter
  useEffect(() => {
    if (barcodeParam) {
      setSearchTerm(barcodeParam)
    }
  }, [barcodeParam])

  useEffect(() => {
    fetchInventory()
  }, [])

  // Filter inventory based on search term
  useEffect(() => {
    filterInventory()
  }, [searchTerm, inventory, selectedCategory])

  // Calculate quick cash amounts when total changes
  useEffect(() => {
    const total = calculateTotal()
    const roundedUp = Math.ceil(total / 5) * 5
    setQuickAmounts([
      roundedUp,
      roundedUp + 5,
      roundedUp + 10,
      roundedUp + 20
    ])
  }, [cart])

  const fetchInventory = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await axios.get("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      })

      setInventory(response.data)
      setFilteredInventory(response.data)

      // Extract categories
      const uniqueCategories = Array.from(
        new Set(response.data.map((item: InventoryItem) => item.category).filter(Boolean)),
      ) as string[]

      setCategories(uniqueCategories)
    } catch (error) {
      console.error("Error fetching inventory:", error)
      setError("Failed to load inventory. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const filterInventory = () => {
    let filtered = inventory

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory)
    }

    setFilteredInventory(filtered)
  }

  const addToCart = (item: InventoryItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem._id === item._id)

      if (existingItem) {
        // Ensure we don't exceed available inventory
        if (existingItem.cartQuantity >= existingItem.quantity) {
          return prevCart
        }

        return prevCart.map((cartItem) =>
          cartItem._id === item._id ? { ...cartItem, cartQuantity: cartItem.cartQuantity + 1 } : cartItem,
        )
      } else {
        if (isMobile) {
          setShowCart(true)
        }
        return [...prevCart, { ...item, cartQuantity: 1 }]
      }
    })
  }

  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    const item = inventory.find((i) => i._id === itemId)
    if (!item) return

    // Ensure we don't exceed available inventory or go below 1
    if (newQuantity < 1 || newQuantity > item.quantity) return

    setCart((prevCart) =>
      prevCart.map((cartItem) => (cartItem._id === itemId ? { ...cartItem, cartQuantity: newQuantity } : cartItem)),
    )
  }

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== itemId))
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.cartQuantity, 0)
  }

  const handlePaymentSubmit = async () => {
    try {
      setPaymentProcessing(true)

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      // Create payment info
      const paymentInfo: PaymentInfo = {
        method: paymentMethod,
        amountTendered: Number.parseFloat(cashAmount) || calculateTotal(),
      }

      if (paymentMethod === "card" && cardNumber) {
        paymentInfo.cardDetails = {
          last4: cardNumber.slice(-4),
          type: detectCardType(cardNumber),
        }
      }

      // Create sale record
      const response = await axios.post(
        "/api/pos/sales",
        {
          items: cart.map((item) => ({
            itemId: item._id,
            quantity: item.cartQuantity,
            price: item.price,
            name: item.name,
          })),
          total: calculateTotal(),
          payment: paymentInfo,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      // Calculate change for cash payments
      if (paymentMethod === "cash") {
        const cashReceived = Number.parseFloat(cashAmount)
        setChange(cashReceived - calculateTotal())
      }

      setSalesId(response.data.salesId)
      setShowPaymentModal(false)
      setShowSuccessModal(true)

      // Reset cart after successful payment
      setTimeout(() => {
        setCart([])
        setShowSuccessModal(false)
        setShowCart(false)
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 5000)

      // Update inventory in the background
      fetchInventory()
    } catch (error) {
      console.error("Error processing payment:", error)
      setError("Failed to process payment. Please try again.")
    } finally {
      setPaymentProcessing(false)
    }
  }

  const printReceipt = () => {
    if (receiptRef.current) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write("<html><head><title>Receipt</title>")
        printWindow.document.write("<style>")
        printWindow.document.write(`
          body { font-family: system-ui, sans-serif; font-size: 12px; margin: 0; padding: 20px; width: 300px; }
          .header { text-align: center; margin-bottom: 20px; }
          .item { margin-bottom: 10px; }
          .flex { display: flex; justify-content: space-between; }
          .total { font-weight: bold; margin-top: 10px; border-top: 1px solid #000; padding-top: 10px; }
          .payment-info { margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; }
        `)
        printWindow.document.write("</style></head><body>")
        printWindow.document.write(receiptRef.current.innerHTML)
        printWindow.document.write("</body></html>")
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const detectCardType = (cardNumber: string) => {
    // Basic card type detection
    if (cardNumber.startsWith("4")) return "Visa"
    if (/^5[1-5]/.test(cardNumber)) return "MasterCard"
    if (/^3[47]/.test(cardNumber)) return "American Express"
    if (/^6(?:011|5)/.test(cardNumber)) return "Discover"
    return "Unknown"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KES",
    }).format(amount)
  }

  const getItemsCount = () => {
    return cart.reduce((total, item) => total + item.cartQuantity, 0)
  }

  const PaymentModal = () => {
    if (!showPaymentModal) return null

    const total = calculateTotal()

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <motion.div 
          className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Payment</h2>
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-2xl font-semibold text-center">{formatCurrency(total)}</p>
          </div>

          <div className="mb-6">
            <div className="flex rounded-lg bg-gray-100 p-1 mb-4">
              <button
                className={`flex-1 py-3 rounded-lg flex justify-center items-center ${
                  paymentMethod === "cash" ? "bg-white shadow-md" : ""
                }`}
                onClick={() => setPaymentMethod("cash")}
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Cash
              </button>
              <button
                className={`flex-1 py-3 rounded-lg flex justify-center items-center ${
                  paymentMethod === "card" ? "bg-white shadow-md" : ""
                }`}
                onClick={() => setPaymentMethod("card")}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Card
              </button>
              <button
                className={`flex-1 py-3 rounded-lg flex justify-center items-center ${
                  paymentMethod === "mobile" ? "bg-white shadow-md" : ""
                }`}
                onClick={() => setPaymentMethod("mobile")}
              >
                <Smartphone className="h-5 w-5 mr-2" />
                Mobile
              </button>
            </div>
          </div>

          {paymentMethod === "cash" && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700">Cash Received</label>
              <input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-xl text-center mb-4"
                placeholder="0.00"
                autoFocus
              />

              <div className="grid grid-cols-2 gap-2 mb-4">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCashAmount(amount.toString())}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-center"
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>

              {Number.parseFloat(cashAmount) > 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Change:</span>
                    <span className="text-lg font-semibold text-green-600">
                      {formatCurrency(Math.max(0, Number.parseFloat(cashAmount) - total))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {paymentMethod === "card" && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700">Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                className="w-full p-3 border border-gray-300 rounded-lg text-xl mb-2"
                placeholder="•••• •••• •••• ••••"
                maxLength={16}
                autoFocus
              />
              <p className="text-sm text-gray-500 mb-4">This is a simulation. No actual payment will be processed.</p>
              
              {cardNumber && cardNumber.length >= 4 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
                    <span className="text-gray-700">{detectCardType(cardNumber)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {paymentMethod === "mobile" && (
            <div className="mb-6 flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
                <svg className="h-48 w-48 text-gray-800" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M0 0h7v7H0zm1 1v5h5V1zm1 1h3v3H2zm8-2h5v7h-5zm1 1v5h3V1zM0 9h7v7H0zm1 1v5h5v-5zm1 1h3v3H2zm9-1h1v2h-1zm3 0h1v1h-1zm-2 1h1v1h-1zm2 1h1v1h-1zm-3 1h2v1h-2zm3 0h1v2h-1zm-2 1h1v1h-1z" />
                </svg>
              </div>
              <p className="text-lg font-medium">{formatCurrency(total)}</p>
              <p className="text-sm text-gray-500 mt-2">Scan to complete payment</p>
            </div>
          )}

          <button
            onClick={handlePaymentSubmit}
            disabled={
              paymentProcessing ||
              (paymentMethod === "cash" && (!cashAmount || Number.parseFloat(cashAmount) < total)) ||
              (paymentMethod === "card" && (!cardNumber || cardNumber.length < 15))
            }
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:bg-blue-300 transition-colors"
          >
            {paymentProcessing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing
              </span>
            ) : (
              "Complete Payment"
            )}
          </button>
        </motion.div>
      </div>
    )
  }

  const SuccessModal = () => {
    if (!showSuccessModal) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <motion.div 
          className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
            <p className="mt-1 text-sm text-gray-500">Transaction ID: {salesId}</p>

            {paymentMethod === "cash" && change > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg inline-block">
                <p className="text-lg font-semibold text-green-600">Change: {formatCurrency(change)}</p>
              </div>
            )}
          </div>

          <div style={{ display: "none" }}>
            <div ref={receiptRef}>
              <div className="header">
                <h2>Inventory Management System</h2>
                <p>123 Business St.</p>
                <p>Tel: (123) 456-7890</p>
                <p>Date: {new Date().toLocaleDateString()}</p>
                <p>Time: {new Date().toLocaleTimeString()}</p>
                <p>Transaction #: {salesId}</p>
              </div>

              <div>
                <h3>Items</h3>
                {cart.map((item) => (
                  <div key={item._id} className="item">
                    <div className="flex">
                      <div>{item.name}</div>
                      <div>{formatCurrency(item.price)}</div>
                    </div>
                    <div className="flex">
                      <div>Qty: {item.cartQuantity}</div>
                      <div>{formatCurrency(item.price * item.cartQuantity)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="total flex">
                <div>Total</div>
                <div>{formatCurrency(calculateTotal())}</div>
              </div>

              <div className="payment-info">
                <div>Payment Method: {paymentMethod.toUpperCase()}</div>
                {paymentMethod === "cash" && (
                  <>
                    <div className="flex">
                      <div>Cash Tendered</div>
                      <div>{formatCurrency(Number.parseFloat(cashAmount))}</div>
                    </div>
                    <div className="flex">
                      <div>Change</div>
                      <div>{formatCurrency(change)}</div>
                    </div>
                  </>
                )}
                {paymentMethod === "card" && cardNumber && (
                  <div>
                    Card: {detectCardType(cardNumber)} ending in {cardNumber.slice(-4)}
                  </div>
                )}
              </div>

              <div className="footer">
                <p>Thank you for your business!</p>
                <p>Return policy: Returns accepted within 30 days with receipt</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center space-x-3">
            <button 
              onClick={printReceipt} 
              className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Printer className="mr-2 h-5 w-5" />
              Print Receipt
            </button>
            <button 
              onClick={() => setShowSuccessModal(false)} 
              className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Mobile cart slide-out
  const MobileCart = () => {
    if (!isMobile || !showCart) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
        <motion.div 
          className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <button 
              onClick={() => setShowCart(false)}
              className="flex items-center text-gray-700"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Products
            </button>
            <div className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
              <span className="font-medium">{getItemsCount()} items</span>
            </div>
          </div>
          
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length > 0 ? (
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between border-b py-3"
                    >
                      <div className="flex-grow">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center border rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateCartItemQuantity(item._id, item.cartQuantity - 1)}
                            className="px-2 py-1 bg-gray-100"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="px-3">{item.cartQuantity}</span>
                          <button
                            onClick={() => updateCartItemQuantity(item._id, item.cartQuantity + 1)}
                            className="px-2 py-1 bg-gray-100"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="p-1 text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center justify-center h-64">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-2">Your cart is empty</p>
                  <button 
                    onClick={() => setShowCart(false)}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Browse Products
                  </button>
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold mb-6">
                  <span>Total</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
                
                <button
                  onClick={() => {
                    setShowCart(false);
                    setShowPaymentModal(true);
                  }}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Checkout
                </button>
                
                <button
                  onClick={() => setCart([])}
                  className="w-full mt-2 py-2 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  // Mobile filter panel
  const MobileFilter = () => {
    if (!isMobile || !isFilterOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
        <motion.div 
          className="absolute inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl"
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">Filter Products</h3>
            <button 
              onClick={() => setIsFilterOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4">
            <h4 className="font-medium mb-3 flex items-center">
              <Tag className="h-4 w-4 mr-2 text-blue-600" />
              Categories
            </h4>
            <div className="space-y-2">
              <button
                className={`w-full px-3 py-2 text-left rounded-lg ${
                  selectedCategory === null ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                }`}
                onClick={() => {
                  setSelectedCategory(null);
                  setIsFilterOpen(false);
                }}
              >
                All Products
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  className={`w-full px-3 py-2 text-left rounded-lg ${
                    selectedCategory === category ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                  }`}
                  onClick={() => {
                    setSelectedCategory(category);
                    setIsFilterOpen(false);
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // Cart badge for mobile
  const CartBadge = () => {
    if (!isMobile || cart.length === 0) return null;
    
    return (
      <motion.button
      className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg flex items-center justify-center z-30"
      onClick={() => setShowCart(true)}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative">
        <ShoppingCart className="h-6 w-6" />
        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
          {getItemsCount()}
        </span>
      </div>
    </motion.button>
  );
};

return (
  <NavbarLayout>
    <div className="flex h-screen max-h-screen">
      {/* Product listing side */}
      <div className={`${isMobile && showCart ? 'hidden' : 'flex-1'} flex flex-col overflow-hidden`}>
        {/* Search and filter bar */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {isMobile ? (
            <button
              onClick={() => setIsFilterOpen(true)}
              className="ml-2 p-2 border rounded-lg"
            >
              <Filter size={20} />
            </button>
          ) : (
            <div className="ml-4 flex items-center space-x-2">
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-600">{error}</div>
          ) : filteredInventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Package2 className="h-12 w-12 text-gray-300 mb-4" />
              <p className="mb-2">No products found</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-blue-600 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-4 gap-3">
              {filteredInventory.map((item) => (
                <motion.div
                  key={item._id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden border ${
                    item.quantity === 0 ? "opacity-50" : ""
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative pt-[100%]">
                    {item.image ? (
                      <Image
                        src={`data:image/jpeg;base64,${item.image}`}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 
                              (max-width: 1200px) 33vw,
                              16vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <Package2 className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    {item.quantity === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white font-bold">
                        OUT OF STOCK
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">{item.name}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">{formatCurrency(item.price)}</span>
                      <button
                        onClick={() => addToCart(item)}
                        disabled={item.quantity === 0}
                        className={`p-1.5 rounded-full ${
                          item.quantity === 0
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                        }`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Stock: {item.quantity} {item.quantity === 1 ? "unit" : "units"}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart side - desktop only */}
      {!isMobile && (
        <div className="w-96 border-l flex flex-col overflow-hidden">
          <div className="p-4 border-b flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
            <h2 className="font-medium">Shopping Cart</h2>
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
              {getItemsCount()} items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length > 0 ? (
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item._id}
                    className="flex items-center border-b py-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 mr-3 relative overflow-hidden">
                      {item.image ? (
                        <Image
                          src={`data:image/jpeg;base64,${item.image}`}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package2 className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium text-sm mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center border rounded overflow-hidden">
                        <button
                          onClick={() => updateCartItemQuantity(item._id, item.cartQuantity - 1)}
                          className="px-1.5 py-0.5 bg-gray-100"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-2 text-sm">{item.cartQuantity}</span>
                        <button
                          onClick={() => updateCartItemQuantity(item._id, item.cartQuantity + 1)}
                          className="px-1.5 py-0.5 bg-gray-100"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="p-1 text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <ShoppingCart className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
                <p className="text-sm text-gray-400 mt-1">Add products to get started</p>
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-gray-600">Tax</span>
                <span>{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mb-6">
                <span>Total</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
              
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={cart.length === 0}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              >
                <ReceiptText className="h-5 w-5 inline mr-2" />
                Checkout
              </button>
              
              <button
                onClick={() => setCart([])}
                disabled={cart.length === 0}
                className="w-full mt-2 py-2 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent transition-colors"
              >
                Clear Cart
              </button>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Modals */}
    <AnimatePresence>
      {showPaymentModal && <PaymentModal />}
      {showSuccessModal && <SuccessModal />}
      {isMobile && isFilterOpen && <MobileFilter />}
      {isMobile && showCart && <MobileCart />}
    </AnimatePresence>
    
    {/* Mobile cart badge */}
    <AnimatePresence>{isMobile && <CartBadge />}</AnimatePresence>
  </NavbarLayout>
)
}