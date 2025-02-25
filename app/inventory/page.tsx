/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Plus, Edit2, Trash2, Save, ShoppingBag } from "lucide-react"
import NavbarLayout from "@/components/NavbarLayout"
import { 
  Card, 
  CardContent, 
  CardFooter, 
 
} from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

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
  const [newItem, setNewItem] = useState(defaultNewItem)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchInventory()
  }, [router])

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

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Inventory Management</h1>
              <p className="text-gray-500 mt-1">Manage your products and stock levels</p>
            </div>
            <Button 
              onClick={openAddDialog} 
              className="self-start"
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Item
            </Button>
          </div>

          <Tabs defaultValue="grid" className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="grid">Grid View</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
              </TabsList>
              <div className="text-sm text-gray-500">
                {inventory.length} items in inventory
              </div>
            </div>

            <TabsContent value="grid" className="mt-0">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="w-full h-48 bg-gray-200 rounded-t-lg" />
                      <CardContent className="p-6">
                        <div className="h-6 bg-gray-200 rounded mb-4 w-3/4" />
                        <div className="h-4 bg-gray-200 rounded mb-2 w-1/2" />
                        <div className="h-4 bg-gray-200 rounded mb-2 w-1/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : inventory.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {inventory.map((item) => {
                    const stockStatus = getStockStatus(item);
                    return (
                      <Card key={item._id} className="overflow-hidden border border-gray-200 transition-all hover:shadow-md">
                        <div className="relative h-48 overflow-hidden bg-gray-100">
                          <img
                            src={item.imageUrl || "/placeholder.svg"}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform hover:scale-105"
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
                          <h3 className="text-xl font-semibold mb-2 line-clamp-1">{item.name}</h3>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-500">Quantity</span>
                            <span className="font-medium">{item.quantity}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Price</span>
                            <span className="font-medium">${item.price.toFixed(2)}</span>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between bg-gray-50 p-4 border-t">
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
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-1">No inventory items</h3>
                    <p className="text-gray-500 mb-4 max-w-md">You haven&apos;t added any items to your inventory yet. Add your first item to get started.</p>
                    <Button onClick={openAddDialog}>
                      <Plus className="h-4 w-4 mr-2" /> Add Your First Item
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="table" className="mt-0">
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Product</th>
                        <th className="text-left p-4">Price</th>
                        <th className="text-left p-4">Quantity</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-right p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        [1, 2, 3, 4, 5].map((i) => (
                          <tr key={i} className="border-b animate-pulse">
                            <td className="p-4">
                              <div className="flex items-center">
                                <div className="h-10 w-10 bg-gray-200 rounded mr-3" />
                                <div className="h-4 w-32 bg-gray-200 rounded" />
                              </div>
                            </td>
                            <td className="p-4"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                            <td className="p-4"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
                            <td className="p-4"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                            <td className="p-4 text-right"><div className="h-8 w-24 bg-gray-200 rounded ml-auto" /></td>
                          </tr>
                        ))
                      ) : inventory.length > 0 ? (
                        inventory.map((item) => {
                          const stockStatus = getStockStatus(item);
                          return (
                            <tr key={item._id} className="border-b hover:bg-gray-50">
                              <td className="p-4">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded bg-gray-100 mr-3 overflow-hidden">
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
                                  <span className="font-medium">{item.name}</span>
                                </div>
                              </td>
                              <td className="p-4">${item.price.toFixed(2)}</td>
                              <td className="p-4">{item.quantity}</td>
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
                            <ShoppingBag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">No inventory items found</p>
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
            <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editingItem ? handleEditItem : handleAddItem}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  className="col-span-3"
                  value={editingItem ? editingItem.name : newItem.name}
                  onChange={(e) =>
                    editingItem
                      ? setEditingItem({ ...editingItem, name: e.target.value })
                      : setNewItem({ ...newItem, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  className="col-span-3"
                  value={editingItem ? editingItem.quantity : newItem.quantity}
                  onChange={(e) =>
                    editingItem
                      ? setEditingItem({ ...editingItem, quantity: Number.parseInt(e.target.value) })
                      : setNewItem({ ...newItem, quantity: Number.parseInt(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Price
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  className="col-span-3"
                  value={editingItem ? editingItem.price : newItem.price}
                  onChange={(e) =>
                    editingItem
                      ? setEditingItem({ ...editingItem, price: Number.parseFloat(e.target.value) })
                      : setNewItem({ ...newItem, price: Number.parseFloat(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imageUrl" className="text-right">
                  Image URL
                </Label>
                <Input
                  id="imageUrl"
                  className="col-span-3"
                  value={editingItem ? editingItem.imageUrl : newItem.imageUrl}
                  onChange={(e) =>
                    editingItem
                      ? setEditingItem({ ...editingItem, imageUrl: e.target.value })
                      : setNewItem({ ...newItem, imageUrl: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lowStockThreshold" className="text-right">
                  Low Stock Threshold
                </Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  className="col-span-3"
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
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
            <AlertDialogTitle>Are you sure you want to delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteItem}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                  Deleting...
                </div>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NavbarLayout>
  )
}