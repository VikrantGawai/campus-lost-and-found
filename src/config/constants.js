export const ITEM_CATEGORIES = [
  'Electronics',
  'Books & Notes',
  'Clothing & Accessories',
  'ID Cards & Documents',
  'Keys',
  'Bags & Backpacks',
  'Water Bottles',
  'Headphones & Earbuds',
  'Wallets & Purses',
  'Sports Equipment',
  'Stationery',
  'Jewelry',
  'Glasses & Sunglasses',
  'USB Drives & Storage',
  'Other',
];

export const CAMPUS_LOCATIONS = [
  'Main Library',
  'Science Building',
  'Engineering Block',
  'Arts & Humanities Hall',
  'Student Center',
  'Cafeteria',
  'Sports Complex',
  'Computer Lab',
  'Lecture Hall A',
  'Lecture Hall B',
  'Lecture Hall C',
  'Administration Building',
  'Parking Lot A',
  'Parking Lot B',
  'Campus Bus Stop',
  'Dormitory Block 1',
  'Dormitory Block 2',
  'Dormitory Block 3',
  'Outdoor Amphitheater',
  'Research Center',
  'Health Center',
  'Other',
];

export const ITEM_STATUSES = {
  ACTIVE: 'active',
  MATCHED: 'matched',
  CLAIMED: 'claimed',
  RETURNED: 'returned',
  CLOSED: 'closed',
};

export const CLAIM_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  MANUAL_REVIEW: 'manual_review',
};

export const HANDOVER_STATUSES = {
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  SCHEDULED: 'scheduled',
  DEPOSITED: 'deposited',
  RETURNED: 'returned',
  CANCELLED: 'cancelled',
};

export const HANDOVER_METHODS = {
  COLLECTION_POINT: 'collection_point',
  VOLUNTEER: 'volunteer',
  SCHEDULED_MEETUP: 'scheduled_meetup',
  KEEP_TEMPORARILY: 'keep_temporarily',
};

export const CONTACT_METHODS = [
  'In-App Notification',
  'Email',
  'Phone (private)',
];

export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  VOLUNTEER: 'volunteer',
};

// Sensitive item categories that need extra privacy
export const SENSITIVE_CATEGORIES = [
  'ID Cards & Documents',
  'Wallets & Purses',
  'USB Drives & Storage',
  'Electronics',
];
