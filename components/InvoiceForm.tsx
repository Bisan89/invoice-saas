"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface FormItem {
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

const emptyItem = (): FormItem => ({
  productName: "",
  quantity: 1,
  unit: "",
  unitPrice: 0,
});

export default function InvoiceForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);

  const [supplierName, setSupplierName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [items, setItems] = useState<FormItem[]>([emptyItem()]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    setExtractError(null);
    setSourceFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/invoices/extract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setExtractError(
          data.error || "تعذّر استخراج بيانات الفاتورة تلقائياً — يمكن إدخالها يدوياً بالأسفل"
        );
        return;
      }

      const extracted = data.data;
      setSupplierName(extracted.supplierName || "");
      setInvoiceNumber(extracted.invoiceNumber || "");
      setInvoiceDate(extracted.invoiceDate || "");

      if (Array.isArray(extracted.items) && extracted.items.length > 0) {
        setItems(
          extracted.items.map((item: any) => ({
            productName: item.productName || "",
            quantity: Number(item.quantity) || 1,
            unit: item.unit || "",
            unitPrice: Number(item.unitPrice) || 0,
          }))
        );
      }
    } catch (err) {
      console.error(err);
      setExtractError("حدث خطأ أثناء رفع الملف — يمكن إدخال البيانات يدوياً");
    } finally {
      setExtracting(false);
    }
  };

  const handleAddItem = () => setItems([...items, emptyItem()]);

  const handleRemoveItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));

  const handleItemChange = (
    index: number,
    field: keyof FormItem,
    value: string
  ) => {
    const newItems = [...items];
    if (field === "quantity" || field === "unitPrice") {
      newItems[index][field] = parseFloat(value) || 0;
    } else {
      newItems[index][field] = value;
    }
    setItems(newItems);
  };

  const calculateTotal = () =>
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierName,
          invoiceNumber: invoiceNumber || null,
          invoiceDate: invoiceDate || null,
          items,
          sourceFileName,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setSaveError(data.error || "فشل حفظ الفاتورة");
        return;
      }

      router.push(`/invoices/${data.invoiceId}`);
    } catch (err) {
      console.error(err);
      setSaveError("حدث خطأ أثناء حفظ الفاتورة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          📄 تسجيل فاتورة شراء
        </h1>
        <p className="text-gray-600 mb-8">
          رفع صورة أو PDF للفاتورة لتعبئة البيانات تلقائياً، أو تعبئة النموذج يدوياً مباشرة
        </p>

        {/* رفع الملف */}
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 mb-8 text-center bg-blue-50">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={handleFileSelected}
            className="hidden"
            id="invoice-file"
          />
          <label
            htmlFor="invoice-file"
            className="cursor-pointer inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            📎 رفع صورة أو PDF للفاتورة
          </label>
          {sourceFileName && (
            <p className="mt-3 text-gray-700 text-sm">
              الملف المرفوع: {sourceFileName}
            </p>
          )}
          {extracting && (
            <p className="mt-3 text-blue-700 font-semibold">
              ⏳ جاري قراءة الفاتورة واستخراج البيانات...
            </p>
          )}
          {extractError && (
            <p className="mt-3 text-amber-700 text-sm">{extractError}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* معلومات الفاتورة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="اسم المورد"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="رقم الفاتورة (اختياري)"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              placeholder="تاريخ الفاتورة"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* البنود */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">بنود الفاتورة</h2>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex flex-wrap gap-3 items-end">
                  <input
                    type="text"
                    placeholder="اسم المنتج"
                    value={item.productName}
                    onChange={(e) =>
                      handleItemChange(index, "productName", e.target.value)
                    }
                    className="flex-1 min-w-[160px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="number"
                    placeholder="الكمية"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    required
                  />
                  <input
                    type="text"
                    placeholder="الوحدة"
                    value={item.unit}
                    onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="سعر الوحدة"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleItemChange(index, "unitPrice", e.target.value)
                    }
                    className="w-28 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              المجموع: <span className="text-2xl text-blue-600">{calculateTotal()}</span>
            </p>
          </div>

          {saveError && (
            <p className="text-red-600 text-sm text-center">{saveError}</p>
          )}

          <button
            type="submit"
            disabled={saving || extracting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
          >
            {saving ? "جاري الحفظ..." : "✅ حفظ الفاتورة"}
          </button>
        </form>
      </div>
    </div>
  );
}