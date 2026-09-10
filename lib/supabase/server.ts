import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// عميل Supabase للاستخدام داخل server components و route handlers،
// بيقرأ/يكتب جلسة المصادقة من كوكيز الطلب.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // بيصير هالخطأ لما setAll تُستدعى من server component؛
            // مقبول لأن middleware.ts بيتكفّل بتحديث الكوكيز بهالحالة.
          }
        },
      },
    }
  );
}