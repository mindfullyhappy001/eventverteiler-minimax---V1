import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Datum-/Zeit-Hilfsfunktionen
export function formatDate(date: string | Date): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export function formatTime(time: string): string {
  if (!time) return '';
  return time;
}

export function formatDateTime(datetime: string | Date): string {
  if (!datetime) return '';
  const d = new Date(datetime);
  return d.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Event-Type-Farben
export function getEventTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    'workshop': 'bg-blue-100 text-blue-800 border-blue-200',
    'vortrag': 'bg-green-100 text-green-800 border-green-200',
    'networking': 'bg-purple-100 text-purple-800 border-purple-200',
    'konferenz': 'bg-red-100 text-red-800 border-red-200',
    'webinar': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'default': 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return colorMap[type?.toLowerCase()] || colorMap['default'];
}

// Status-Farben
export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    'success': 'bg-green-100 text-green-800',
    'error': 'bg-red-100 text-red-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'info': 'bg-blue-100 text-blue-800',
    'default': 'bg-gray-100 text-gray-800'
  };
  return statusMap[status?.toLowerCase()] || statusMap['default'];
}

// Text kürzen
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength - 3) + '...';
}