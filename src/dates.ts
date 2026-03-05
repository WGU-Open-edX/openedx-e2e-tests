export function formatDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

// Helper to shift a date by N days
export function shiftDate(base: Date, days: number): Date {
  const newDate = new Date(base);
  newDate.setDate(base.getDate() + days);
  return newDate;
}
