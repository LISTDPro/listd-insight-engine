/** Default items per room type for the condition mapper */
export const MAPPER_ROOM_ITEMS: Record<string, string[]> = {
  'Entrance Hall': ['Walls', 'Ceiling', 'Floor', 'Door', 'Door Frame', 'Lighting', 'Sockets/Switches', 'Skirting'],
  'Hallway': ['Walls', 'Ceiling', 'Floor', 'Lighting', 'Sockets/Switches', 'Skirting', 'Radiator'],
  'Living Room': ['Walls', 'Ceiling', 'Floor', 'Windows', 'Curtains/Blinds', 'Lighting', 'Sockets/Switches', 'Skirting', 'Radiator'],
  'Dining Room': ['Walls', 'Ceiling', 'Floor', 'Windows', 'Lighting', 'Sockets/Switches', 'Skirting', 'Radiator'],
  'Kitchen': ['Walls', 'Ceiling', 'Floor', 'Windows', 'Lighting', 'Sockets/Switches', 'Worktops', 'Sink', 'Taps', 'Oven', 'Hob', 'Extractor', 'Fridge', 'Dishwasher', 'Cupboards', 'Drawers'],
  'Bathroom': ['Walls', 'Ceiling', 'Floor', 'Lighting', 'Toilet', 'Basin', 'Bath/Shower', 'Taps', 'Mirror', 'Tiles', 'Extractor Fan', 'Towel Rail'],
  'Bedroom': ['Walls', 'Ceiling', 'Floor', 'Windows', 'Curtains/Blinds', 'Lighting', 'Sockets/Switches', 'Skirting', 'Radiator', 'Wardrobe', 'Door'],
  'Utility Room': ['Walls', 'Ceiling', 'Floor', 'Lighting', 'Sockets/Switches', 'Worktops', 'Sink', 'Taps', 'Washing Machine', 'Dryer'],
  'Garden': ['Lawn', 'Patio', 'Fencing', 'Gate', 'Shed'],
  'Garage': ['Floor', 'Walls', 'Ceiling', 'Door', 'Lighting', 'Sockets/Switches'],
  'WC/Toilet': ['Walls', 'Ceiling', 'Floor', 'Lighting', 'Toilet', 'Basin', 'Taps', 'Mirror'],
  'Storage': ['Walls', 'Ceiling', 'Floor', 'Shelving', 'Door', 'Lighting'],
};

/** Get default items for a room name, falling back to generic items */
export function getDefaultItemsForRoom(roomName: string): string[] {
  // Try exact match first
  if (MAPPER_ROOM_ITEMS[roomName]) return MAPPER_ROOM_ITEMS[roomName];
  // Try partial match
  const lower = roomName.toLowerCase();
  for (const [key, items] of Object.entries(MAPPER_ROOM_ITEMS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return items;
    }
  }
  // Generic fallback
  return ['Walls', 'Ceiling', 'Floor', 'Doors', 'Windows', 'Lighting', 'Sockets/Switches'];
}

export type ItemCondition = 'good' | 'fair' | 'poor' | 'na';

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  na: 'N/A',
};

export const CONDITION_COLORS: Record<ItemCondition, string> = {
  good: 'bg-emerald-500',
  fair: 'bg-yellow-500',
  poor: 'bg-red-500',
  na: 'bg-gray-400',
};
