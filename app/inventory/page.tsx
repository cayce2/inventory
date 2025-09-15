/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Plus, Edit2, Trash2, Save, ShoppingBag, Search, ArrowUpDown, Loader, QrCode, Hash } from "lucide-react"
import NavbarLayout from "@/components/NavbarLayout"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import BarcodeScanner from "@/components/BarcodeScanner"

interface InventoryItem {
  image: any
  _id: string
  name: string
  sku: string
  quantity: number
  price: number
  imageUrl: string
  lowStockThreshold: number
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
  // SKU should be alphanumeric, can include hyphens and underscores
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

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [restockQuantity, setRestockQuantity] = useState<number>(10)
  const [restockDialogOpen, setRestockDialogOpen] = useState(false)
  const [itemToRestock, setItemToRestock] = useState<string | null>(null)
  const [skuValidation, setSkuValidation] = useState({ isValid: true, message: "" })
  
  // New state for barcode integration
  const [scannerMode, setScannerMode] = useState<'standalone' | 'input'>('standalone')
  const [isScanningForSku, setIsScanningForSku] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currency = 'KES'; 
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchInventory()
  }, [router])

  useEffect(() => {
    // Apply filtering and sorting
    let result = [...inventory]
    
    // Apply search filter (now includes SKU search)
    if (searchQuery) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
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
    
    // Apply sorting (now includes SKU sorting)
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
    } catch (error) {
      console.error("Error fetching inventory:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateSKUUniqueness = async (sku: string) => {
    if (!validateSKU(sku)) {
      setSkuValidation({
        isValid: false,
        message: "SKU must be 3-50 characters long and contain only letters, numbers, hyphens, and underscores"
      })
      return
    }

    // Check if SKU already exists (excluding current item being edited)
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

  const handleScanResult = (code: string) => {
    console.log('Scan result received:', code, 'Scanner mode:', scannerMode)
    
    if (scannerMode === 'input') {
      // When scanning for SKU input, update the current form
      if (editingItem) {
        setEditingItem({ ...editingItem, sku: code })
      } else {
        setNewItem({ ...newItem, sku: code })
      }
      // Close scanner and reset mode
      setScannerDialogOpen(false)
      setScannerMode('standalone')
      setIsScanningForSku(false)
      return
    }
    
    // Standalone mode - check if this is a new item or existing item
    const existingItem = inventory.find(item => item.sku === code)
    
    if (existingItem) {
      // If item exists, open restock dialog
      openRestockDialog(existingItem._id)
      return
    }
    
    // If new item, open add dialog with SKU pre-filled
    setNewItem({ ...defaultNewItem, sku: code })
    setEditingItem(null)
    setSelectedImage(null)
    setPreviewImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setScannerDialogOpen(false)
    setItemDialogOpen(true)
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
    
    if (!skuValidation.isValid) {
      return
    }

    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("name", newItem.name)
      formData.append("sku", newItem.sku)
      formData.append("quantity", newItem.quantity.toString())
      formData.append("price", newItem.price.toString())
      formData.append("lowStockThreshold", newItem.lowStockThreshold.toString())
      if (selectedImage) {
        formData.append("image", selectedImage)
      }

      await axios.post("/api/inventory", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      setNewItem(defaultNewItem)
      setSelectedImage(null)
      setPreviewImage(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setItemDialogOpen(false)
      fetchInventory()
    } catch (error) {
      console.error("Error adding item:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem || !skuValidation.isValid) return

    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("_id", editingItem._id)
      formData.append("name", editingItem.name)
      formData.append("sku", editingItem.sku)
      formData.append("quantity", editingItem.quantity.toString())
      formData.append("price", editingItem.price.toString())
      formData.append("lowStockThreshold", editingItem.lowStockThreshold.toString())
      if (selectedImage) {
        formData.append("image", selectedImage)
      }

      await axios.put("/api/inventory", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      setEditingItem(null)
      setSelectedImage(null)
      setPreviewImage(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setItemDialogOpen(false)
      fetchInventory()
    } catch (error) {
      console.error("Error updating item:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) return

    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      await axios.delete("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
        data: { itemId: itemToDelete },
      })
      setDeleteDialogOpen(false)
      fetchInventory()
    } catch (error) {
      console.error("Error deleting item:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestock = async () => {
    if (!itemToRestock) return
    
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      await axios.post(
        "/api/inventory/restock",
        { itemId: itemToRestock, quantity: restockQuantity },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setRestockDialogOpen(false)
      setRestockQuantity(10)
      fetchInventory()
    } catch (error) {
      console.error("Error restocking item:", error)
    } finally {
      setIsLoading(false)
    }
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

  const formatAmount = (value: number) => {
    return formatCurrency(value, currency);
  };

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

  // New function to open scanner for SKU input
  const openScannerForSku = () => {
    setScannerMode('input')
    setIsScanningForSku(true)
    setScannerDialogOpen(true)
  }

  // New function to open scanner in standalone mode
  const openStandaloneScanner = () => {
    setScannerMode('standalone')
    setIsScanningForSku(false)
    setScannerDialogOpen(true)
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-500 mt-1">Manage your products and stock levels with SKU tracking</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={openStandaloneScanner} 
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                <QrCode className="mr-2 h-4 w-4" /> 
                Scan Barcode
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
                    <Button variant="outline" className="flex">
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
                <TabsTrigger value="grid" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Grid View</TabsTrigger>
                <TabsTrigger value="table" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Table View</TabsTrigger>
              </TabsList>
              <div className="text-sm font-medium text-gray-600">
                {filteredInventory.length} of {inventory.length} items
              </div>
            </div>

            <TabsContent value="grid" className="mt-0">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="overflow-hidden border border-gray-200">
                      <Skeleton className="w-full h-48" />
                      <CardContent className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-4" />
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-1/3 mb-2" />
                      </CardContent>
                      <CardFooter className="flex justify-between bg-gray-50 p-4 border-t">
                        <Skeleton className="h-9 w-16" />
                        <Skeleton className="h-9 w-16" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : filteredInventory.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredInventory.map((item) => {
                    const stockStatus = getStockStatus(item);
                    const stockPercentage = item.lowStockThreshold > 0 
                      ? Math.min(Math.round((item.quantity / item.lowStockThreshold) * 100), 100)
                      : 100;

                    return (
                      <Card key={item._id} className="overflow-hidden border border-gray-200 transition-all hover:shadow-md group">
                        <div className="relative h-48 overflow-hidden bg-white flex items-center justify-center">
                          <Image
                            src={
                              item.image
                                ? `data:image/jpeg;base64,${item.image}`
                                : item.imageUrl || "/placeholder.svg"
                            }
                            alt={item.name}
                            width={400}
                            height={300}
                            className="w-full h-full object-contain transition-transform group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder.svg";
                            }}
                            priority
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
                              <span className="text-gray-700 font-semibold">{formatAmount(item.price)}</span>
                              <span className="text-sm text-gray-500">Threshold: {item.lowStockThreshold}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2 bg-gray-50 p-4 border-t">
                          <div className="w-full">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full border-green-300 text-green-700 hover:bg-green-50"
                              onClick={() => openRestockDialog(item._id)}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Restock
                            </Button>
                          </div>
                          <div className="flex justify-between w-full">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-gray-300 text-gray-700 hover:bg-gray-100"
                              onClick={() => openEditDialog(item)}
                            >
                              <Edit2 className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" 
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
              ) : (
                <Card className="bg-gray-50 border border-dashed border-gray-300">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                      <ShoppingBag className="h-8 w-8 text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-1">No items found</h3>
                    <p className="text-gray-500 mb-6 max-w-md">
                      {searchQuery || filterStatus !== "all"
                        ? "Try adjusting your search or filter criteria to find what you're looking for."
                        : "You haven't added any items to your inventory yet. Add your first item to get started."}
                    </p>
                    {searchQuery || filterStatus !== "all" ? (
                      <Button variant="outline" onClick={() => {
                        setSearchQuery("");
                        setFilterStatus("all");
                      }}>
                        Clear Filters
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          onClick={openStandaloneScanner}
                          variant="outline"
                          className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                        >
                          <QrCode className="h-4 w-4 mr-2" /> Scan Item
                        </Button>
                        <Button 
                          onClick={openAddDialog}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Your First Item
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="table" className="mt-0">
              <Card className="border border-gray-200 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-4 font-medium text-gray-600 cursor-pointer" onClick={() => toggleSort("quantity")}>
                          <div className="flex items-center">
                            Quantity
                            {sortField === "quantity" && (
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                            )}
                          </div>
                        </th>
                        <th className="text-left p-4 font-medium text-gray-600">Status</th>
                        <th className="text-right p-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        [1, 2, 3, 4, 5].map((i) => (
                          <tr key={i} className="border-b">
                            <td className="p-4">
                              <div className="flex items-center">
                                <Skeleton className="h-10 w-10 rounded mr-3" />
                                <Skeleton className="h-4 w-32" />
                              </div>
                            </td>
                            <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                            <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                            <td className="p-4"><Skeleton className="h-4 w-12" /></td>
                            <td className="p-4"><Skeleton className="h-6 w-20" /></td>
                            <td className="p-4 text-right"><Skeleton className="h-8 w-24 ml-auto" /></td>
                          </tr>
                        ))
                      ) : filteredInventory.length > 0 ? (
                        filteredInventory.map((item) => {
                          const stockStatus = getStockStatus(item);
                          return (
                            <tr key={item._id} className="border-b hover:bg-gray-50">
                              <td className="p-4">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-md bg-white mr-3 overflow-hidden border border-gray-200">
                                    <Image 
                                      src={
                                        item.image
                                          ? `data:image/jpeg;base64,${item.image}`
                                          : item.imageUrl || "/placeholder.svg"
                                        }
                                        alt={item.name}
                                        width={40}
                                        height={40}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = "/placeholder.svg";
                                        }}
                                        priority
                                    />
                                  </div>
                                  <span className="font-medium text-gray-900">{item.name}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{item.sku}</span>
                              </td>
                              <td className="p-4 font-medium">{formatAmount(item.price)}</td>
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
                                    className="border-gray-300 hover:bg-gray-100"
                                    onClick={() => openEditDialog(item)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => confirmDelete(item._id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                              <ShoppingBag className="h-6 w-6 text-indigo-500" />
                            </div>
                            <p className="text-gray-700 font-medium mb-1">No inventory items found</p>
                            <p className="text-gray-500 text-sm mb-4">
                              {searchQuery || filterStatus !== "all"
                                ? "Try adjusting your search or filter criteria."
                                : "Your inventory is empty."}
                            </p>
                            {searchQuery || filterStatus !== "all" ? (
                              <Button variant="outline" size="sm" onClick={() => {
                                setSearchQuery("");
                                setFilterStatus("all");
                              }}>
                                Clear Filters
                              </Button>
                            ) : (
                              <div className="flex gap-2 justify-center">
                                <Button 
                                  size="sm"
                                  onClick={openStandaloneScanner}
                                  variant="outline"
                                  className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                                >
                                  <QrCode className="h-4 w-4 mr-2" /> Scan
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={openAddDialog}
                                  className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                  <Plus className="h-4 w-4 mr-2" /> Add Item
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Barcode Scanner Component */}
      <BarcodeScanner
        isOpen={scannerDialogOpen}
        onClose={() => {
          setScannerDialogOpen(false)
          setScannerMode('standalone')
          setIsScanningForSku(false)
        }}
        onScanResult={handleScanResult}
        existingItems={inventory}
      />

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
                    className={`flex-1 ${!skuValidation.isValid ? 'border-red-300' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateSkuForItem}
                    className="px-3"
                    title="Generate SKU from product name"
                  >
                    <Hash className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openScannerForSku}
                    className={`px-3 ${isScanningForSku ? 'bg-indigo-100 border-indigo-300' : ''}`}
                    title="Scan barcode for SKU"
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
                {isScanningForSku && (
                  <Alert className="border-indigo-200 bg-indigo-50">
                    <AlertDescription className="text-indigo-700 text-sm">
                      Scanner is open - scan a barcode to populate this field
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
                  <div className="relative w-20 h-20 border rounded-md overflow-hidden">
                    <Image
                      src={previewImage}
                      alt="Preview"
                      fill
                      className="object-cover"
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
                    className="cursor-pointer"
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
  </NavbarLayout>
)}