"use client";

import { useState } from "react";

interface InvoiceItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export default function InvoiceForm() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([
    { productName: "", quantity: 1, unitPrice: 0 },
  ]);
  const [clientId, setClientId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [userId, setUserId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");

  const handleAddItem = () => {
    setItems([...items, { productName: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...items];
    if (field === "productName") {
      newItems[index].productName = value as string;
    } else if (field === "quantity") {
      newItems[index].quantity = parseFloat(value as string) || 0;
    } else if (field === "unitPrice") {
      newItems[index].unitPrice = parseFloat(value as string) || 0;
    }
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          supplierId,
          userId,
          items,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setInvoiceId(data.invoiceId);
        alert(`✅ تم إنشاء الفاتورة بنجاح! رقم الفاتورة: ${data.invoiceId}`);
        // إعادة تعيين النموذج
        setItems([{ productName: "", quantity: 1, unitPrice: 0 }]);
        setClientId("");
        setSupplierId("");
      } else {
        alert(`❌ خطأ: ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ حدث خطأ في إنشاء الفاتورة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">📄 إنشاء فاتورة جديدة</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* معلومات الفاتورة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Supplier ID"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* البنود */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">بنود الفاتورة</h2>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <input
                    type="text"
                    placeholder="اسم المنتج"
                    value={item.productName}
                    onChange={(e) =>
                      handleItemChange(index, "productName", e.target.value)
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="number"
                    placeholder="الكمية"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    required
                  />
                  <input
                    type="number"
                    placeholder="السعر"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleItemChange(index, "unitPrice", e.target.value)
                    }
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              + إضافة بند
            </button>
          </div>

          {/* الإجمالي */}
          <div className="bg-gray-100 p-4 rounded-lg text-right">
            <p className="text-lg font-semibold text-gray-700">
              المجموع: <span className="text-2xl text-blue-600">{calculateTotal()} ر.س</span>
            </p>
          </div>

          {/* الزر */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
          >
            {loading ? "جاري الإنشاء..." : "✅ إنشاء الفاتورة"}
          </button>
        </form>
        {invoiceId && (
          <div className="mt-6 p-4 bg-green-100 border border-green-400 rounded-lg text-green-800">
            <p className="text-lg font-semibold">
              ✅ تم إنشاء الفاتورة بنجاح!
            </p>
            <p className="text-base mt-2">
              رقم الفاتورة: <span className="font-bold text-green-900">{invoiceId}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
