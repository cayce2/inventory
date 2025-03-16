import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface InvoiceItem {
  itemId: string;
  quantity: number;
}

interface InventoryItem {
  _id: string;
  name: string;
  price: number;
}

interface Invoice {
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  items: InvoiceItem[];
  amount: number;
  dueDate: string;
  status: "paid" | "unpaid";
}

interface Payment {
  date: string;
  amount: number;
}

interface Customer {
  name: string;
  phone: string;
}

interface PrintProps {
  invoiceNumber: string;
  invoice: Invoice;
  invoiceItems: { name: string; price: number; quantity: number }[];
  inventory: InventoryItem[];
  payments: Payment[];
  customer: Customer | null;
  amountDue: number;
  amount: number;
  dueDate: string;
  status: "paid" | "unpaid";
  

}

const InvoicePrint: React.FC<PrintProps> = ({ invoice, inventory, payments }) => {
  // Map items in invoice to their corresponding inventory details
  const invoiceItems = invoice.items.map((item) => {
    const inventoryItem = inventory.find((i) => i._id === item.itemId);
    return {
      name: inventoryItem?.name || "Unknown Item",
      quantity: item.quantity,
      price: inventoryItem?.price || 0,
      total: (inventoryItem?.price || 0) * item.quantity,
    };
  });

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = invoice.amount - totalPaid;
  const formattedDueDate = format(new Date(invoice.dueDate), "MMM d, yyyy");
  const today = format(new Date(), "MMM d, yyyy");

  return (
    <Card className="max-w-3xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-3xl font-bold text-blue-700 dark:text-blue-300">Invoice</CardTitle>
            <p className="text-sm text-blue-600 dark:text-blue-400">#{invoice.invoiceNumber}</p>
          </div>
          <Badge 
            className={`px-3 py-1 text-sm ${
              invoice.status === "paid" 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
            }`}
          >
            {invoice.status === "paid" ? "PAID" : "UNPAID"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Bill To:</h3>
            <p className="font-medium">{invoice.customerName}</p>
            <p className="text-gray-600 dark:text-gray-300">{invoice.customerPhone}</p>
          </div>
          
          <div className="space-y-2 md:text-right">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Invoice Details:</h3>
            <p className="font-medium">Issue Date: <span className="text-gray-600 dark:text-gray-300">{today}</span></p>
            <p className="font-medium">Due Date: <span className="text-gray-600 dark:text-gray-300">{formattedDueDate}</span></p>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div className="mb-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableHead className="w-1/2">Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceItems.map((item, index) => (
                <TableRow key={index} className="border-b border-gray-100 dark:border-gray-700">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">${item.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:justify-between md:items-start">
          {payments.length > 0 && (
            <div className="md:w-1/2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Payment History:</h3>
              <div className="space-y-1">
                {payments.map((payment, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{format(new Date(payment.date), "MMM d, yyyy")}</span>
                    <span className="font-medium">${payment.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="md:w-1/2 md:pl-4 md:ml-auto">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-300">Subtotal:</span>
                <span>${invoice.amount.toFixed(2)}</span>
              </div>
              {payments.length > 0 && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-300">Amount Paid:</span>
                  <span className="text-green-600 dark:text-green-400">-${totalPaid.toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>{invoice.status === "paid" ? "Total Paid:" : "Balance Due:"}</span>
                <span className={invoice.status === "paid" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                  ${(invoice.status === "paid" ? invoice.amount : remainingBalance).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoicePrint;