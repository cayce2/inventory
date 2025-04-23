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
  invoice: Invoice;
  invoiceItems?: { name: string; price: number; quantity: number }[];
  inventory: InventoryItem[];
  payments: Payment[];
  customer?: Customer | null;
  amountDue?: number;
  amount?: number;
  dueDate?: string;
  status?: "paid" | "unpaid";
  invoiceNumber?: string;
  currency: string
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
  
  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status === "unpaid";

  return (
    <Card className="max-w-3xl mx-auto shadow-lg border-0 rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-3xl font-bold">Invoice</CardTitle>
            <p className="text-blue-100 mt-1">#{invoice.invoiceNumber}</p>
          </div>
          <Badge 
            className={`px-4 py-2 text-sm font-medium rounded-full ${
              invoice.status === "paid" 
                ? "bg-emerald-100 text-emerald-800" 
                : isOverdue
                  ? "bg-rose-100 text-rose-800"
                  : "bg-amber-100 text-amber-800"
            }`}
          >
            {invoice.status === "paid" ? "PAID" : isOverdue ? "OVERDUE" : "PENDING"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-8 px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Bill To</h3>
            <p className="font-semibold text-xl">{invoice.customerName}</p>
            <p className="text-gray-600">{invoice.customerPhone}</p>
          </div>
          
          <div className="space-y-3 md:text-right">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Invoice Details</h3>
            <div className="flex justify-between md:justify-end items-center gap-2">
              <span className="text-gray-600 md:hidden">Issue Date:</span>
              <p className="font-medium">
                <span className="hidden md:inline text-gray-600 mr-2">Issue Date:</span>
                {today}
              </p>
            </div>
            <div className="flex justify-between md:justify-end items-center gap-2">
              <span className="text-gray-600 md:hidden">Due Date:</span>
              <p className="font-medium">
                <span className="hidden md:inline text-gray-600 mr-2">Due Date:</span>
                <span className={isOverdue ? "text-rose-600 font-semibold" : ""}>{formattedDueDate}</span>
              </p>
            </div>
          </div>
        </div>
        
        <Separator className="my-8" />
        
        <div className="mb-8 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-full md:w-1/2 py-3">Item</TableHead>
                <TableHead className="text-right py-3">Qty</TableHead>
                <TableHead className="text-right py-3">Price</TableHead>
                <TableHead className="text-right py-3">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceItems.map((item, index) => (
                <TableRow key={index} className="border-b border-gray-100">
                  <TableCell className="font-medium py-4">{item.name}</TableCell>
                  <TableCell className="text-right py-4">{item.quantity}</TableCell>
                  <TableCell className="text-right py-4">KES {item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-medium py-4">KES {item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:justify-between md:items-start">
          {payments.length > 0 && (
            <div className="md:w-1/2">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Payment History</h3>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                {payments.map((payment, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-600">{format(new Date(payment.date), "MMM d, yyyy")}</span>
                    <span className="font-medium text-emerald-600">KES {payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className={`${payments.length > 0 ? 'md:w-2/5' : 'md:w-full md:max-w-xs md:ml-auto'}`}>
            <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
              <div className="flex justify-between mb-3">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">KES {invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {payments.length > 0 && (
                <div className="flex justify-between mb-3">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="text-emerald-600 font-medium">-KES {totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <Separator className="my-3" />
              <div className="flex justify-between font-bold text-lg mt-2">
                <span>{invoice.status === "paid" ? "Total Paid:" : "Balance Due:"}</span>
                <span className={invoice.status === "paid" ? "text-emerald-600" : "text-rose-600"}>
                  KES {(invoice.status === "paid" ? invoice.amount : remainingBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            
            {invoice.status === "unpaid" && (
              <div className="mt-4 text-center md:text-right">
                <p className="text-sm text-gray-500">Please make payment by {formattedDueDate}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-12 pt-6 border-t border-gray-100 text-center text-gray-500 text-sm">
          <p>Thank you for your business!</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoicePrint;