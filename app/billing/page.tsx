/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import { useState, useEffect } from "react";
import type React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
// Added Toast functionality
import { useToast } from "@/hooks/use-toast";
import NavbarLayout from "@/components/NavbarLayout";
// Added shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
// Added dialog components for delete confirmation
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Added more icons for better UX
import { 
  Loader2, 
  Plus, 
  Trash2, 
  RefreshCcw, 
  CheckCircle, 
  XCircle,
  Receipt,
  User,
  Phone,
  Calendar,
  Package,
  DollarSign,
  AlertTriangle
} from "lucide-react";
// Added Tab components for better organization
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  dueDate: string;
  status: "paid" | "unpaid";
  items: Array<{ itemId: string; quantity: number }>;
  // Removed 'deleted' field since it's handled differently in the new version
}

interface InventoryItem {
  _id: string;
  name: string;
  quantity: number;
  price: number;
}

export default function Billing() {
  // Added toast functionality
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  // Added loading and error states for better UX
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Added tab state for filtering invoices
  const [activeTab, setActiveTab] = useState("all");
  // Added state for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  // Removed showDeleted state since it's handled differently
  const [newInvoice, setNewInvoice] = useState({
    customerName: "",
    customerPhone: "",
    amount: 0,
    dueDate: "",
    items: [] as Array<{ itemId: string; quantity: number }>,
  });
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    // Renamed to fetchInitialData to better describe its purpose
    fetchInitialData();
  }, [router]);

  // Consolidated API calls with Promise.all for better performance
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Optimized with Promise.all to fetch both resources in parallel
      const [invoicesRes, inventoryRes] = await Promise.all([
        axios.get("/api/billing", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/inventory", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setInvoices(invoicesRes.data);
      setInventory(inventoryRes.data);
      // Added toast notification for feedback
      toast({
        title: "Data refreshed",
        description: "Billing information has been updated.",
      });
    } catch (error) {
      setError("Failed to fetch data. Please try again.");
      // Added error toast
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch data. Please try again.",
      });
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to generate invoice number
  const generateInvoiceNumber = () => {
    const prefix = "INV";
    const timestamp = Date.now().toString().slice(-6); // Use last 6 digits of timestamp
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0"); // Random 3-digit number
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleAddItem = () => {
    if (selectedItem && selectedQuantity > 0) {
      const item = inventory.find((i) => i._id === selectedItem);
      if (item) {
        // Added check if item already exists to update quantity instead of adding duplicate
        const existingItemIndex = newInvoice.items.findIndex(
          (i) => i.itemId === selectedItem
        );

        let newItems;
        if (existingItemIndex >= 0) {
          // Update existing item quantity
          newItems = [...newInvoice.items];
          newItems[existingItemIndex].quantity += selectedQuantity;
        } else {
          // Add new item
          newItems = [
            ...newInvoice.items,
            { itemId: selectedItem, quantity: selectedQuantity },
          ];
        }

        const newAmount = newItems.reduce((total, item) => {
          const inventoryItem = inventory.find((i) => i._id === item.itemId);
          return total + (inventoryItem ? inventoryItem.price * item.quantity : 0);
        }, 0);
        
        setNewInvoice({
          ...newInvoice,
          items: newItems,
          amount: newAmount,
        });
        setSelectedItem("");
        setSelectedQuantity(1);
        
        // Added toast notification
        toast({
          title: "Item added",
          description: `${item.name} has been added to the invoice.`,
        });
      }
    }
  };

  // Added new function to remove items
  const handleRemoveItem = (index: number) => {
    const removedItem = inventory.find(
      (i) => i._id === newInvoice.items[index].itemId
    );
    
    const newItems = newInvoice.items.filter((_, i) => i !== index);
    const newAmount = newItems.reduce((total, item) => {
      const inventoryItem = inventory.find((i) => i._id === item.itemId);
      return total + (inventoryItem ? inventoryItem.price * item.quantity : 0);
    }, 0);
    
    setNewInvoice({
      ...newInvoice,
      items: newItems,
      amount: newAmount,
    });
    
    // Added toast for feedback
    if (removedItem) {
      toast({
        title: "Item removed",
        description: `${removedItem.name} has been removed from the invoice.`,
      });
    }
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Added submitting state for UI feedback
      setSubmitting(true);
      const token = localStorage.getItem("token");
      
      // Generate invoice number before submitting
      const invoiceNumber = generateInvoiceNumber();
      
      // Add the generated invoice number to the invoice data
      await axios.post("/api/billing", { ...newInvoice, invoiceNumber }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setNewInvoice({
        customerName: "",
        customerPhone: "",
        amount: 0,
        dueDate: "",
        items: [],
      });
      
      await fetchInitialData();
      
      // Added success toast
      toast({
        title: "Invoice created",
        description: `Invoice #${invoiceNumber} has been created successfully.`,
      });
      
      // Switch to invoices tab after creation
      setActiveTab("all");
    } catch (error) {
      setError("Failed to add invoice. Please try again.");
      // Added error toast
      toast({
        variant: "destructive",
        title: "Error creating invoice",
        description: "Please check the form and try again.",
      });
      console.error("Error adding invoice:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Replaced handleInvoiceAction with more specific function
  const handleUpdateInvoiceStatus = async (
    invoiceId: string,
    newStatus: "paid" | "unpaid",
    invoiceNumber: string
  ) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      // Changed API endpoint pattern
      await axios.put(
        `/api/billing/${invoiceId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      await fetchInitialData();
      
      // Added success toast
      toast({
        title: `Invoice ${newStatus === "paid" ? "marked as paid" : "marked as unpaid"}`,
        description: `Invoice #${invoiceNumber} status has been updated.`,
      });
    } catch (error) {
      setError("Failed to update invoice status. Please try again.");
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: "Please try again later.",
      });
      console.error("Error updating invoice status:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // New function to handle invoice deletion
  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      
      await axios.delete(`/api/billing/${invoiceToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Close dialog first for better UX
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      
      await fetchInitialData();
      
      toast({
        title: "Invoice deleted",
        description: `Invoice #${invoiceToDelete.invoiceNumber} has been permanently deleted.`,
      });
    } catch (error) {
      setError("Failed to delete invoice. Please try again.");
      toast({
        variant: "destructive",
        title: "Error deleting invoice",
        description: "Please try again later.",
      });
      console.error("Error deleting invoice:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Function to open delete confirmation dialog
  const openDeleteDialog = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  // Added filtering based on active tab
  const filteredInvoices = invoices.filter(invoice => {
    if (activeTab === "all") return true;
    return invoice.status === activeTab;
  });

  // Complete redesign of the UI with shadcn components and better organization
  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 md:p-8">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Billing Management</h1>
              <p className="text-gray-500 mt-1">Create and manage customer invoices</p>
            </div>
            <Button
              onClick={fetchInitialData}
              variant="outline"
              className="group"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4 transition-transform group-hover:rotate-180" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </header>
        
        <Tabs defaultValue="create" className="mb-8">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Create Invoice</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              <span>Manage Invoices</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="mt-0">
            <Card className="overflow-hidden border-t-4 border-t-blue-500 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  Create New Invoice
                </CardTitle>
                <CardDescription>
                  Fill in the details below to create a new customer invoice
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddInvoice} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Removed manual invoice number input field */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <Receipt className="h-4 w-4 text-gray-500" />
                        Invoice Number
                      </label>
                      <div className="flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm text-gray-500">
                        Auto-generated on submission
                      </div>
                      <p className="text-xs text-gray-500">Format: INV-XXXXXX-XXX</p>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        Due Date
                      </label>
                      <Input
                        type="date"
                        value={newInvoice.dueDate}
                        onChange={(e) =>
                          setNewInvoice({ ...newInvoice, dueDate: e.target.value })
                        }
                        required
                        className="transition-all focus-visible:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4 text-gray-500" />
                        Customer Name
                      </label>
                      <Input
                        value={newInvoice.customerName}
                        onChange={(e) =>
                          setNewInvoice({
                            ...newInvoice,
                            customerName: e.target.value,
                          })
                        }
                        placeholder="Enter customer name"
                        required
                        className="transition-all focus-visible:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="h-4 w-4 text-gray-500" />
                        Customer Phone
                      </label>
                      <Input
                        type="tel"
                        value={newInvoice.customerPhone}
                        onChange={(e) =>
                          setNewInvoice({
                            ...newInvoice,
                            customerPhone: e.target.value,
                          })
                        }
                        placeholder="Enter phone number"
                        required
                        className="transition-all focus-visible:ring-blue-500"
                      />
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <Package className="h-4 w-4 text-gray-500" />
                        Add Items
                      </label>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Select
                        value={selectedItem}
                        onValueChange={setSelectedItem}
                      >
                        <SelectTrigger className="flex-grow">
                          <SelectValue placeholder="Select an item" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventory.map((item) => (
                            <SelectItem key={item._id} value={item._id}>
                              <span className="font-medium">{item.name}</span>
                              <span className="ml-2 text-gray-500">
                                KES {item.price.toFixed(2)} | Stock: {item.quantity}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={selectedQuantity}
                          onChange={(e) =>
                            setSelectedQuantity(Math.max(1, Number(e.target.value)))
                          }
                          min="1"
                          className="w-24"
                        />
                        <Button
                          type="button"
                          onClick={handleAddItem}
                          disabled={!selectedItem}
                          className="group"
                        >
                          <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Selected Items</h3>
                      <Badge variant="outline" className="px-2 py-1">
                        {newInvoice.items.length} {newInvoice.items.length === 1 ? 'item' : 'items'}
                      </Badge>
                    </div>
                    
                    <ScrollArea className="h-60 rounded-lg">
                      <div className="space-y-2">
                        {newInvoice.items.map((item, index) => {
                          const inventoryItem = inventory.find(
                            (i) => i._id === item.itemId
                          );
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:border-blue-200 transition-all"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {inventoryItem?.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Quantity: {item.quantity} × KES {inventoryItem?.price.toFixed(2)}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <p className="font-medium text-blue-600">
                                  KES 
                                  {inventoryItem
                                    ? (inventoryItem.price * item.quantity).toFixed(2)
                                    : "0.00"}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(index)}
                                  className="hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                        {newInvoice.items.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
                            <Package className="h-10 w-10 mb-2 text-gray-300" />
                            <p>No items added yet</p>
                            <p className="text-sm">Select items from the inventory to add them to this invoice</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Total Amount</span>
                    </div>
                    <div className="text-xl font-bold text-blue-700">
                      KES {newInvoice.amount.toFixed(2)}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all"
                    disabled={submitting || newInvoice.items.length === 0}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Invoice...
                      </>
                    ) : (
                      <>
                        <Receipt className="mr-2 h-4 w-4" />
                        Create Invoice
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="manage" className="mt-0">
            <Card className="border-t-4 border-t-indigo-500 shadow-md">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-indigo-600" />
                      Invoice List
                    </CardTitle>
                    <CardDescription>
                      Manage and track all customer invoices
                    </CardDescription>
                  </div>
                  
                  <div className="flex bg-white rounded-lg p-1 border shadow-sm">
                    <Button 
                      variant={activeTab === "all" ? "default" : "ghost"} 
                      size="sm"
                      onClick={() => setActiveTab("all")}
                      className={activeTab === "all" ? "bg-indigo-600" : ""}
                    >
                      All
                    </Button>
                    <Button 
                      variant={activeTab === "paid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveTab("paid")}
                      className={activeTab === "paid" ? "bg-green-600" : ""}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Paid
                    </Button>
                    <Button 
                      variant={activeTab === "unpaid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveTab("unpaid")}
                      className={activeTab === "unpaid" ? "bg-red-600" : ""}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Unpaid
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array(5).fill(0).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-32 mb-1" />
                              <Skeleton className="h-4 w-24" />
                            </TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : filteredInvoices.length > 0 ? (
                        filteredInvoices.map((invoice) => (
                          <TableRow key={invoice._id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {invoice.customerName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {invoice.customerPhone}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              KES {invoice.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {new Date(invoice.dueDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={invoice.status === "paid" ? "success" : "destructive"}
                                className={`${
                                  invoice.status === "paid" 
                                    ? "bg-green-100 text-green-800 hover:bg-green-200" 
                                    : "bg-red-100 text-red-800 hover:bg-red-200"
                                } transition-colors`}
                              >
                                {invoice.status === "paid" ? (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Paid
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <XCircle className="h-3 w-3" />
                                    Unpaid
                                  </span>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant={invoice.status === "paid" ? "destructive" : "default"}
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateInvoiceStatus(
                                      invoice._id,
                                      invoice.status === "paid" ? "unpaid" : "paid",
                                      invoice.invoiceNumber
                                    )
                                  }
                                  disabled={submitting}
                                  className={invoice.status === "paid" 
                                    ? "bg-red-600 hover:bg-red-700" 
                                    : "bg-green-600 hover:bg-green-700"}
                                >
                                  {submitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : invoice.status === "paid" ? (
                                    <span className="flex items-center gap-1">
                                      <XCircle className="h-4 w-4" />
                                      Unpaid
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle className="h-4 w-4" />
                                      Paid
                                    </span>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteDialog(invoice)}
                                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <Receipt className="h-10 w-10 mb-2 text-gray-300" />
                              <p className="font-medium text-lg mb-1">No invoices found</p>
                              <p className="text-gray-500 text-sm">
                                {activeTab === "all" 
                                  ? "You haven't created any invoices yet." 
                                  : `No ${activeTab} invoices found.`}
                              </p>
                              <Button 
                                variant="outline" 
                                onClick={() => setActiveTab("all")}
                                className="mt-4"
                              >
                                View all invoices
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice{" "}
              <span className="font-semibold">#{invoiceToDelete?.invoiceNumber}</span> for{" "}
              <span className="font-semibold">{invoiceToDelete?.customerName}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-red-50 rounded-lg border border-red-100 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-800">Warning</p>
                <p className="text-sm text-red-600">
                  This will permanently delete the invoice and all associated data.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteInvoice}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Invoice
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NavbarLayout>
  );
}