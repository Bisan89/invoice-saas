"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PriceComparisonRow } from "@/lib/types";

interface InvoiceRow {
  id: string;
  supplier_name_raw: string;
  invoice_number: string | null;
  invoice_date: string | null;
  total_amount: number;
  currency: string;
}

const statusStyles: Record<string, string> = {
  increased: "bg-red-100 text-red-700 border-red-300",
  decreased: "bg-green-100 text-green-700 border-green-300",
  same: "bg-gray-100 text-gray-600 border-gray-300",
  new: "bg-blue-100 text-blue-700 border-blue-300",
};

const statusLabels: Record<string, string> = {
  increased: "ارتفاع",
  decreased: "انخفاض",
  same: "بدون تغيير",
  new: "أول مرة",
};

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceRow | null>(null);
  const [comparisons, setComparisons] = useState<PriceComparisonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const [invoiceRes, comparisonRes] = await Promise.all([
        fetch(`/api/invoices/${params.id}`),
        fetch(`/api/invoices/${params.id}/price-comparison`),
      ]);

      const invoiceData = await invoiceRes.json();
      const comparisonData = await comparisonRes.json();

      if (!invoiceRes.ok) {
        setError(invoiceData.error || "تعذّر تحميل الفاتورة");
        setLoading(false);
        return;
      }

      setInvoice(invoiceData.invoice);
      setComparisons(comparisonData.comparisons || []);
      setLoading(false);
    }

    if (params.id) load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        جاري التحميل...
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error || "الفاتورة غير موجودة"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {invoice.supplier_name_raw}
            </h1>
            <p className="text-gray-500 mt-1">
              {invoice.invoice_number ? `رقم: ${invoice.invoice_number} — ` : ""}
              {invoice.invoice_date}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:underline font-semibold"
          >
            العودة للوحة التحكم
          </Link>
        </div>

        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200 text-gray-600 text-sm">
              <th className="py-2">المنتج</th>
              <th className="py-2">الكمية</th>
              <th className="py-2">السعر الحالي</th>
              <th className="py-2">السعر السابق</th>
              <th className="py-2">الفرق</th>
              <th className="py-2">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((row, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-3 font-medium text-gray-800">
                  {row.productName}
                </td>
                <td className="py-3 text-gray-600">{row.quantity}</td>
                <td className="py-3 text-gray-800">
                  {row.currentPrice.toFixed(2)} {invoice.currency}
                </td>
                <td className="py-3 text-gray-500">
                  {row.previousPrice !== null
                    ? `${row.previousPrice.toFixed(2)} ${invoice.currency}`
                    : "—"}
                </td>
                <td className="py-3 text-gray-700">
                  {row.difference !== null
                    ? `${row.difference > 0 ? "+" : ""}${row.difference.toFixed(2)} (${row.percentageChange}%)`
                    : "—"}
                </td>
                <td className="py-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles[row.status]}`}
                  >
                    {statusLabels[row.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 bg-gray-100 p-4 rounded-lg text-right">
          <p className="text-lg font-semibold text-gray-700">
            إجمالي الفاتورة:{" "}
            <span className="text-2xl text-blue-600">
              {invoice.total_amount.toFixed(2)} {invoice.currency}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}