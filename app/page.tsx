"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [invoiceId, setInvoiceId] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-12 max-w-2xl w-full">
        <h1 className="text-5xl font-bold text-center text-gray-800 mb-4">
          💼 Invoice SaaS
        </h1>
        <p className="text-center text-gray-600 mb-12 text-lg">
          نظام تتبع أسعار المنتجات من الموردين
        </p>

        <div className="space-y-4">
          <Link
            href="/invoices/create"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg text-center transition text-lg"
          >
            📄 إنشاء فاتورة جديدة
          </Link>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="أدخل رقم الفاتورة"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Link
              href={invoiceId ? `/invoices/${invoiceId}` : "#"}
              className={`px-6 py-3 rounded-lg font-bold transition ${
                invoiceId
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
            >
              🔍 عرض
            </Link>
          </div>

          <Link
            href="/dashboard"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-center transition text-lg"
          >
            📊 لوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  );
}
