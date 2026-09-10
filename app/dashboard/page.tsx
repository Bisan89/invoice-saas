"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface InvoiceRow {
  id: string;
  supplier_name_raw: string;
  invoice_number: string | null;
  invoice_date: string | null;
  total_amount: number;
  currency: string;
}

interface Alert {
  invoiceId: string;
  supplierName: string;
  productName: string;
  percentageChange: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/invoices/list");
      const data = await res.json();
      const list: InvoiceRow[] = data.invoices || [];
      setInvoices(list);

      // فحص آخر 10 فواتير بس لأي ارتفاع بالأسعار، تجنّباً لحمل ثقيل على الصفحة
      const recent = list.slice(0, 10);
      const comparisonResults = await Promise.all(
        recent.map(async (inv) => {
          const r = await fetch(`/api/invoices/${inv.id}/price-comparison`);
          const d = await r.json();
          return { invoice: inv, comparisons: d.comparisons || [] };
        })
      );

      const foundAlerts: Alert[] = [];
      comparisonResults.forEach(({ invoice, comparisons }) => {
        comparisons.forEach((c: any) => {
          if (c.status === "increased") {
            foundAlerts.push({
              invoiceId: invoice.id,
              supplierName: invoice.supplier_name_raw,
              productName: c.productName,
              percentageChange: c.percentageChange,
            });
          }
        });
      });

      setAlerts(foundAlerts);
      setLoading(false);
    }

    load();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">📊 لوحة التحكم</h1>
          <div className="flex gap-3">
            <Link
              href="/invoices/create"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition"
            >
              + فاتورة جديدة
            </Link>
            <button
              onClick={handleLogout}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-5 rounded-lg transition"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-8">
            <h2 className="font-bold text-red-800 mb-3">
              ⚠️ ارتفاع أسعار ملحوظ (آخر الفواتير)
            </h2>
            <ul className="space-y-1 text-sm text-red-700">
              {alerts.map((a, i) => (
                <li key={i}>
                  <Link href={`/invoices/${a.invoiceId}`} className="hover:underline">
                    {a.productName} من {a.supplierName} — ارتفع {a.percentageChange}%
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">الفواتير</h2>

          {loading ? (
            <p className="text-gray-500">جاري التحميل...</p>
          ) : invoices.length === 0 ? (
            <p className="text-gray-500">لا توجد فواتير بعد.</p>
          ) : (
            <table className="w-full text-right">
              <thead>
                <tr className="border-b-2 border-gray-200 text-gray-600 text-sm">
                  <th className="py-2">المورد</th>
                  <th className="py-2">التاريخ</th>
                  <th className="py-2">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/invoices/${inv.id}`)}
                  >
                    <td className="py-3 font-medium text-gray-800">
                      {inv.supplier_name_raw}
                    </td>
                    <td className="py-3 text-gray-600">{inv.invoice_date}</td>
                    <td className="py-3 text-blue-600 font-semibold">
                      {inv.total_amount.toFixed(2)} {inv.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}