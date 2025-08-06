export function formatDateUTC8(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  const date = new Date(dateString);
  // 加8小时，转换为UTC+8
  date.setHours(date.getHours() + 8);
  return date.toLocaleString(undefined, options);
}
