"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface PriceComparison {
  invoiceItemId: string;
  productName: string;
  previousPrice: string;
  currentPrice: string;
  priceDifference: string;
  percentageChange: string;
  status: "increased" | "decreased" | "same";
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const [comparisons, setComparisons] = useState<PriceComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}/price-comparison`);
        const data = await response.json();

        if (data.success) {
          setComparisons(data.comparisons);
        } else {
          setError(data.error || "Failed to load price comparison");
        }
      } catch (err) {
        console.error("Error:", err);
        setError("حدث خطأ في جلب البيانات");
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchComparison();
    }
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* رأس الصفحة */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📊 مقارنة الأسعار</h1>
          <p className="text-gray-600">رقم الفاتورة: <span className="font-mono text-blue-600">{invoiceId}</span></p>
        </div>

        {/* جدول المقارنة */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-indigo-600 text-white">
              <tr>
                <th className="px-6 py-4 text-right">اسم المنتج</th>
                <th className="px-6 py-4 text-center">السعر السابق</th>
                <th className="px-6 py-4 text-center">السعر الحالي</th>
                <th className="px-6 py-4 text-center">الفرق</th>
                <th className="px-6 py-4 text-center">النسبة</th>
                <th className="px-6 py-4 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((item, index) => (
                <tr
                  key={item.invoiceItemId}
                  className={`border-b ${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } hover:bg-blue-50 transition`}
                >
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {item.productName}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600">
                    {item.previousPrice} ر.س
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-gray-800">
                    {item.currentPrice} ر.س
                  </td>
                  <td
                    className={`px-6 py-4 text-center font-bold ${
                      item.status === "increased"
                        ? "text-red-600"
                        : item.status === "decreased"
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {item.status === "increased" ? "+" : ""}
                    {item.priceDifference} ر.س
                  </td>
                  <td
                    className={`px-6 py-4 text-center font-bold ${
                      item.status === "increased"
                        ? "text-red-600"
                        : item.status === "decreased"
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {item.percentageChange}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        item.status === "increased"
                          ? "bg-red-100 text-red-700"
                          : item.status === "decreased"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.status === "increased"
                        ? "📈 ارتفاع"
                        : item.status === "decreased"
                        ? "📉 انخفاض"
                        : "➡️ بدون تغيير"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {comparisons.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              لا توجد بيانات للمقارنة
            </div>
          )}
        </div>

        {/* ملخص الإحصائيات */}
        {comparisons.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-red-100 border-l-4 border-red-600 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">ارتفاع الأسعار</h3>
              <p className="text-2xl font-bold text-red-600">
                {comparisons.filter((c) => c.status === "increased").length}
              </p>
            </div>

            <div className="bg-green-100 border-l-4 border-green-600 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">انخفاض الأسعار</h3>
              <p className="text-2xl font-bold text-green-600">
                {comparisons.filter((c) => c.status === "decreased").length}
              </p>
            </div>

            <div className="bg-gray-100 border-l-4 border-gray-600 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">بدون تغيير</h3>
              <p className="text-2xl font-bold text-gray-600">
                {comparisons.filter((c) => c.status === "same").length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
