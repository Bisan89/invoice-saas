/**
 * توحيد صيغة النصوص (اسم مورد / اسم منتج) قبل المقارنة أو التخزين كمفتاح مطابقة،
 * بحيث "شركة النور" و"شركة   النور " و"Shrkt Alnwr" (بمسافات مختلفة) تتطابق.
 */
export function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
