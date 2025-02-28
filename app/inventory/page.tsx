/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Plus, Edit2, Trash2, Save, ShoppingBag, Search, ArrowUpDown, Loader } from "lucide-react"
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
//import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

interface InventoryItem {
  _id: string
  name: string
  quantity: number
  price: number
  imageUrl: string
  lowStockThreshold: number
}

const defaultNewItem = {
  name: "",
  quantity: 0,
  price: 0,
  imageUrl: "",
  lowStockThreshold: 10
}

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([])
  const [newItem, setNewItem] = useState(defaultNewItem)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<"name" | "price" | "quantity">("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filterStatus, setFilterStatus] = useState<"all" | "inStock" | "lowStock" | "outOfStock">("all")
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
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
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
      }
      return sortDirection === "asc" ? comparison : -comparison
    })
    
    setFilteredInventory(result)
  }, [inventory, searchQuery, sortField, sortDirection, filterStatus])

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

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      await axios.post("/api/inventory", newItem, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setNewItem(defaultNewItem)
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
    if (!editingItem) return

    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      await axios.put("/api/inventory", editingItem, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEditingItem(null)
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

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item)
    setItemDialogOpen(true)
  }

  const openAddDialog = () => {
    setEditingItem(null)
    setNewItem(defaultNewItem)
    setItemDialogOpen(true)
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

  const toggleSort = (field: "name" | "price" | "quantity") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-500 mt-1">Manage your products and stock levels</p>
            </div>
            <Button 
              onClick={openAddDialog} 
              className="self-start bg-indigo-600 hover:bg-indigo-700"
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Item
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search products..."
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
                        <div className="relative h-48 overflow-hidden bg-gray-100">
                          <img
                            src={item.imageUrl || "/placeholder.svg"}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder.svg";
                            }}
                          />
                          <div className="absolute top-2 right-2">
                            <Badge className={`${stockStatus.color} text-white`}>
                              {stockStatus.label}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold mb-3 line-clamp-1 text-gray-900">{item.name}</h3>
                          
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-500">Stock Level</span>
                                <span className="text-sm font-medium">{item.quantity} units</span>
                              </div>
                              <Progress value={stockPercentage} className="h-2" />
                            </div>
                            
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                              <span className="text-gray-700 font-semibold">KES {item.price.toFixed(2)}</span>
                              <span className="text-sm text-gray-500">Threshold: {item.lowStockThreshold}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between bg-gray-50 p-4 border-t">
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
                      <Button 
                        onClick={openAddDialog}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Your First Item
                      </Button>
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
                        <th className="text-left p-4 font-medium text-gray-600">Product</th>
                        <th className="text-left p-4 font-medium text-gray-600 cursor-pointer" onClick={() => toggleSort("price")}>
                          <div className="flex items-center">
                            Price
                            {sortField === "price" && (
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                            )}
                          </div>
                        </th>
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
                                  <div className="h-10 w-10 rounded-md bg-gray-100 mr-3 overflow-hidden border border-gray-200">
                                    <img 
                                      src={item.imageUrl || "/placeholder.svg"}
                                      alt={item.name}
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = "/placeholder.svg";
                                      }}
                                    />
                                  </div>
                                  <span className="font-medium text-gray-900">{item.name}</span>
                                </div>
                              </td>
                              <td className="p-4 font-medium">KES{item.price.toFixed(2)}</td>
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
                          <td colSpan={5} className="p-8 text-center">
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
                              <Button 
                                size="sm"
                                onClick={openAddDialog}
                                className="bg-indigo-600 hover:bg-indigo-700"
                              >
                                <Plus className="h-4 w-4 mr-2" /> Add Item
                              </Button>
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

      {/* Item Add/Edit Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-md">
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (KES)</Label>
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
                <Label htmlFor="imageUrl">Product Image URL</Label>
                <Input
                  id="imageUrl"
                  value={editingItem ? editingItem.imageUrl : newItem.imageUrl}
                  onChange={(e) =>
                    editingItem
                      ? setEditingItem({ ...editingItem, imageUrl: e.target.value })
                      : setNewItem({ ...newItem, imageUrl: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
                {(editingItem?.imageUrl || newItem.imageUrl) && (
                  <div className="mt-2 h-16 w-16 rounded border overflow-hidden">
                    <img 
                      src={(editingItem ? editingItem.imageUrl : newItem.imageUrl) || "/placeholder.svg"} 
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <span className="text-sm text-gray-500">
                    Alert when stock falls below this level
                  </span>
                </div>
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
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setItemDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingItem ? "Update Item" : "Add Item"}
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
            <AlertDialogTitle className="text-xl">Delete Inventory Item</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteItem}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </div>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Item
                </>
              )}
              {isLoading ? (
                <div className="flex items-center">
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </div>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Item
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NavbarLayout>
  );
}