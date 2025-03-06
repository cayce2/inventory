import type React from "react"

interface InvoiceItem {
  name: string
  quantity: number
  price: number
}

interface InvoiceProps {
  invoiceNumber: string
  customerName: string
  customerPhone: string
  items: InvoiceItem[]
  amount: number
  dueDate: string
  status: "paid" | "unpaid"
}

const Print: React.FC<InvoiceProps> = ({
  invoiceNumber,
  customerName,
  customerPhone,
  items,
  amount,
  dueDate,
  status,
}) => {
  return (
    <div className="p-8 bg-white">
      <div className="text-3xl font-bold mb-4">Invoice</div>
      <div className="flex justify-between mb-6">
        <div>
          <div className="font-bold">Invoice Number:</div>
          <div>{invoiceNumber}</div>
          <div className="font-bold mt-2">Date:</div>
          <div>{new Date().toLocaleDateString()}</div>
        </div>
        <div>
          <div className="font-bold">Customer:</div>
          <div>{customerName}</div>
          <div>{customerPhone}</div>
        </div>
      </div>
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-2">Item</th>
            <th className="text-right py-2">Quantity</th>
            <th className="text-right py-2">Price</th>
            <th className="text-right py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2">{item.name}</td>
              <td className="text-right py-2">{item.quantity}</td>
              <td className="text-right py-2">${item.price.toFixed(2)}</td>
              <td className="text-right py-2">${(item.quantity * item.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between mb-6">
        <div>
          <div className="font-bold">Due Date:</div>
          <div>{new Date(dueDate).toLocaleDateString()}</div>
        </div>
        <div>
          <div className="font-bold">Total Amount:</div>
          <div className="text-2xl">${amount.toFixed(2)}</div>
        </div>
      </div>
      <div className={`text-xl font-bold ${status === "paid" ? "text-green-600" : "text-red-600"}`}>
        {status.toUpperCase()}
      </div>
    </div>
  )
}

export default Print

