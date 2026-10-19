/**
 * Format a date string to a readable format
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

/**
 * Get status badge class name
 */
export function getStatusBadgeClass(status) {
  switch (status) {
    case 'active': return 'badge-found';
    case 'matched': return 'badge-matched';
    case 'claimed': return 'badge-pending';
    case 'returned': return 'badge-returned';
    case 'closed': return 'badge-closed';
    case 'pending': return 'badge-pending';
    case 'approved': return 'badge-returned';
    case 'rejected': return 'badge-lost';
    case 'manual_review': return 'badge-pending';
    case 'requested': return 'badge-pending';
    case 'accepted': return 'badge-matched';
    case 'scheduled': return 'badge-matched';
    case 'deposited': return 'badge-found';
    case 'cancelled': return 'badge-closed';
    default: return 'badge-closed';
  }
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

/**
 * Truncate text
 */
export function truncate(str, maxLen = 100) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen) + '…';
}

/**
 * Validate file for upload (images only, max 5MB)
 */
export function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, WebP and GIF images are allowed.' };
  }
  if (file.size > maxSize) {
    return { valid: false, error: 'Image must be smaller than 5 MB.' };
  }
  return { valid: true, error: null };
}
