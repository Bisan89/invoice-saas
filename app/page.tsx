"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-12 max-w-2xl w-full text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">💼 Invoice SaaS</h1>
        <p className="text-gray-600 mb-12 text-lg">
          تسجيل فواتير الشراء ومتابعة فروقات الأسعار من كل مورد تلقائياً
        </p>

        <div className="space-y-4">
          <Link
            href="/signup"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg text-center transition text-lg"
          >
            إنشاء حساب جديد
          </Link>
          <Link
            href="/login"
            className="block w-full bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-4 px-6 rounded-lg text-center transition text-lg"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}