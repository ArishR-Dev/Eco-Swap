// User roles
export type UserRole = 'USER' | 'COLLECTOR' | 'RECYCLER' | 'ADMIN';

// Approval status for collectors and recyclers
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Pickup request status
export type PickupStatus = 
  | 'REQUESTED' 
  | 'ASSIGNED' 
  | 'EN_ROUTE' 
  | 'COLLECTED' 
  | 'HANDED_TO_RECYCLER' 
  | 'PROCESSING' 
  | 'RECYCLED' 
  | 'CANCELLED';

// E-waste item types
export type EWasteCategory = 
  | 'COMPUTER' 
  | 'LAPTOP' 
  | 'MOBILE' 
  | 'TABLET' 
  | 'TV' 
  | 'MONITOR' 
  | 'PRINTER' 
  | 'REFRIGERATOR' 
  | 'WASHING_MACHINE' 
  | 'AC' 
  | 'MICROWAVE' 
  | 'BATTERY' 
  | 'CABLE' 
  | 'OTHER';

// Base user interface
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  role: UserRole;
  approvalStatus?: ApprovalStatus;
  createdAt: string;
  avatar?: string;
}

// Extended interfaces for specific roles
export interface Collector extends User {
  role: 'COLLECTOR';
  vehicleType: string;
  licenseNumber: string;
  approvalStatus: ApprovalStatus;
  isAvailable: boolean;
  totalPickups: number;
  rating: number;
}

export interface Recycler extends User {
  role: 'RECYCLER';
  facilityName: string;
  certification: string;
  approvalStatus: ApprovalStatus;
  totalProcessed: number;
}

// E-waste item in a pickup request
export interface EWasteItem {
  id: string;
  category: EWasteCategory;
  quantity: number;
  estimatedWeight: number; // in kg
  description?: string;
  photos?: string[];
}

// Pickup request
export interface PickupRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  items: EWasteItem[];
  totalWeight: number;
  status: PickupStatus;
  address: string;
  scheduledDate: string;
  scheduledTimeSlot: string;
  latitude?: number | null;
  longitude?: number | null;
  collectorId?: string;
  collectorName?: string;
  recyclerId?: string;
  recyclerName?: string;
  notes?: string;
  priority: 'NORMAL' | 'URGENT';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  feedback?: Feedback;
}

// Feedback for completed pickups
export interface Feedback {
  id: string;
  pickupId: string;
  userId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}

// Recycling log entry
export interface RecyclingLog {
  id: string;
  pickupId: string;
  recyclerId: string;
  items: EWasteItem[];
  materialsRecovered: MaterialBreakdown[];
  co2Saved: number; // in kg
  status: 'RECEIVED' | 'PROCESSING' | 'RECYCLED' | 'DISPOSED';
  certificateId?: string;
  processedAt: string;
}

// Material breakdown for recycling reports
export interface MaterialBreakdown {
  type: 'PLASTIC' | 'METAL' | 'GLASS' | 'CIRCUIT_BOARD' | 'BATTERY' | 'OTHER';
  weight: number; // in kg
}

// Recycling certificate
export interface RecyclingCertificate {
  id: string;
  pickupId: string;
  userId: string;
  recyclerId: string;
  recyclerName: string;
  items: EWasteItem[];
  totalWeight: number;
  co2Saved: number;
  issuedAt: string;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

// Dashboard statistics
export interface DashboardStats {
  totalUsers: number;
  activeCollectors: number;
  pendingRequests: number;
  totalRecycled: number; // in kg
  co2Saved: number; // in kg
  pendingApprovals: number;
}

// Time slot for scheduling
export interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
}

// Report data
export interface ReportData {
  period: string;
  totalPickups: number;
  totalWeight: number;
  co2Saved: number;
  byCategory: { category: EWasteCategory; count: number; weight: number }[];
  byStatus: { status: PickupStatus; count: number }[];
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  role?: UserRole | 'ADMIN';
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  role: UserRole;
  // Collector-specific
  vehicleType?: string;
  licenseNumber?: string;
  // Recycler-specific
  facilityName?: string;
  certification?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
