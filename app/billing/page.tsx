/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import NavbarLayout from "@/components/NavbarLayout"
import { 
  Trash2, 
  RefreshCcw, 
  CheckCircle, 
  XCircle, 
  Printer, 
  Plus, 
  AlertCircle,
  X,
  CreditCard,
  Filter,
  ChevronDown,
  Search,
} from "lucide-react"
import Print from "@/components/Print"
import { motion, AnimatePresence } from "framer-motion"

interface Invoice {
  _id: string
  invoiceNumber: string
  customerName: string
  customerPhone: string
  amount: number
  dueDate: string
  status: "paid" | "unpaid"
  items: Array<{ itemId: string; quantity: number }>
  deleted: boolean
}

interface InventoryItem {
  _id: string
  name: string
  quantity: number
  price: number
}

export default function Billing() {
  const generateInvoiceNumber = () => {
    return `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: generateInvoiceNumber(),
    customerName: "",
    customerPhone: "",
    amount: 0,
    dueDate: "",
    items: [] as Array<{ itemId: string; quantity: number; adjustedPrice?: number }>,
  })
  
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [selectedItem, setSelectedItem] = useState("")
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [showDeleted, setShowDeleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">("all")
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [showPrintModal, setShowPrintModal] = useState(false)
  

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchInvoices()
    fetchInventory()
  }, [router])

  const fetchInvoices = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }
      const response = await axios.get("/api/billing", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setInvoices(response.data)
    } catch (error) {
      console.error("Error fetching invoices:", error)
      setError("Failed to fetch invoices. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchInventory = async () => {
    try {
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
      setError("Failed to fetch inventory. Please try again.")
    }
  }

  const handleAddItem = () => {
    if (selectedItem && selectedQuantity > 0) {
      const item = inventory.find((i) => i._id === selectedItem)
      if (item) {
        const newItems = [
          ...newInvoice.items,
          {
            itemId: selectedItem,
            quantity: selectedQuantity,
            adjustedPrice: item.price,
          },
        ]
        const newAmount = newItems.reduce((total, item) => {
          const inventoryItem = inventory.find((i) => i._id === item.itemId)
          const price = item.adjustedPrice !== undefined ? item.adjustedPrice : inventoryItem ? inventoryItem.price : 0
          return total + price * item.quantity
        }, 0)
        setNewInvoice({
          ...newInvoice,
          items: newItems,
          amount: newAmount,
        })
        setSelectedItem("")
        setSelectedQuantity(1)
      }
    }
  }

  const handleRemoveItem = (index: number) => {
    const updatedItems = newInvoice.items.filter((_, i) => i !== index)
    const newAmount = updatedItems.reduce((total, item) => {
      const inventoryItem = inventory.find((i) => i._id === item.itemId)
      const price = item.adjustedPrice !== undefined ? item.adjustedPrice : inventoryItem ? inventoryItem.price : 0
      return total + price * item.quantity
    }, 0)
    
    setNewInvoice({
      ...newInvoice,
      items: updatedItems,
      amount: newAmount,
    })
  }

  const handlePriceAdjustment = (index: number, newPrice: number) => {
    const updatedItems = [...newInvoice.items]
    updatedItems[index].adjustedPrice = newPrice

    const newAmount = updatedItems.reduce((total, item) => {
      const inventoryItem = inventory.find((i) => i._id === item.itemId)
      const price = item.adjustedPrice !== undefined ? item.adjustedPrice : inventoryItem ? inventoryItem.price : 0
      return total + price * item.quantity
    }, 0)

    setNewInvoice({
      ...newInvoice,
      items: updatedItems,
      amount: newAmount,
    })
  }

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
  
      if (!newInvoice.customerName || !newInvoice.dueDate || newInvoice.items.length === 0) {
        setError("Please fill in all required fields and add at least one item");
        return;
      }
  
      const invoiceData = { 
        ...newInvoice, 
        invoiceNumber: newInvoice.invoiceNumber || generateInvoiceNumber()
      };
  
      await axios.post("/api/billing", invoiceData, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      setNewInvoice({
        invoiceNumber: generateInvoiceNumber(),
        customerName: "",
        customerPhone: "",
        amount: 0,
        dueDate: "",
        items: [],
      });
  
      fetchInvoices();
      fetchInventory();
      setIsCreatingInvoice(false);
    } catch (error) {
      console.error("Error adding invoice:", error);
      setError("An unexpected error occurred while adding the invoice");
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleInvoiceAction = async (invoiceId: string, action: string) => {
    setError(null)
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      const payload = { action }

      await axios({
        method: "put",
        url: `/api/billing/${invoiceId}`,
        data: payload,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      await fetchInvoices()
    } catch (error) {
      console.error(`Error performing action on invoice:`, error)
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server response:", error.response.data)
        setError(`Error: ${error.response.data.error || `Failed to ${action} invoice`}`)
      } else {
        setError(`An unexpected error occurred while updating the invoice`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = (invoice: Invoice) => {
    setPrintingInvoice(invoice)
    setShowPrintModal(true)
  }

  const handlePrintDocument = () => {
    if (printRef.current) {
      // Create a style element for print-specific styling
      const style = document.createElement('style');
      style.innerHTML = `
        @media print {
          body * {
            visibility: hidden;
          }
          #printSection, #printSection * {
            visibility: visible;
          }
          #printSection {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `;
      
      // Add an ID to the print reference for targeting in CSS
      printRef.current.id = 'printSection';
      
      // Append style to head
      document.head.appendChild(style);
      
      // Trigger print
      window.print();
      
      // Clean up
      document.head.removeChild(style);
      setShowPrintModal(false);
    }
  };

  const getFilteredInvoices = () => {
    return invoices.filter((invoice) => {
      // Filter by deletion status
      if (!showDeleted && invoice.deleted) return false;
      
      // Filter by status
      if (filterStatus !== "all" && invoice.status !== filterStatus) return false;
      
      // Filter by search term
      if (searchTerm && 
          !invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }

  const getDueStatus = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "overdue";
    if (diffDays <= 3) return "due-soon";
    return "upcoming";
  }

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg flex items-center max-w-lg w-full"
            >
              <AlertCircle className="mr-3 flex-shrink-0" size={20} />
              <span className="mr-2">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700 transition-colors"
              >
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Billing Dashboard</h1>
              <p className="text-gray-500">Manage your invoices and customer billing</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => setIsCreatingInvoice(true)}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="mr-2" size={16} />
                New Invoice
              </button>
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">Invoice List</h2>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="text-gray-400" size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="Search invoices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value as "all" | "paid" | "unpaid")}
                          className="pl-4 pr-10 py-2 rounded-md border border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500 appearance-none"
                        >
                          <option value="all">All Status</option>
                          <option value="paid">Paid</option>
                          <option value="unpaid">Unpaid</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <ChevronDown size={16} className="text-gray-400" />
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDeleted(!showDeleted)}
                        className={`flex items-center justify-center px-3 py-2 border ${
                          showDeleted 
                            ? 'bg-gray-200 border-gray-300 text-gray-700' 
                            : 'bg-white border-gray-300 text-gray-700'
                        } rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                        title="Toggle deleted invoices"
                      >
                        <Filter size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {isLoading ? (
                  <div className="py-16 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading invoices...</p>
                  </div>
                ) : getFilteredInvoices().length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-gray-300 rounded-lg">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <CreditCard className="text-gray-400" size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No invoices found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm || filterStatus !== "all" || showDeleted ? 
                        "Try changing your search filters" : 
                        "Start by creating your first invoice"}
                    </p>
                    {!isCreatingInvoice && (
                      <button
                        onClick={() => setIsCreatingInvoice(true)}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <Plus className="mr-2" size={16} />
                        New Invoice
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-6">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Invoice #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredInvoices().map((invoice) => {
                          const dueStatus = getDueStatus(invoice.dueDate);
                          
                          return (
                            <motion.tr 
                              key={invoice._id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className={`${invoice.deleted ? 'bg-gray-50' : ''} hover:bg-gray-50 transition-colors`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {invoice.invoiceNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="font-medium text-gray-900">{invoice.customerName}</div>
                                <div className="text-gray-500 text-xs">{invoice.customerPhone}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                KES {invoice.amount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                    dueStatus === 'overdue' ? 'bg-red-500' : 
                                    dueStatus === 'due-soon' ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}></span>
                                  <span>
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                    {dueStatus === 'overdue' && (
                                      <span className="ml-1 text-xs text-red-500 font-medium">OVERDUE</span>
                                    )}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  invoice.status === "paid" 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-yellow-100 text-yellow-800"
                                }`}>
                                  {invoice.status === "paid" ? (
                                    <>
                                      <CheckCircle className="mr-1" size={12} />
                                      Paid
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="mr-1" size={12} />
                                      Unpaid
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  {!invoice.deleted ? (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleInvoiceAction(
                                            invoice._id,
                                            invoice.status === "paid" ? "markUnpaid" : "markPaid"
                                          )
                                        }
                                        className={`p-1.5 rounded-full ${
                                          invoice.status === "paid"
                                            ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                                            : "bg-green-100 text-green-600 hover:bg-green-200"
                                        } transition-colors`}
                                        title={invoice.status === "paid" ? "Mark as Unpaid" : "Mark as Paid"}
                                        disabled={isLoading}
                                      >
                                        {invoice.status === "paid" ? (
                                          <XCircle size={16} />
                                        ) : (
                                          <CheckCircle size={16} />
                                        )}
                                      </button>
                                      <button
                                        onClick={() => handleInvoiceAction(invoice._id, "delete")}
                                        className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                        title="Delete Invoice"
                                        disabled={isLoading}
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                      <button
                                        onClick={() => handlePrint(invoice)}
                                        className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                        title="Print Invoice"
                                        disabled={isLoading}
                                      >
                                        <Printer size={16} />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleInvoiceAction(invoice._id, "restore")}
                                      className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                      title="Restore Invoice"
                                      disabled={isLoading}
                                    >
                                      <RefreshCcw size={16} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Creation Modal */}
        <AnimatePresence>
          {isCreatingInvoice && (
            <>
              <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm z-30" onClick={() => setIsCreatingInvoice(false)}></div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 overflow-y-auto z-40 flex items-center justify-center p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Create New Invoice</h3>
                    <button
                      onClick={() => setIsCreatingInvoice(false)}
                      className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="overflow-y-auto p-6 max-h-[calc(90vh-60px)]">
                    <form ref={formRef} onSubmit={handleAddInvoice} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Invoice Number *
                          </label>
                          <input
                            type="text"
                            id="invoiceNumber"
                            value={newInvoice.invoiceNumber}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 cursor-not-allowed"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Name *
                          </label>
                          <input
                            type="text"
                            id="customerName"
                            value={newInvoice.customerName}
                            onChange={(e) => setNewInvoice({ ...newInvoice, customerName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Phone *
                          </label>
                          <input
                            type="tel"
                            id="customerPhone"
                            value={newInvoice.customerPhone}
                            onChange={(e) => setNewInvoice({ ...newInvoice, customerPhone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Due Date *
                          </label>
                          <input
                            type="date"
                            id="dueDate"
                            value={newInvoice.dueDate}
                            onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Add Item</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={selectedItem}
                            onChange={(e) => setSelectedItem(e.target.value)}
                            className="w-full sm:flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select an item</option>
                            {inventory.map((item) => (
                              <option key={item._id} value={item._id}>
                                {item.name} - KES {item.price.toFixed(2)} (Available: {item.quantity})
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={selectedQuantity}
                              onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                              min="1"
                              className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Qty"
                            />
                            <button
                              type="button"
                              onClick={handleAddItem}
                              disabled={!selectedItem || selectedQuantity < 1}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Invoice Items</h4>
                        {newInvoice.items.length === 0 ? (
                          <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
                            <p className="text-gray-500">No items added to this invoice</p>
                            <p className="text-sm text-gray-400">Select items from the inventory above</p>
                          </div>
                        ) : (
                          <div className="border border-gray-200 rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Item
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price (KES)
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subtotal
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {newInvoice.items.map((item, index) => {
                                  const inventoryItem = inventory.find((i) => i._id === item.itemId);
                                  const price = item.adjustedPrice !== undefined ? item.adjustedPrice : inventoryItem ? inventoryItem.price : 0;
                                  const subtotal = price * item.quantity;
                                  
                                  return (
                                    <tr key={index}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {inventoryItem?.name || "Unknown Item"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                        <input
                                          type="number"
                                          value={price}
                                          onChange={(e) => handlePriceAdjustment(index, Number(e.target.value))}
                                          min="0"
                                          step="0.01"
                                          className="w-24 px-2 py-1 border border-gray-300 rounded-md text-right"
                                        />
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                        {item.quantity}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                        {subtotal.toFixed(2)}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveItem(index)}
                                          className="text-red-600 hover:text-red-800"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                                <tr className="bg-gray-50">
                                  <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                    Total Amount:
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                    {newInvoice.amount.toFixed(2)}
                                  </td>
                                  <td></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => setIsCreatingInvoice(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading || newInvoice.items.length === 0}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                        >
                          {isLoading ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </span>
                          ) : (
                            "Create Invoice"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Print Modal */}
        <AnimatePresence>
          {showPrintModal && printingInvoice && (
            <>
              <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm z-30" onClick={() => setShowPrintModal(false)}></div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 overflow-y-auto z-40 flex items-center justify-center p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Print Invoice</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={handlePrintDocument}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Printer className="mr-1.5" size={16} />
                        Print
                      </button>
                      <button
                        onClick={() => setShowPrintModal(false)}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-y-auto p-6 max-h-[calc(90vh-60px)]">
                    <div ref={printRef} className="p-8 bg-white">
                      <Print invoice={printingInvoice} inventory={inventory} invoiceNumber={""} invoiceItems={[]} payments={[]} customer={null} amountDue={0} amount={0} dueDate={""} status={"paid"} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </NavbarLayout>
  );
}