
import { Application, Establishment, Inspection, InspectionStatus } from '@/types/inspection';

// Application Status Data for PieChart
export const applicationStatusData = [
  { name: 'Pending', value: 45, color: '#f59e0b' },
  { name: 'Scheduled', value: 32, color: '#3b82f6' },
  { name: 'Approved', value: 78, color: '#10b981' },
  { name: 'Rejected', value: 12, color: '#f43f5e' },
];

// Inspection Status Data for PieChart
export const inspectionStatusData = [
  { name: 'Scheduled', value: 38, color: '#3b82f6' },
  { name: 'Inspected', value: 24, color: '#8b5cf6' },
  { name: 'Approved', value: 62, color: '#10b981' },
  { name: 'Rejected', value: 18, color: '#f43f5e' },
];

// Weekly Data
export const weeklyData = [
  { name: 'Sun', scheduled: 2, completed: 0, date: '2023-08-06', isToday: false },
  { name: 'Mon', scheduled: 4, completed: 3, date: '2023-08-07', isToday: false },
  { name: 'Tue', scheduled: 3, completed: 2, date: '2023-08-08', isToday: false },
  { name: 'Wed', scheduled: 5, completed: 4, date: '2023-08-09', isToday: true },
  { name: 'Thu', scheduled: 6, completed: 0, date: '2023-08-10', isToday: false },
  { name: 'Fri', scheduled: 4, completed: 0, date: '2023-08-11', isToday: false },
  { name: 'Sat', scheduled: 1, completed: 0, date: '2023-08-12', isToday: false },
];

// Mock inspections data
export const mockInspections: Inspection[] = [
  {
    id: 'insp-001',
    establishment_id: 'est-001',
    establishment_name: 'ABC Restaurant',
    establishmentType: 'Restaurant',
    type: 'FSIC-Business',
    address: '123 Main Street, Anytown',
    status: InspectionStatus.Scheduled,
    scheduledDate: '2023-08-15',
    inspectorId: 'ins-001',
    inspector: 'John Doe',
    updated_at: '2023-08-01'
  },
  {
    id: 'insp-002',
    establishment_id: 'est-002',
    establishment_name: 'XYZ Shopping Mall',
    establishmentType: 'Commercial',
    type: 'FSIC-Occupancy',
    address: '456 Commerce Ave, Businessville',
    status: InspectionStatus.Approved,
    scheduledDate: '2023-08-10',
    inspectorId: 'ins-002',
    inspector: 'Jane Smith',
    updated_at: '2023-08-10'
  },
  {
    id: 'insp-003',
    establishment_id: 'est-003',
    establishment_name: 'City Center Hotel',
    establishmentType: 'Hotel',
    type: 'FSIC-Business',
    address: '789 Downtown Blvd, Metropolis',
    status: InspectionStatus.Rejected,
    scheduledDate: '2023-08-05',
    inspectorId: 'ins-001',
    inspector: 'John Doe',
    updated_at: '2023-08-05'
  },
  {
    id: 'insp-004',
    establishment_id: 'est-004',
    establishment_name: 'Riverside Apartments',
    establishmentType: 'Residential',
    type: 'FSIC-Occupancy',
    address: '321 River Road, Watertown',
    status: InspectionStatus.Inspected,
    scheduledDate: '2023-08-20',
    inspectorId: 'ins-002',
    inspector: 'Jane Smith',
    updated_at: '2023-08-02'
  }
];

// Mock establishments data
export const mockEstablishments: Establishment[] = [
  {
    id: 'est-001',
    name: 'ABC Restaurant',
    type: 'Restaurant',
    status: 'active',
    address: '123 Main Street, Anytown',
    owner_id: 'own-001',
    dti_number: 'DTI-12345',
    date_registered: '2023-01-15',
    latitude: 14.5995,
    longitude: 120.9842
  },
  {
    id: 'est-002',
    name: 'XYZ Shopping Mall',
    type: 'Commercial',
    status: 'active',
    address: '456 Commerce Ave, Businessville',
    owner_id: 'own-002',
    dti_number: 'DTI-23456',
    date_registered: '2023-02-20',
    latitude: 14.6042,
    longitude: 120.9822
  },
  {
    id: 'est-003',
    name: 'City Center Hotel',
    type: 'Hotel',
    status: 'active',
    address: '789 Downtown Blvd, Metropolis',
    owner_id: 'own-001',
    dti_number: 'DTI-34567',
    date_registered: '2023-03-10',
    latitude: 14.6011,
    longitude: 120.9761
  },
  {
    id: 'est-004',
    name: 'Riverside Apartments',
    type: 'Residential',
    status: 'active',
    address: '321 River Road, Watertown',
    owner_id: 'own-003',
    dti_number: 'DTI-45678',
    date_registered: '2023-04-05',
    latitude: 14.5958,
    longitude: 120.9895
  },
  {
    id: 'est-005',
    name: 'Green Valley School',
    type: 'Educational',
    status: 'active',
    address: '567 Learning Lane, Edutown',
    owner_id: 'own-002',
    dti_number: 'DTI-56789',
    date_registered: '2023-05-12',
    latitude: 14.6078,
    longitude: 120.9750
  },
  {
    id: 'est-006',
    name: 'Sunshine Hospital',
    type: 'Healthcare',
    status: 'active',
    address: '890 Health Street, Welltown',
    owner_id: 'own-004',
    dti_number: 'DTI-67890',
    date_registered: '2023-06-20',
    latitude: 14.6033,
    longitude: 120.9877
  },
  {
    id: 'est-007',
    name: 'Tech Hub Office Park',
    type: 'Office',
    status: 'active',
    address: '432 Innovation Way, Techville',
    owner_id: 'own-001',
    dti_number: 'DTI-78901',
    date_registered: '2023-07-08',
    latitude: 14.5975,
    longitude: 120.9802
  },
  {
    id: 'est-008',
    name: 'Grand Theater',
    type: 'Entertainment',
    status: 'active',
    address: '765 Broadway, Showtown',
    owner_id: 'own-003',
    dti_number: 'DTI-89012',
    date_registered: '2023-08-03',
    latitude: 14.6001,
    longitude: 120.9938
  }
];

// Mock applications data
export const mockApplications: Application[] = [
  {
    id: 'app-001',
    name: 'FSIC Business Permit',
    establishment_id: 'est-001',
    type: 'FSIC-Business',
    status: 'pending',
    dateSubmitted: '2023-08-01',
    owner_id: 'own-001',
    establishment_name: 'ABC Restaurant',
    submitted_at: '2023-08-01',
    notes: 'Initial application for business permit'
  },
  {
    id: 'app-002',
    name: 'FSEC Building Permit',
    establishment_id: 'est-002',
    type: 'FSEC',
    status: 'scheduled',
    dateSubmitted: '2023-07-25',
    owner_id: 'own-002',
    establishment_name: 'XYZ Shopping Mall',
    submitted_at: '2023-07-25',
    notes: 'New building permit application'
  },
  {
    id: 'app-003',
    name: 'FSIC Occupancy Permit',
    establishment_id: 'est-003',
    type: 'FSIC-Occupancy',
    status: 'approved',
    dateSubmitted: '2023-07-15',
    owner_id: 'own-001',
    establishment_name: 'City Center Hotel',
    submitted_at: '2023-07-15',
    notes: 'Occupancy permit for new hotel'
  },
  {
    id: 'app-004',
    name: 'FSEC Construction Permit',
    establishment_id: 'est-004',
    type: 'FSEC',
    status: 'rejected',
    dateSubmitted: '2023-07-10',
    owner_id: 'own-003',
    establishment_name: 'Riverside Apartments',
    submitted_at: '2023-07-10',
    notes: 'Construction plans need revisions'
  },
  {
    id: 'app-005',
    name: 'FSIC Business Permit',
    establishment_id: 'est-005',
    type: 'FSIC-Business',
    status: 'pending',
    dateSubmitted: '2023-08-05',
    owner_id: 'own-002',
    establishment_name: 'Green Valley School',
    submitted_at: '2023-08-05',
    notes: 'Annual renewal of business permit'
  },
  {
    id: 'app-006',
    name: 'FSIC Occupancy Permit',
    establishment_id: 'est-006',
    type: 'FSIC-Occupancy',
    status: 'scheduled',
    dateSubmitted: '2023-08-03',
    owner_id: 'own-004',
    establishment_name: 'Sunshine Hospital',
    submitted_at: '2023-08-03',
    notes: 'New wing occupancy inspection'
  },
  {
    id: 'app-007',
    name: 'FSIC Business Permit',
    establishment_id: 'est-007',
    type: 'FSIC-Business',
    status: 'approved',
    dateSubmitted: '2023-07-20',
    owner_id: 'own-001',
    establishment_name: 'Tech Hub Office Park',
    submitted_at: '2023-07-20',
    notes: 'Business permit approved with certificate',
    certificateUrl: '/certificates/cert-001.pdf'
  },
  {
    id: 'app-008',
    name: 'FSEC Construction Permit',
    establishment_id: 'est-008',
    type: 'FSEC',
    status: 'approved',
    dateSubmitted: '2023-07-05',
    owner_id: 'own-003',
    establishment_name: 'Grand Theater',
    submitted_at: '2023-07-05',
    notes: 'Construction approved with certificate',
    certificateUrl: '/certificates/cert-002.pdf'
  },
  {
    id: 'app-009',
    name: 'FSIC Business Renewal',
    establishment_id: 'est-001',
    type: 'FSIC-Business',
    status: 'cancelled',
    dateSubmitted: '2023-06-15',
    owner_id: 'own-001',
    establishment_name: 'ABC Restaurant',
    submitted_at: '2023-06-15',
    notes: 'Cancelled by applicant'
  },
  {
    id: 'app-010',
    name: 'FSEC Plan Review',
    establishment_id: 'est-002',
    type: 'FSEC',
    status: 'cancelled',
    dateSubmitted: '2023-06-10',
    owner_id: 'own-002',
    establishment_name: 'XYZ Shopping Mall',
    submitted_at: '2023-06-10',
    notes: 'Withdrawn for redesign'
  }
];
