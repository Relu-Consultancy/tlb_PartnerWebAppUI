export interface VenueCategory {
  name: string;
  icon: string;
  subcategories: string[];
}

export const VENUE_CATEGORIES: VenueCategory[] = [
  {
    name: 'Play & Adventure',
    icon: '🧗',
    subcategories: ['Soft Play', 'Trampoline Parks', 'Ninja Courses', 'Climbing Walls', 'Arcade & Tag', 'VR & Simulation', 'Escape Rooms', 'Sensory Play'],
  },
  {
    name: 'Sports & Active',
    icon: '⚽',
    subcategories: ['Turf Sports', 'Racket Sports', 'Swimming', 'Combat Arts', 'Gymnastics & Yoga', 'Skating', 'Archery & Bowling', 'Adaptive Sports'],
  },
  {
    name: 'Creative & DIY',
    icon: '🎨',
    subcategories: ['Art & Painting', 'Pottery Cafes', 'Maker Spaces', 'Baking Studios', 'Music & Media', 'Therapeutic Art'],
  },
  {
    name: 'Party & Celebration',
    icon: '🎉',
    subcategories: ['Banquet Halls', 'Rooftop Venues', 'Private Cinemas', 'Party Suites', 'Garden Spaces'],
  },
  {
    name: 'Science & Discovery',
    icon: '🔬',
    subcategories: ['Kids\' Museums', 'STEM Labs', 'Planetariums', 'Tech Exhibits', 'Nature Museums', 'Experience Centers'],
  },
  {
    name: 'Nature & Animals',
    icon: '🌿',
    subcategories: ['Petting Zoos', 'Organic Farms', 'Botanic Gardens', 'Stables', 'Bird Parks', 'Therapy Farms', 'Farm Stay'],
  },
  {
    name: 'Reading & Study',
    icon: '📚',
    subcategories: ['Libraries', 'Book Cafes', 'Study Pods', 'Comic Lounges', 'Story Centers'],
  },
  {
    name: 'Dining & Cafes',
    icon: '🍔',
    subcategories: ['Play Cafes', 'Character Dining', 'Board Game Cafes', 'Kids\' Bistros', 'Culinary Cafes'],
  },
];

export const getVenueSubcategories = (categoryName: string): string[] => {
  const category = VENUE_CATEGORIES.find(c => c.name === categoryName);
  return category ? category.subcategories : [];
};
