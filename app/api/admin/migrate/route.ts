import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { migrations } from "@/lib/migrations";

/**
 * نقطة تشغيل الـmigrations. لأن المشروع بيُدار بدون Node/npm محلياً،
 * هاي النقطة بتنفّذ من المتصفح مباشرة بعد النشر على Vercel (أو بـcurl)
 * بدل تشغيل سكربت محلي. محمية بمفتاح سري (MIGRATE_SECRET) بس.
 *
 * الاستخدام: فتح
 *   https://<your-app>.vercel.app/api/admin/migrate?secret=MIGRATE_SECRET
 * بالمتصفح مرة وحدة بعد كل نشر فيه migration جديد.
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!process.env.MIGRATE_SECRET || secret !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    const appliedResult = await db.execute("SELECT id FROM _migrations");
    const appliedIds = new Set(
      (appliedResult.rows || []).map((row: any) => Number(row.id))
    );

    const applied: string[] = [];

    for (const migration of [...migrations].sort((a, b) => a.id - b.id)) {
      if (appliedIds.has(migration.id)) continue;

      await db.execute(migration.sql);
      await db.execute("INSERT INTO _migrations (id, name) VALUES (?, ?)", [
        migration.id,
        migration.name,
      ]);
      applied.push(`${migration.id}_${migration.name}`);
    }

    return NextResponse.json({
      success: true,
      applied,
      message:
        applied.length > 0
          ? "تم تطبيق migrations جديدة"
          : "كل الـmigrations مطبّقة مسبقاً، ما في جديد",
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Migration failed", details: String(error) },
      { status: 500 }
    );
  }
}