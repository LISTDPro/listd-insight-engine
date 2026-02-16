// Custom types for the database entities

export type PropertyType = 'studio' | '1_bed' | '2_bed' | '3_bed' | '4_bed' | '5_bed' | '6_bed' | '7_bed' | '8_bed' | '9_bed';

export type FurnishedStatus = 'furnished' | 'unfurnished' | 'part_furnished';

export type InspectionType = 'new_inventory' | 'check_in' | 'check_out' | 'mid_term' | 'interim';

export type JobStatus = 'draft' | 'pending' | 'published' | 'accepted' | 'assigned' | 'in_progress' | 'submitted' | 'reviewed' | 'signed' | 'completed' | 'paid' | 'cancelled';

export interface Property {
  id: string;
  client_id: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  postcode: string;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  living_rooms: number;
  dining_areas: number;
  utility_rooms: number;
  storage_rooms: number;
  hallways_stairs: number;
  gardens: number;
  communal_areas: number;
  furnished_status: FurnishedStatus;
  heavily_furnished: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  property_id: string;
  client_id: string;
  provider_id: string | null;
  clerk_id: string | null;
  inspection_type: InspectionType;
  scheduled_date: string;
  preferred_time_slot: string | null;
  status: JobStatus;
  special_instructions: string | null;
  quoted_price: number | null;
  final_price: number | null;
  created_at: string;
  updated_at: string;
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  'studio': 'Studio',
  '1_bed': '1 Bedroom',
  '2_bed': '2 Bedrooms',
  '3_bed': '3 Bedrooms',
  '4_bed': '4 Bedrooms',
  '5_bed': '5 Bedrooms',
  '6_bed': '6 Bedrooms',
  '7_bed': '7 Bedrooms',
  '8_bed': '8 Bedrooms',
  '9_bed': '9 Bedrooms',
};

export const FURNISHED_STATUS_LABELS: Record<FurnishedStatus, string> = {
  'furnished': 'Furnished',
  'unfurnished': 'Unfurnished',
  'part_furnished': 'Part Furnished',
};

export const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  'new_inventory': 'New Inventory',
  'check_in': 'Check-In',
  'check_out': 'Check-Out',
  'mid_term': 'Mid-Term Inspection',
  'interim': 'Interim Inspection',
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  'draft': 'Draft',
  'pending': 'Pending',
  'published': 'Published',
  'accepted': 'Accepted',
  'assigned': 'Assigned',
  'in_progress': 'In Progress',
  'submitted': 'Submitted',
  'reviewed': 'Reviewed',
  'signed': 'Signed',
  'completed': 'Completed',
  'paid': 'Paid',
  'cancelled': 'Cancelled',
};

// Inspection Types
export type ConditionRating = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' | 'missing' | 'na';

export type RoomType = 
  | 'entrance' | 'hallway' | 'living_room' | 'dining_room' | 'kitchen'
  | 'bedroom' | 'bathroom' | 'toilet' | 'utility' | 'storage'
  | 'garden' | 'garage' | 'balcony' | 'other';

export interface InspectionReport {
  id: string;
  job_id: string;
  clerk_id: string;
  started_at: string | null;
  completed_at: string | null;
  submitted_at: string | null;
  general_notes: string | null;
  meter_readings: Record<string, string>;
  keys_info: Record<string, string>;
  smoke_alarms_checked: boolean;
  carbon_monoxide_checked: boolean;
  clerk_signature_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface InspectionRoom {
  id: string;
  report_id: string;
  room_type: RoomType;
  room_name: string;
  room_order: number;
  overall_condition: ConditionRating | null;
  notes: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface InspectionItem {
  id: string;
  room_id: string;
  item_name: string;
  item_category: string | null;
  item_order: number;
  description: string | null;
  condition: ConditionRating | null;
  condition_notes: string | null;
  cleanliness: ConditionRating | null;
  cleanliness_notes: string | null;
  quantity: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface InspectionPhoto {
  id: string;
  report_id: string;
  room_id: string | null;
  item_id: string | null;
  photo_url: string;
  caption: string | null;
  taken_at: string;
  is_mandatory: boolean;
  created_at: string;
}

export const CONDITION_LABELS: Record<ConditionRating, string> = {
  'excellent': 'Excellent / Very Good',
  'good': 'Good',
  'fair': 'Fair',
  'poor': 'Poor',
  'damaged': 'Very Poor',
  'missing': 'Missing',
  'na': 'N/A',
};

/** Full glossary descriptions for condition ratings per LISTD standards */
export const CONDITION_GLOSSARY: Record<ConditionRating, string> = {
  'excellent': 'No marks, tears, stains, generally under one-year old.',
  'good': 'Signs of slight wear, generally lightly worn.',
  'fair': 'Signs of age, frayed, small light stains, marks and discolouration.',
  'poor': 'Extensive signs of wear and tear, extensive stains/marks/tears/chips, still functional.',
  'damaged': 'Extensively damaged/faulty items, large stains, upholstery torn and/or dirty, pet odour/hairs.',
  'missing': 'Item is missing from the property.',
  'na': 'Not applicable.',
};

export type CleanlinessRating = 'professional' | 'domestic' | 'further_cleaning' | 'poor_standard' | 'dusty' | 'lightly_soiled' | 'soiled' | 'na';

export const CLEANLINESS_LABELS: Record<CleanlinessRating, string> = {
  'professional': 'Professional Standard',
  'domestic': 'Domestic Standard',
  'further_cleaning': 'Further Cleaning Required',
  'poor_standard': 'Poor Standard',
  'dusty': 'Dusty',
  'lightly_soiled': 'Lightly Soiled',
  'soiled': 'Soiled / Grubby',
  'na': 'N/A',
};

export const CLEANLINESS_GLOSSARY: Record<CleanlinessRating, string> = {
  'professional': 'A receipt, or cleaners seen at the property; all surfaces are clean, dust free, free from finger marks, polished and free from residue and limescale.',
  'domestic': 'All surfaces are clean; minor dust or grubby marks in places and require a minor wipe or vacuum in places.',
  'further_cleaning': 'All surfaces are dusty or grubby. Light cleaning, sweeping, vacuum or dusting would be necessary. Appliances and sanitary ware require light cleaning.',
  'poor_standard': 'The property requires a thorough full clean throughout with significant issues being noted throughout the report.',
  'dusty': 'Light dust which could easily be removed with a cloth or vacuum.',
  'lightly_soiled': 'Light or sticky marks that require light cleaning products or materials to remove.',
  'soiled': 'Heavy or sticky marks that require cleaning products or materials to remove.',
  'na': 'Not applicable.',
};

export const CLEANLINESS_COLORS: Record<CleanlinessRating, string> = {
  'professional': 'bg-emerald-500',
  'domestic': 'bg-green-500',
  'further_cleaning': 'bg-yellow-500',
  'poor_standard': 'bg-orange-500',
  'dusty': 'bg-amber-400',
  'lightly_soiled': 'bg-orange-400',
  'soiled': 'bg-red-500',
  'na': 'bg-gray-400',
};

export const CONDITION_COLORS: Record<ConditionRating, string> = {
  'excellent': 'bg-emerald-500',
  'good': 'bg-green-500',
  'fair': 'bg-yellow-500',
  'poor': 'bg-orange-500',
  'damaged': 'bg-red-500',
  'missing': 'bg-gray-500',
  'na': 'bg-gray-400',
};

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  'entrance': 'Entrance/Hallway',
  'hallway': 'Hallway',
  'living_room': 'Living Room',
  'dining_room': 'Dining Room',
  'kitchen': 'Kitchen',
  'bedroom': 'Bedroom',
  'bathroom': 'Bathroom',
  'toilet': 'WC/Toilet',
  'utility': 'Utility Room',
  'storage': 'Storage',
  'garden': 'Garden',
  'garage': 'Garage',
  'balcony': 'Balcony',
  'other': 'Other',
};

// Default items per room type
export const DEFAULT_ROOM_ITEMS: Record<RoomType, string[]> = {
  'entrance': ['Front Door', 'Front Door Frame', 'Door Lock', 'Flooring', 'Walls', 'Ceiling', 'Skirting', 'Light Fixture', 'Sockets', 'Smoke Alarm', 'Coat Hooks'],
  'hallway': ['Flooring', 'Walls', 'Ceiling', 'Skirting', 'Light Fixture', 'Doors', 'Sockets', 'Radiator', 'Staircase', 'Banister'],
  'living_room': ['Flooring', 'Walls', 'Ceiling', 'Skirting', 'Windows', 'Curtains/Blinds', 'Light Fixture', 'Sockets', 'Radiator', 'Sofa', 'TV Unit'],
  'dining_room': ['Flooring', 'Walls', 'Ceiling', 'Skirting', 'Windows', 'Light Fixture', 'Sockets', 'Radiator', 'Table', 'Chairs'],
  'kitchen': ['Flooring', 'Walls', 'Ceiling', 'Windows', 'Sockets', 'Light Fixture', 'Worktops', 'Sink', 'Taps', 'Cupboards', 'Drawers', 'Oven', 'Hob', 'Extractor', 'Fridge', 'Freezer', 'Dishwasher', 'Washing Machine'],
  'bedroom': ['Flooring', 'Walls', 'Ceiling', 'Skirting', 'Windows', 'Curtains/Blinds', 'Light Fixture', 'Sockets', 'Radiator', 'Bed Frame', 'Mattress', 'Wardrobe', 'Drawers'],
  'bathroom': ['Flooring', 'Walls', 'Ceiling', 'Windows', 'Light Fixture', 'Extractor Fan', 'Bath', 'Shower', 'Toilet', 'Sink', 'Taps', 'Mirror', 'Towel Rail', 'Sockets'],
  'toilet': ['Flooring', 'Walls', 'Ceiling', 'Light Fixture', 'Toilet', 'Sink', 'Taps', 'Mirror'],
  'utility': ['Flooring', 'Walls', 'Ceiling', 'Worktops', 'Sink', 'Taps', 'Sockets', 'Washing Machine', 'Dryer', 'Boiler'],
  'storage': ['Flooring', 'Walls', 'Ceiling', 'Shelving', 'Door', 'Light Fixture'],
  'garden': ['Lawn', 'Patio', 'Fencing', 'Shed', 'Gate', 'Light Fixture'],
  'garage': ['Floor', 'Walls', 'Ceiling', 'Door', 'Light Fixture', 'Shelving', 'Sockets'],
  'balcony': ['Floor', 'Railing', 'Door', 'Light Fixture'],
  'other': ['Flooring', 'Walls', 'Ceiling', 'Skirting', 'Light Fixture', 'Sockets', 'Windows'],
};

/** Common area presets for quick-adding rooms that aren't in the standard property details */
export const EXTRA_ROOM_PRESETS: Array<{ type: RoomType; name: string; icon?: string }> = [
  { type: 'other', name: 'Front Exterior' },
  { type: 'bathroom', name: 'En-Suite' },
  { type: 'other', name: 'Terrace' },
  { type: 'hallway', name: 'Landing' },
  { type: 'hallway', name: 'Stairs & Landing' },
  { type: 'other', name: 'Communal Area' },
  { type: 'other', name: 'Loft' },
  { type: 'other', name: 'Cellar' },
  { type: 'other', name: 'Conservatory' },
  { type: 'other', name: 'Porch' },
  { type: 'toilet', name: 'Cloakroom / WC' },
  { type: 'other', name: 'Reception' },
  { type: 'other', name: 'Laundry Room' },
  { type: 'other', name: 'Dressing Room' },
  { type: 'other', name: 'Study / Office' },
  { type: 'other', name: 'Open Plan Kitchen / Living' },
];
