export function formatLocalDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  try {
    let dateStr = String(dateInput);
    // Normalize SQL date strings "YYYY-MM-DD HH:MM:SS" to ISO "YYYY-MM-DDTHH:MM:SS"
    if (dateStr.includes(' ') && !dateStr.includes('T')) {
      dateStr = dateStr.replace(' ', 'T');
    }
    // If string lacks timezone indicator, assume UTC
    if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
      dateStr += 'Z';
    }
    let d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      d = new Date(dateInput);
    }
    if (isNaN(d.getTime())) return String(dateInput);
    
    return d.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (e) {
    return String(dateInput);
  }
}

export function getCurrentLocalDateTime(): string {
  try {
    const now = new Date();
    return now.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (e) {
    return new Date().toISOString();
  }
}

export function getAuthoritativeLocalDateTime(dateInput?: Date | string | null): string {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(d);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
    return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
  } catch (e) {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  }
}
