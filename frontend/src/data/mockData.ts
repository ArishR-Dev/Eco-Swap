import { 
  User, 
  Collector, 
  Recycler, 
  PickupRequest, 
  Notification, 
  TimeSlot,
  EWasteCategory,
  DashboardStats 
} from '@/types';

// Static reference data (kept for UI functionality)

// Mock Collectors - removed (now fetched from API)

// Mock Recyclers - removed (now fetched from API)

// Mock Pickup Requests - removed (now fetched from API)

// Mock Notifications - removed (now fetched from API)

// Time slots for scheduling
export const timeSlots: TimeSlot[] = [
  { id: 'slot-1', label: 'Morning', startTime: '09:00', endTime: '12:00' },
  { id: 'slot-2', label: 'Afternoon', startTime: '12:00', endTime: '15:00' },
  { id: 'slot-3', label: 'Late Afternoon', startTime: '15:00', endTime: '18:00' },
  { id: 'slot-4', label: 'Evening', startTime: '18:00', endTime: '20:00' }
];

// E-waste categories with icons and details
export const ewasteCategories: { category: EWasteCategory; label: string; icon: string; avgWeight: number }[] = [
  { category: 'COMPUTER', label: 'Desktop Computer', icon: 'Monitor', avgWeight: 10 },
  { category: 'LAPTOP', label: 'Laptop', icon: 'Laptop', avgWeight: 2.5 },
  { category: 'MOBILE', label: 'Mobile Phone', icon: 'Smartphone', avgWeight: 0.2 },
  { category: 'TABLET', label: 'Tablet', icon: 'Tablet', avgWeight: 0.5 },
  { category: 'TV', label: 'Television', icon: 'Tv', avgWeight: 20 },
  { category: 'MONITOR', label: 'Monitor', icon: 'MonitorSmartphone', avgWeight: 5 },
  { category: 'PRINTER', label: 'Printer', icon: 'Printer', avgWeight: 8 },
  { category: 'REFRIGERATOR', label: 'Refrigerator', icon: 'Refrigerator', avgWeight: 50 },
  { category: 'WASHING_MACHINE', label: 'Washing Machine', icon: 'WashingMachine', avgWeight: 40 },
  { category: 'AC', label: 'Air Conditioner', icon: 'AirVent', avgWeight: 35 },
  { category: 'MICROWAVE', label: 'Microwave', icon: 'Microwave', avgWeight: 12 },
  { category: 'BATTERY', label: 'Batteries', icon: 'Battery', avgWeight: 0.5 },
  { category: 'CABLE', label: 'Cables & Chargers', icon: 'Cable', avgWeight: 0.3 },
  { category: 'OTHER', label: 'Other Electronics', icon: 'Cpu', avgWeight: 5 }
];

// Mock dashboard stats - removed (now fetched from API)


