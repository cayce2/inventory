import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Printer } from "lucide-react";

interface InvoiceItem {
  itemId: string;
  quantity: number;
  adjustedPrice?: number;
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
  currency: string;
}

const InvoicePrint: React.FC<PrintProps> = ({ invoice, inventory, payments, currency }) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Map items in invoice to their corresponding inventory details with adjusted price support
  const invoiceItems = invoice.items.map((item) => {
    const inventoryItem = inventory.find((i) => i._id === item.itemId);
    const basePrice = inventoryItem?.price || 0;
    const finalPrice = item.adjustedPrice !== undefined ? item.adjustedPrice : basePrice;
    const isPriceAdjusted = item.adjustedPrice !== undefined && item.adjustedPrice !== basePrice;
    
    return {
      name: inventoryItem?.name || "Unknown Item",
      quantity: item.quantity,
      originalPrice: basePrice,
      price: finalPrice,
      isPriceAdjusted,
      total: finalPrice * item.quantity,
    };
  });

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = invoice.amount - totalPaid;
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formattedDueDate = formatDate(invoice.dueDate);
  const today = formatDate(new Date());
  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status === "unpaid";

  const formatCurrency = (amount: number) => {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Print functionality with clean formatting
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            @media print {
              @page {
                margin: 0.5in;
                size: A4;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
              }
              .no-print {
                display: none !important;
              }
            }
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            .header {
              background: linear-gradient(135deg, #2563eb, #4f46e5);
              color: white;
              padding: 30px;
              border-radius: 8px 8px 0 0;
            }
            .header-content {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .invoice-title {
              font-size: 28px;
              font-weight: bold;
              margin: 0;
            }
            .invoice-number {
              opacity: 0.9;
              margin-top: 5px;
            }
            .status-badge {
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .status-paid { background: #dcfce7; color: #166534; }
            .status-overdue { background: #fee2e2; color: #991b1b; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .content {
              padding: 40px 30px;
            }
            .billing-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-bottom: 40px;
            }
            .section-title {
              font-size: 10px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 15px;
            }
            .customer-name {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 5px;
            }
            .customer-phone {
              color: #6b7280;
            }
            .invoice-details {
              text-align: right;
            }
            .detail-row {
              margin-bottom: 8px;
            }
            .detail-label {
              color: #6b7280;
              margin-right: 10px;
            }
            .overdue-text {
              color: #dc2626;
              font-weight: 600;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
            }
            th {
              background: #f9fafb;
              padding: 15px 12px;
              text-align: left;
              font-weight: 600;
              font-size: 11px;
              color: #374151;
              border-bottom: 1px solid #e5e7eb;
            }
            th:nth-child(2), th:nth-child(3), th:nth-child(4) {
              text-align: right;
            }
            td {
              padding: 15px 12px;
              border-bottom: 1px solid #f3f4f6;
            }
            td:nth-child(2), td:nth-child(3), td:nth-child(4) {
              text-align: right;
            }
            .item-name {
              font-weight: 500;
            }
            .adjusted-price {
              font-weight: 600;
              color: #2563eb;
            }
            .summary-section {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
            }
            .payment-history {
              flex: 1;
              margin-right: 40px;
            }
            .payment-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .payment-amount {
              color: #059669;
              font-weight: 500;
            }
            .totals {
              background: #f9fafb;
              padding: 25px;
              border-radius: 8px;
              min-width: 300px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
            }
            .total-row.final {
              margin-top: 15px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
              font-weight: bold;
              font-size: 16px;
            }
            .amount-paid {
              color: #059669;
            }
            .balance-due {
              color: #dc2626;
            }
            .total-paid {
              color: #059669;
            }
            .footer-note {
              text-align: center;
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 11px;
            }
            .separator {
              height: 1px;
              background: #e5e7eb;
              margin: 30px 0;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="header-content">
                <div>
                  <h1 class="invoice-title">Invoice</h1>
                  <p class="invoice-number">#${invoice.invoiceNumber}</p>
                </div>
                <div class="status-badge ${
                  invoice.status === "paid" 
                    ? "status-paid" 
                    : isOverdue
                      ? "status-overdue"
                      : "status-pending"
                }">
                  ${invoice.status === "paid" ? "PAID" : isOverdue ? "OVERDUE" : "PENDING"}
                </div>
              </div>
            </div>
            
            <div class="content">
              <div class="billing-details">
                <div class="bill-to">
                  <h3 class="section-title">Bill To</h3>
                  <p class="customer-name">${invoice.customerName}</p>
                  <p class="customer-phone">${invoice.customerPhone}</p>
                </div>
                
                <div class="invoice-details">
                  <h3 class="section-title">Invoice Details</h3>
                  <div class="detail-row">
                    <span class="detail-label">Issue Date:</span>
                    <span>${today}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Due Date:</span>
                    <span class="${isOverdue ? 'overdue-text' : ''}">${formattedDueDate}</span>
                  </div>
                </div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoiceItems.map(item => `
                    <tr>
                      <td class="item-name">${item.name}</td>
                      <td>${item.quantity}</td>
                      <td class="${item.isPriceAdjusted ? 'adjusted-price' : ''}">${formatCurrency(item.price)}</td>
                      <td>${formatCurrency(item.total)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="summary-section">
                ${payments.length > 0 ? `
                  <div class="payment-history">
                    <h3 class="section-title">Payment History</h3>
                    ${payments.map(payment => `
                      <div class="payment-item">
                        <span>${formatDate(payment.date)}</span>
                        <span class="payment-amount">${formatCurrency(payment.amount)}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                
                <div class="totals">
                  <div class="total-row">
                    <span>Subtotal:</span>
                    <span>${formatCurrency(invoice.amount)}</span>
                  </div>
                  ${payments.length > 0 ? `
                    <div class="total-row">
                      <span>Amount Paid:</span>
                      <span class="amount-paid">-${formatCurrency(totalPaid)}</span>
                    </div>
                  ` : ''}
                  <div class="total-row final">
                    <span>${invoice.status === "paid" ? "Total Paid:" : "Balance Due:"}</span>
                    <span class="${invoice.status === "paid" ? 'total-paid' : 'balance-due'}">
                      ${formatCurrency(invoice.status === "paid" ? invoice.amount : remainingBalance)}
                    </span>
                  </div>
                </div>
              </div>
              
              ${invoice.status === "unpaid" ? `
                <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 11px;">
                  <p>Please make payment by ${formattedDueDate}</p>
                </div>
              ` : ''}
            </div>
            
            <div class="footer-note">
              Thank you for your business!
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Download as PDF using browser's print to PDF
  const handleDownloadPDF = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            @media print {
              @page {
                margin: 0.5in;
                size: A4;
              }
            }
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            .header {
              background: linear-gradient(135deg, #2563eb, #4f46e5);
              color: white;
              padding: 30px;
              border-radius: 8px 8px 0 0;
            }
            .header-content {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .invoice-title {
              font-size: 28px;
              font-weight: bold;
              margin: 0;
            }
            .invoice-number {
              opacity: 0.9;
              margin-top: 5px;
            }
            .status-badge {
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .status-paid { background: #dcfce7; color: #166534; }
            .status-overdue { background: #fee2e2; color: #991b1b; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .content {
              padding: 40px 30px;
            }
            .billing-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-bottom: 40px;
            }
            .section-title {
              font-size: 10px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 15px;
            }
            .customer-name {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 5px;
            }
            .customer-phone {
              color: #6b7280;
            }
            .invoice-details {
              text-align: right;
            }
            .detail-row {
              margin-bottom: 8px;
            }
            .detail-label {
              color: #6b7280;
              margin-right: 10px;
            }
            .overdue-text {
              color: #dc2626;
              font-weight: 600;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
            }
            th {
              background: #f9fafb;
              padding: 15px 12px;
              text-align: left;
              font-weight: 600;
              font-size: 11px;
              color: #374151;
              border-bottom: 1px solid #e5e7eb;
            }
            th:nth-child(2), th:nth-child(3), th:nth-child(4) {
              text-align: right;
            }
            td {
              padding: 15px 12px;
              border-bottom: 1px solid #f3f4f6;
            }
            td:nth-child(2), td:nth-child(3), td:nth-child(4) {
              text-align: right;
            }
            .item-name {
              font-weight: 500;
            }
            .adjusted-price {
              font-weight: 600;
              color: #2563eb;
            }
            .summary-section {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
            }
            .payment-history {
              flex: 1;
              margin-right: 40px;
            }
            .payment-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .payment-amount {
              color: #059669;
              font-weight: 500;
            }
            .totals {
              background: #f9fafb;
              padding: 25px;
              border-radius: 8px;
              min-width: 300px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
            }
            .total-row.final {
              margin-top: 15px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
              font-weight: bold;
              font-size: 16px;
            }
            .amount-paid {
              color: #059669;
            }
            .balance-due {
              color: #dc2626;
            }
            .total-paid {
              color: #059669;
            }
            .footer-note {
              text-align: center;
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 11px;
            }
            .print-instructions {
              position: fixed;
              top: 20px;
              right: 20px;
              background: #1f2937;
              color: white;
              padding: 15px;
              border-radius: 8px;
              font-size: 14px;
              z-index: 1000;
              box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            }
            @media print {
              .print-instructions {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-instructions">
            <strong>To save as PDF:</strong><br>
            Press Ctrl+P (Cmd+P on Mac)<br>
            Select "Save as PDF" as destination<br>
            Click Save
          </div>
          
          <div class="invoice-container">
            <div class="header">
              <div class="header-content">
                <div>
                  <h1 class="invoice-title">Invoice</h1>
                  <p class="invoice-number">#${invoice.invoiceNumber}</p>
                </div>
                <div class="status-badge ${
                  invoice.status === "paid" 
                    ? "status-paid" 
                    : isOverdue
                      ? "status-overdue"
                      : "status-pending"
                }">
                  ${invoice.status === "paid" ? "PAID" : isOverdue ? "OVERDUE" : "PENDING"}
                </div>
              </div>
            </div>
            
            <div class="content">
              <div class="billing-details">
                <div class="bill-to">
                  <h3 class="section-title">Bill To</h3>
                  <p class="customer-name">${invoice.customerName}</p>
                  <p class="customer-phone">${invoice.customerPhone}</p>
                </div>
                
                <div class="invoice-details">
                  <h3 class="section-title">Invoice Details</h3>
                  <div class="detail-row">
                    <span class="detail-label">Issue Date:</span>
                    <span>${today}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Due Date:</span>
                    <span class="${isOverdue ? 'overdue-text' : ''}">${formattedDueDate}</span>
                  </div>
                </div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoiceItems.map(item => `
                    <tr>
                      <td class="item-name">${item.name}</td>
                      <td>${item.quantity}</td>
                      <td class="${item.isPriceAdjusted ? 'adjusted-price' : ''}">${formatCurrency(item.price)}</td>
                      <td>${formatCurrency(item.total)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="summary-section">
                ${payments.length > 0 ? `
                  <div class="payment-history">
                    <h3 class="section-title">Payment History</h3>
                    ${payments.map(payment => `
                      <div class="payment-item">
                        <span>${formatDate(payment.date)}</span>
                        <span class="payment-amount">${formatCurrency(payment.amount)}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                
                <div class="totals">
                  <div class="total-row">
                    <span>Subtotal:</span>
                    <span>${formatCurrency(invoice.amount)}</span>
                  </div>
                  ${payments.length > 0 ? `
                    <div class="total-row">
                      <span>Amount Paid:</span>
                      <span class="amount-paid">-${formatCurrency(totalPaid)}</span>
                    </div>
                  ` : ''}
                  <div class="total-row final">
                    <span>${invoice.status === "paid" ? "Total Paid:" : "Balance Due:"}</span>
                    <span class="${invoice.status === "paid" ? 'total-paid' : 'balance-due'}">
                      ${formatCurrency(invoice.status === "paid" ? invoice.amount : remainingBalance)}
                    </span>
                  </div>
                </div>
              </div>
              
              ${invoice.status === "unpaid" ? `
                <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 11px;">
                  <p>Please make payment by ${formattedDueDate}</p>
                </div>
              ` : ''}
            </div>
            
            <div class="footer-note">
              Thank you for your business!
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-3 justify-end no-print mb-6">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
        >
          <Printer size={16} />
          Print Invoice
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Download size={16} />
          Download PDF
        </button>
      </div>

      {/* Invoice Display */}
      <Card ref={printRef} className="max-w-3xl mx-auto shadow-lg border-0 rounded-xl overflow-hidden">
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
                  <TableHead className="text-right py-3">Unit Price</TableHead>
                  <TableHead className="text-right py-3">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceItems.map((item, index) => (
                  <TableRow key={index} className="border-b border-gray-100">
                    <TableCell className="font-medium py-4">
                      <div>
                        <div>{item.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">{item.quantity}</TableCell>
                    <TableCell className="text-right py-4">
                      <div>
                        <div className={item.isPriceAdjusted ? "font-medium text-blue-600" : ""}>
                          {formatCurrency(item.price)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium py-4">
                      {formatCurrency(item.total)}
                    </TableCell>
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
                      <span className="text-gray-600">{formatDate(payment.date)}</span>
                      <span className="font-medium text-emerald-600">{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className={`${payments.length > 0 ? 'md:w-2/5' : 'md:w-full md:max-w-xs md:ml-auto'}`}>
              <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
                <div className="flex justify-between mb-3">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.amount)}</span>
                </div>
                {payments.length > 0 && (
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="text-emerald-600 font-medium">-{formatCurrency(totalPaid)}</span>
                  </div>
                )}
                <Separator className="my-3" />
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>{invoice.status === "paid" ? "Total Paid:" : "Balance Due:"}</span>
                  <span className={invoice.status === "paid" ? "text-emerald-600" : "text-rose-600"}>
                    {formatCurrency(invoice.status === "paid" ? invoice.amount : remainingBalance)}
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
    </div>
  );
};

export default InvoicePrint;