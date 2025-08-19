/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useRef } from "react"
import { Plus, Edit2, Trash2, Save, Search, ArrowUpDown, Loader, QrCode, X, Check, Hash, Camera } from "lucide-react"
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
//import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Declare QuaggaJS global type
declare global {
  interface Window {
    Quagga: any;
  }
}

interface InventoryItem {
  _id: string
  name: string
  sku: string
  quantity: number
  price: number
  imageUrl: string
  lowStockThreshold: number
  image?: any
}

const defaultNewItem = {
  name: "",
  sku: "",
  quantity: 0,
  price: 0,
  imageUrl: "",
  lowStockThreshold: 10
}

// Currency formatting utility function
const formatCurrency = (value: number, currencyCode = 'KES') => {
  return `${currencyCode} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// SKU validation utility
const validateSKU = (sku: string) => {
  const skuPattern = /^[A-Za-z0-9\-_]+$/;
  return skuPattern.test(sku) && sku.length >= 3 && sku.length <= 50;
};

// Generate random SKU
const generateSKU = (name: string) => {
  const prefix = name.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Load QuaggaJS from CDN
const loadQuaggaJS = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Quagga) {
      resolve();
      return;
    }
    
    // Remove any existing script
    const existingScript = document.querySelector('script[src*="quagga"]');
    if (existingScript) {
      existingScript.remove();
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js';
    script.async = true;
    
    script.onload = () => {
      // Give it a moment to initialize
      setTimeout(() => {
        if (window.Quagga) {
          console.log('QuaggaJS loaded successfully');
          resolve();
        } else {
          reject(new Error('QuaggaJS failed to initialize'));
        }
      }, 100);
    };
    
    script.onerror = () => {
      console.error('Failed to load QuaggaJS');
      reject(new Error('Failed to load QuaggaJS library'));
    };
    
    document.head.appendChild(script);
  });
};

export default function InventoryManagement() {
  // Sample data for demo
  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      _id: '1',
      name: 'Wireless Headphones',
      sku: 'WIR-123456-ABC',
      quantity: 25,
      price: 99.99,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
      lowStockThreshold: 10
    },
    {
      _id: '2', 
      name: 'Smartphone Case',
      sku: 'SMR-789012-DEF',
      quantity: 5,
      price: 29.99,
      imageUrl: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=300&fit=crop',
      lowStockThreshold: 15
    },
    {
      _id: '3',
      name: 'USB Cable',
      sku: 'USB-345678-GHI',
      quantity: 0,
      price: 12.99,
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
      lowStockThreshold: 20
    }
  ])

  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([])
  const [newItem, setNewItem] = useState(defaultNewItem)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [scannerDialogOpen, setScannerDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<"name" | "price" | "quantity" | "sku">("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filterStatus, setFilterStatus] = useState<"all" | "inStock" | "lowStock" | "outOfStock">("all")
  const [, setSelectedImage] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [restockQuantity, setRestockQuantity] = useState<number>(10)
  const [restockDialogOpen, setRestockDialogOpen] = useState(false)
  const [itemToRestock, setItemToRestock] = useState<string | null>(null)
  
  // Scanner-related state
  const [isScanning, setIsScanning] = useState(false)
  const [scannedCode, setScannedCode] = useState("")
  const [scanError, setScanError] = useState("")
  const [skuValidation, setSkuValidation] = useState({ isValid: true, message: "" })
  const [scanSuccess, setScanSuccess] = useState(false)
  const [quaggaLoaded, setQuaggaLoaded] = useState(false)
  const [loadingScanner, setLoadingScanner] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scannerRef = useRef<HTMLDivElement>(null)
  const currency = 'KES'

  useEffect(() => {
    // Load QuaggaJS on component mount
    setLoadingScanner(true)
    loadQuaggaJS()
      .then(() => {
        setQuaggaLoaded(true)
        console.log('Scanner ready')
      })
      .catch((error) => {
        console.error('Scanner load failed:', error)
        setScanError('Failed to load barcode scanner')
      })
      .finally(() => {
        setLoadingScanner(false)
      })
  }, [])

  useEffect(() => {
    // Apply filtering and sorting
    let result = [...inventory]
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Apply status filter
    if (filterStatus !== "all") {
      result = result.filter(item => {
        if (filterStatus === "inStock") return item.quantity > item.lowStockThreshold
        if (filterStatus === "lowStock") return item.quantity > 0 && item.quantity <= item.lowStockThreshold
        if (filterStatus === "outOfStock") return item.quantity <= 0
        return true
      })
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name)
      } else if (sortField === "price") {
        comparison = a.price - b.price
      } else if (sortField === "quantity") {
        comparison = a.quantity - b.quantity
      } else if (sortField === "sku") {
        comparison = a.sku.localeCompare(b.sku)
      }
      return sortDirection === "asc" ? comparison : -comparison
    })
    
    setFilteredInventory(result)
  }, [inventory, searchQuery, sortField, sortDirection, filterStatus])

  // SKU validation effect
  useEffect(() => {
    const currentSku = editingItem ? editingItem.sku : newItem.sku
    if (currentSku) {
      validateSKUUniqueness(currentSku)
    } else {
      setSkuValidation({ isValid: true, message: "" })
    }
  }, [newItem.sku, editingItem?.sku, inventory])

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (window.Quagga && isScanning) {
        try {
          window.Quagga.stop()
        } catch (error) {
          console.error('Error stopping scanner:', error)
        }
      }
    }
  }, [isScanning])

  const validateSKUUniqueness = (sku: string) => {
    if (!validateSKU(sku)) {
      setSkuValidation({
        isValid: false,
        message: "SKU must be 3-50 characters long and contain only letters, numbers, hyphens, and underscores"
      })
      return
    }

    const existingItem = inventory.find(item => 
      item.sku === sku && item._id !== (editingItem?._id || '')
    )

    if (existingItem) {
      setSkuValidation({
        isValid: false,
        message: "This SKU already exists in your inventory"
      })
    } else {
      setSkuValidation({ isValid: true, message: "" })
    }
  }

  const startBarcodeScanner = async () => {
    if (!quaggaLoaded || !window.Quagga) {
      setScanError("Barcode scanner not available. Please wait for it to load.")
      return
    }

    if (!scannerRef.current) {
      setScanError("Scanner interface not ready")
      return
    }

    try {
      setScanError("")
      setScanSuccess(false)
      setIsScanning(true)

      await window.Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: { min: 320, ideal: 640, max: 800 },
            height: { min: 240, ideal: 480, max: 600 },
            facingMode: "environment"
          }
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 2,
        frequency: 10,
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader", 
            "ean_8_reader",
            "code_39_reader",
            "upc_reader",
            "upc_e_reader"
          ]
        },
        locate: true
      })

      window.Quagga.start()

      // Handle barcode detection
      window.Quagga.onDetected((result: any) => {
        if (result && result.codeResult && result.codeResult.code) {
          const code = result.codeResult.code
          console.log("Barcode detected:", code)
          handleScannedCode(code)
        }
      })

    } catch (error) {
      console.error("Scanner error:", error)
      setScanError("Failed to start camera. Please check permissions.")
      setIsScanning(false)
    }
  }

  const stopBarcodeScanner = () => {
    try {
      if (window.Quagga && isScanning) {
        window.Quagga.stop()
        window.Quagga.offDetected()
      }
    } catch (error) {
      console.error("Error stopping scanner:", error)
    }
    setIsScanning(false)
    setScanSuccess(false)
  }

  const handleScannedCode = (code: string) => {
    stopBarcodeScanner()
    setScanSuccess(true)
    setScannedCode(code)
    
    // Check if item exists
    const existingItem = inventory.find(item => item.sku === code)
    
    if (existingItem) {
      if (confirm(`Item "${existingItem.name}" (SKU: ${code}) already exists. Would you like to restock it?`)) {
        closeScannerDialog()
        openRestockDialog(existingItem._id)
        return
      }
    }
    
    // Set SKU in form
    if (editingItem) {
      setEditingItem({ ...editingItem, sku: code })
    } else {
      setNewItem({ ...newItem, sku: code })
    }
    
    setTimeout(() => {
      closeScannerDialog()
    }, 1500)
  }

  const openScannerDialog = () => {
    if (!quaggaLoaded) {
      setScanError("Scanner is still loading. Please wait a moment.")
      return
    }
    setScannerDialogOpen(true)
    setScannedCode("")
    setScanError("")
    setScanSuccess(false)
  }

  const closeScannerDialog = () => {
    stopBarcodeScanner()
    setScannerDialogOpen(false)
    setScannedCode("")
    setScanError("")
    setScanSuccess(false)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!skuValidation.isValid) return

    // Simulate API call
    setIsLoading(true)
    setTimeout(() => {
      const newInventoryItem: InventoryItem = {
        _id: Date.now().toString(),
        ...newItem,
        imageUrl: previewImage || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'
      }
      
      setInventory(prev => [...prev, newInventoryItem])
      setNewItem(defaultNewItem)
      setSelectedImage(null)
      setPreviewImage(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setItemDialogOpen(false)
      setIsLoading(false)
    }, 1000)
  }

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem || !skuValidation.isValid) return

    setIsLoading(true)
    setTimeout(() => {
      setInventory(prev => prev.map(item => 
        item._id === editingItem._id ? {
          ...editingItem,
          imageUrl: previewImage || editingItem.imageUrl
        } : item
      ))
      setEditingItem(null)
      setSelectedImage(null)
      setPreviewImage(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setItemDialogOpen(false)
      setIsLoading(false)
    }, 1000)
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) return

    setIsLoading(true)
    setTimeout(() => {
      setInventory(prev => prev.filter(item => item._id !== itemToDelete))
      setDeleteDialogOpen(false)
      setIsLoading(false)
    }, 1000)
  }

  const handleRestock = async () => {
    if (!itemToRestock) return
    
    setIsLoading(true)
    setTimeout(() => {
      setInventory(prev => prev.map(item =>
        item._id === itemToRestock 
          ? { ...item, quantity: item.quantity + restockQuantity }
          : item
      ))
      setRestockDialogOpen(false)
      setRestockQuantity(10)
      setIsLoading(false)
    }, 1000)
  }

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item)
    setPreviewImage(item.imageUrl)
    setItemDialogOpen(true)
  }

  const openAddDialog = () => {
    setEditingItem(null)
    setNewItem(defaultNewItem)
    setSelectedImage(null)
    setPreviewImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setItemDialogOpen(true)
  }

  const openRestockDialog = (itemId: string) => {
    setItemToRestock(itemId)
    setRestockDialogOpen(true)
  }

  const confirmDelete = (itemId: string) => {
    setItemToDelete(itemId)
    setDeleteDialogOpen(true)
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) {
      return { label: "Out of Stock", color: "bg-red-500" }
    } else if (item.quantity < item.lowStockThreshold) {
      return { label: "Low Stock", color: "bg-amber-500" }
    } else {
      return { label: "In Stock", color: "bg-green-500" }
    }
  }

  const toggleSort = (field: "name" | "price" | "quantity" | "sku") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const generateSkuForItem = () => {
    const currentName = editingItem ? editingItem.name : newItem.name
    if (currentName) {
      const generatedSku = generateSKU(currentName)
      if (editingItem) {
        setEditingItem({ ...editingItem, sku: generatedSku })
      } else {
        setNewItem({ ...newItem, sku: generatedSku })
      }
    } else {
      alert("Please enter a product name first to generate SKU")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-500 mt-1">Manage your products and stock levels with SKU tracking</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={openScannerDialog} 
              variant="outline"
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              disabled={loadingScanner}
            >
              {loadingScanner ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" /> 
                  Scan Barcode
                </>
              )}
            </Button>
            <Button 
              onClick={openAddDialog} 
              className="bg-indigo-600 hover:bg-indigo-700"
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Item
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search products or SKU..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select
                value={filterStatus}
                onValueChange={(value) => setFilterStatus(value as any)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="inStock">In Stock</SelectItem>
                  <SelectItem value="lowStock">Low Stock</SelectItem>
                  <SelectItem value="outOfStock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => toggleSort("name")}>
                    Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort("sku")}>
                    SKU {sortField === "sku" && (sortDirection === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort("price")}>
                    Price {sortField === "price" && (sortDirection === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort("quantity")}>
                    Quantity {sortField === "quantity" && (sortDirection === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <Tabs defaultValue="grid" className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-white border">
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
            </TabsList>
            <div className="text-sm font-medium text-gray-600">
              {filteredInventory.length} of {inventory.length} items
            </div>
          </div>

          <TabsContent value="grid" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item);
                const stockPercentage = item.lowStockThreshold > 0 
                  ? Math.min(Math.round((item.quantity / item.lowStockThreshold) * 100), 100)
                  : 100;
                
                return (
                  <Card key={item._id} className="overflow-hidden border border-gray-200 transition-all hover:shadow-md group">
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop";
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className={`${stockStatus.color} text-white`}>
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-2 line-clamp-1 text-gray-900">{item.name}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <Hash className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">{item.sku}</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-500">Stock Level</span>
                            <span className="text-sm font-medium">{item.quantity} units</span>
                          </div>
                          <Progress value={stockPercentage} className="h-2" />
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                          <span className="text-gray-700 font-semibold">{formatCurrency(item.price)}</span>
                          <span className="text-sm text-gray-500">Threshold: {item.lowStockThreshold}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 bg-gray-50 p-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full border-green-300 text-green-700 hover:bg-green-50"
                        onClick={() => openRestockDialog(item._id)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Restock
                      </Button>
                      <div className="flex justify-between w-full">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 border-red-200 hover:bg-red-50" 
                          onClick={() => confirmDelete(item._id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="table" className="mt-0">
            <Card className="border border-gray-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-4 font-medium text-gray-600">Product</th>
                      <th className="text-left p-4 font-medium text-gray-600 cursor-pointer" onClick={() => toggleSort("sku")}>
                        <div className="flex items-center">
                          SKU
                          {sortField === "sku" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                        </div>
                      </th>
                      <th className="text-left p-4 font-medium text-gray-600 cursor-pointer" onClick={() => toggleSort("price")}>
                        <div className="flex items-center">
                          Price
                          {sortField === "price" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                        </div>
                      </th>
                      <th className="text-left p-4 font-medium text-gray-600 cursor-pointer" onClick={() => toggleSort("quantity")}>
                        <div className="flex items-center">
                          Quantity
                          {sortField === "quantity" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                        </div>
                      </th>
                      <th className="text-left p-4 font-medium text-gray-600">Status</th>
                      <th className="text-right p-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => {
                      const stockStatus = getStockStatus(item);
                      return (
                        <tr key={item._id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-md bg-gray-100 mr-3 overflow-hidden border">
                                <img 
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop";
                                  }}
                                />
                              </div>
                              <span className="font-medium text-gray-900">{item.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{item.sku}</span>
                          </td>
                          <td className="p-4 font-medium">{formatCurrency(item.price)}</td>
                          <td className="p-4">
                            <div className="flex items-center">
                              <span className="font-medium mr-2">{item.quantity}</span>
                              <Progress 
                                value={Math.min((item.quantity / item.lowStockThreshold) * 100, 100)} 
                                className="h-2 w-16" 
                              />
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={`${stockStatus.color} text-white`}>
                              {stockStatus.label}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-green-300 text-green-700 hover:bg-green-50"
                                onClick={() => openRestockDialog(item._id)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(item)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => confirmDelete(item._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Item Add/Edit Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editingItem ? handleEditItem : handleAddItem} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={editingItem ? editingItem.name : newItem.name}
                  onChange={(e) =>
                    editingItem
                      ? setEditingItem({ ...editingItem, name: e.target.value })
                      : setNewItem({ ...newItem, name: e.target.value })
                  }
                  required
                  placeholder="Enter product name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                <div className="flex gap-2">
                  <Input
                    id="sku"
                    value={editingItem ? editingItem.sku : newItem.sku}
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({ ...editingItem, sku: e.target.value.toUpperCase() })
                        : setNewItem({ ...newItem, sku: e.target.value.toUpperCase() })
                    }
                    required
                    placeholder="e.g., PROD-123456-ABC"
                    className={!skuValidation.isValid ? 'border-red-300' : ''}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateSkuForItem}
                  >
                    <Hash className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openScannerDialog}
                    disabled={loadingScanner}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
                {!skuValidation.isValid && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700 text-sm">
                      {skuValidation.message}
                    </AlertDescription>
                  </Alert>
                )}
                <p className="text-sm text-gray-500">
                  SKU must be unique and 3-50 characters (letters, numbers, hyphens, underscores)
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ({currency})</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={editingItem ? editingItem.price : newItem.price}
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({ ...editingItem, price: Number.parseFloat(e.target.value) })
                        : setNewItem({ ...newItem, price: Number.parseFloat(e.target.value) })
                    }
                    required
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={editingItem ? editingItem.quantity : newItem.quantity}
                    onChange={(e) =>
                      editingItem
                      ? setEditingItem({ ...editingItem, quantity: Number.parseInt(e.target.value) })
                      : setNewItem({ ...newItem, quantity: Number.parseInt(e.target.value) })
                  }
                  required
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                value={editingItem ? editingItem.lowStockThreshold : newItem.lowStockThreshold}
                onChange={(e) =>
                  editingItem
                    ? setEditingItem({ ...editingItem, lowStockThreshold: Number.parseInt(e.target.value) })
                    : setNewItem({ ...newItem, lowStockThreshold: Number.parseInt(e.target.value) })
                }
                required
                placeholder="10"
              />
              <p className="text-sm text-gray-500">You&apos;ll be alerted when stock falls below this level</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="flex items-center gap-4">
                {previewImage && (
                  <div className="w-20 h-20 border rounded-md overflow-hidden">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="image"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setItemDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !skuValidation.isValid}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {editingItem ? "Save Changes" : "Add Item"}
                </>
              )}
            </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Scanner Dialog */}
      <Dialog open={scannerDialogOpen} onOpenChange={closeScannerDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Barcode Scanner
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {scanError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {scanError}
                </AlertDescription>
              </Alert>
            )}

            {scanSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Successfully scanned: {scannedCode}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {!isScanning ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto">
                  <QrCode className="h-8 w-8 text-indigo-500" />
                </div>
                <p className="text-gray-600">
                  Use your camera to scan a barcode or QR code to automatically detect the SKU.
                </p>
                
                {!quaggaLoaded ? (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <Loader className="h-6 w-6 animate-spin text-indigo-500" />
                    </div>
                    <p className="text-sm text-gray-500">
                      Loading barcode scanner library...
                    </p>
                  </div>
                ) : (
                  <Button 
                    onClick={startBarcodeScanner} 
                    className="w-full"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Start Camera Scanner
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <div 
                    ref={scannerRef}
                    className="w-full h-64 bg-black rounded-lg overflow-hidden"
                  />
                  
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-32 border-2 border-white border-dashed rounded-lg opacity-70">
                      <div className="w-full h-full relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-red-400"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-red-400"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-red-400"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-red-400"></div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                    {scanSuccess ? 'Scan Complete!' : 'Position barcode in frame'}
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={stopBarcodeScanner}
                  className="w-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  Stop Scanner
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Supported: Code 128, EAN, UPC, Code 39
                  </p>
                  <div className="flex justify-center space-x-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {!scanSuccess && (
              <div className="border-t pt-4">
                <Label htmlFor="manualSku">Or enter SKU manually:</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="manualSku"
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value.toUpperCase())}
                    placeholder="Enter SKU manually"
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => scannedCode && handleScannedCode(scannedCode)}
                    disabled={!scannedCode}
                    size="sm"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeScannerDialog}>
              {scanSuccess ? 'Done' : 'Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected item from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Item"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restock Dialog */}
      <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restock Inventory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="restockQuantity">Add Quantity</Label>
            <Input
              id="restockQuantity"
              type="number"
              value={restockQuantity}
              onChange={(e) => setRestockQuantity(Number.parseInt(e.target.value))}
              min="1"
              required
            />
            <p className="text-sm text-gray-500">
              Enter the number of units to add to the current inventory
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestockDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestock}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Confirm Restock
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}