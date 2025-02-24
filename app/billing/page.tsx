/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import { useState, useEffect } from "react";
import type React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import NavbarLayout from "@/components/NavbarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  dueDate: string;
  status: "paid" | "unpaid";
  items: Array<{ itemId: string; quantity: number }>;
}

interface InventoryItem {
  _id: string;
  name: string;
  quantity: number;
  price: number;
}

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: "",
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
    fetchInitialData();
  }, [router]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

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
    } catch (error) {
      setError("Failed to fetch data. Please try again.");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (selectedItem && selectedQuantity > 0) {
      const item = inventory.find((i) => i._id === selectedItem);
      if (item) {
        const newItems = [
          ...newInvoice.items,
          { itemId: selectedItem, quantity: selectedQuantity },
        ];
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
      }
    }
  };

  const handleRemoveItem = (index: number) => {
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
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.post("/api/billing", newInvoice, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewInvoice({
        invoiceNumber: "",
        customerName: "",
        customerPhone: "",
        amount: 0,
        dueDate: "",
        items: [],
      });
      await fetchInitialData();
    } catch (error) {
      setError("Failed to add invoice. Please try again.");
      console.error("Error adding invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInvoiceStatus = async (
    invoiceId: string,
    newStatus: "paid" | "unpaid"
  ) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/billing/${invoiceId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchInitialData();
    } catch (error) {
      setError("Failed to update invoice status. Please try again.");
      console.error("Error updating invoice status:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <NavbarLayout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Billing</h1>
          <Button
            onClick={fetchInitialData}
            variant="outline"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Refresh"
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Create New Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddInvoice} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Invoice Number</label>
                  <Input
                    value={newInvoice.invoiceNumber}
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        invoiceNumber: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Name</label>
                  <Input
                    value={newInvoice.customerName}
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        customerName: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Phone</label>
                  <Input
                    type="tel"
                    value={newInvoice.customerPhone}
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        customerPhone: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={newInvoice.dueDate}
                    onChange={(e) =>
                      setNewInvoice({ ...newInvoice, dueDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Add Items</label>
                  <div className="flex gap-2">
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
                            {item.name} - ${item.price} (Stock: {item.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={selectedQuantity}
                      onChange={(e) =>
                        setSelectedQuantity(Number(e.target.value))
                      }
                      min="1"
                      className="w-24"
                    />
                    <Button
                      type="button"
                      onClick={handleAddItem}
                      disabled={!selectedItem}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Selected Items</label>
                  <div className="border rounded-lg divide-y">
                    {newInvoice.items.map((item, index) => {
                      const inventoryItem = inventory.find(
                        (i) => i._id === item.itemId
                      );
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3"
                        >
                          <div>
                            <p className="font-medium">
                              {inventoryItem?.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Quantity: {item.quantity} × $
                              {inventoryItem?.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-medium">
                              $
                              {inventoryItem
                                ? (
                                    inventoryItem.price * item.quantity
                                  ).toFixed(2)
                                : "0.00"}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    {newInvoice.items.length === 0 && (
                      <p className="p-3 text-gray-500 text-center">
                        No items added yet
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Total Amount</label>
                  <Input
                    type="number"
                    value={newInvoice.amount}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || newInvoice.items.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Invoice"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice._id}>
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {invoice.customerName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {invoice.customerPhone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invoice.status === "paid"
                                ? "success"
                                : "destructive"
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={
                              invoice.status === "paid"
                                ? "destructive"
                                : "default"
                            }
                            size="sm"
                            onClick={() =>
                              handleUpdateInvoiceStatus(
                                invoice._id,
                                invoice.status === "paid"
                                  ? "unpaid"
                                  : "paid"
                              )
                            }
                            disabled={loading}
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : invoice.status === "paid" ? (
                              "Mark Unpaid"
                            ) : (
                              "Mark Paid"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </NavbarLayout>
  );
}