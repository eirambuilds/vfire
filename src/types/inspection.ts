
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type InspectorDutyStatus = 'on_duty' | 'off_duty';
export type UserRole = 'owner' | 'inspector' | 'admin';
export type EstablishmentStatus = 'unregistered' | 'pre_registered' | 'registered';
export type ApplicationStatus = 'pending' | 'scheduled' | 'inspected' | 'approved' | 'rejected' | 'cancelled';
export type ApplicationType = 'FSEC' | 'FSIC-Occupancy' | 'FSIC-Business';

export type EventStatus = 'pending' | 'scheduled' | 'inspected' | 'approved' | 'rejected';
export enum InspectionStatus {
  Pending = "pending",
  Scheduled = 'scheduled',
  Inspected = 'inspected',
  Approved = 'approved',
  Rejected = 'rejected',
  Cancelled = 'cancelled',
}
interface CancelConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
  confirmButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}
export interface Profile {
  duty_status: string;
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'inspector' | 'owner';
  status: string;
  created_at: string;
  updated_at: string;
  phone_number: string;
  availability_start_date?: string;
  availability_end_date?: string;
}
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: UserRole;
  status: string;
  created_at: string;
  dutyStatus?: InspectorDutyStatus;
  availabilityStartDate?: string | number | Date;
  availabilityEndDate?: string | number | Date;
  phoneNumber?: string;
}

export interface Inspection {
  id: string;
  establishment_id: string;
  establishment_name: string; // Added to match database field
  inspectorId?: string;
  inspector?: string;
  type: string;
  status: string;
  scheduledDate?: string;
  updated_at: string;
  address: any;
  rejection_reasons?: string[];
  rejection_notes?: string;
  establishmentType: string; // Added property
  dti_number?: string;
  created_at?: string;
  certificate_url?: string | null; // Added to match database field
}

// src/types/inspection.ts

export interface Establishment {
  id: string;
  name: string;
  dti_number: string;
  date_registered?: string;
  owner_id: string;
  status?: 'unregistered' | 'pre_registered' | 'registered';
  type?: string;
  address?: string;
  street: string;
  barangay?: string;
  city?: string;
  province?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  occupancy?: string;
  storeys?: string;
  floor_area?: string;
  occupants?: string;
  owner_first_name?: string;
  owner_last_name?: string;
  owner_middle_name?: string;
  owner_suffix?: string;
  owner_email?: string;
  owner_mobile?: string;
  owner_landline?: string;
  rep_first_name?: string;
  rep_last_name?: string;
  rep_middle_name?: string;
  rep_suffix?: string;
  rep_email?: string;
  rep_mobile?: string;
  rep_landline?: string;

  created_at?: string;
  rejection_history?: Array<{
    reasons: string[];
    notes: string;
    timestamp: string;
  }>;
  registration_form_data?: {
    barangay: string;
  };
  registration_pdf_path?: string; // Path to the PDF in storage
}

export interface Application {
  notes: string;
  id: string;
  name: string;
  type: ApplicationType;
  establishment_name: string;
  status: string;
  dateSubmitted: string;
  establishment_id: string;
  owner_id: string;
  submitted_at: string;
  date_updated?: string;
  dti_number?: string;
  certificateUrl?: string | null;
  certificate_url?: string | null; // Added to match database field
}

export interface Event {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  allDay: boolean;
  type: 'inspection' | 'deadline' | 'meeting';
  relatedId?: string;
  status?: EventStatus;
  establishment_id?: string;
  inspectionType?: ApplicationType;
}

export interface CalendarNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'reminder' | 'update' | 'deadline' | 'inspection';
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  relatedEventId?: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationPriority = 'low' | 'medium' | 'high';

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'warning' | 'error' | 'info';
  time: string;
  read: boolean;
  priority?: 'high' | 'medium' | 'low';
  userRole: string;
}

export interface EstablishmentCardProps {
  establishment: {
    id: string;
    name: string;
    address?: string;
    status: string;
    type: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    lastInspection?: string;
  };
}

export interface EstablishmentsMapProps {
  establishments: {
    id: string;
    name: string;
    owner_id: string;
    latitude: number;
    longitude: number;
    status: string;
    address?: string;
  }[];
}

export interface ChecklistData {
  id?: string;
  inspection_id: string;
  establishment_name: string;
  establishment_id: string;
  inspector_id?: string;
  fire_extinguisher: boolean;
  safety_equipment: boolean;
  emergency_lights: boolean;
  evacuation_plan: boolean;
  sprinkler_system: boolean;
  smoke_detectors: boolean;
  fire_alarm: boolean;
  emergency_exits: boolean;
  inspector_name: string;
  images: string[];
  created_at?: string;
}

export interface ProfileFields {
  id?: string;
  email?: string;
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  role?: UserRole;
  status?: string;
  created_at?: string;
  updated_at?: string;
  phone_number?: string | null; // Changed to optional with ?
}
