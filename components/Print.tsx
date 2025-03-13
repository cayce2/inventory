import type React from "react"

interface InvoiceItem {
  itemId: string
  quantity: number
}

interface InventoryItem {
  _id: string
  name: string
  price: number
}

interface Invoice {
  invoiceNumber: string
  customerName: string
  customerPhone: string
  items: InvoiceItem[]
  amount: number
  dueDate: string
  status: "paid" | "unpaid"
}

interface PrintProps {
  invoice: Invoice
  inventory: InventoryItem[]
  items: { name: string; price: number; quantity: number }[];

}

const Print: React.FC<PrintProps> = ({ invoice, inventory }) => {
  // Map items in invoice to their corresponding inventory details
  const invoiceItems = invoice.items.map((item) => {
    const inventoryItem = inventory.find((i) => i._id === item.itemId)
    return {
      name: inventoryItem?.name || "Unknown Item",
      quantity: item.quantity,
      price: inventoryItem?.price || 0,
      total: (inventoryItem?.price || 0) * item.quantity,
    }
  })

  return (
    <div className="p-8 bg-white">
      <div className="text-3xl font-bold mb-4">Invoice</div>
      <div className="flex justify-between mb-6">
        <div>
          <div className="font-bold">Invoice Number:</div>
          <div>{invoice.invoiceNumber}</div>
          <div className="font-bold mt-2">Date:</div>
          <div>{new Date().toLocaleDateString()}</div>
        </div>
        <div>
          <div className="font-bold">Customer:</div>
          <div>{invoice.customerName}</div>
          <div>{invoice.customerPhone}</div>
        </div>
      </div>
      <table className="w-full mb-6 border-collapse border border-gray-300">
        <thead>
          <tr className="border-b-2 border-gray-300 bg-gray-100">
            <th className="text-left py-2 px-4 border border-gray-300">Item</th>
            <th className="text-right py-2 px-4 border border-gray-300">Quantity</th>
            <th className="text-right py-2 px-4 border border-gray-300">Price</th>
            <th className="text-right py-2 px-4 border border-gray-300">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoiceItems.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2 px-4 border border-gray-300">{item.name}</td>
              <td className="text-right py-2 px-4 border border-gray-300">{item.quantity}</td>
              <td className="text-right py-2 px-4 border border-gray-300">${item.price.toFixed(2)}</td>
              <td className="text-right py-2 px-4 border border-gray-300">${item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between mb-6">
        <div>
          <div className="font-bold">Due Date:</div>
          <div>{new Date(invoice.dueDate).toLocaleDateString()}</div>
        </div>
        <div>
          <div className="font-bold">Total Amount:</div>
          <div className="text-2xl">${invoice.amount.toFixed(2)}</div>
        </div>
      </div>
      <div className={`text-xl font-bold ${invoice.status === "paid" ? "text-green-600" : "text-red-600"}`}>
        {invoice.status.toUpperCase()}
      </div>
    </div>
  )
}

export default Print
