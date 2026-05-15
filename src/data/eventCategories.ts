import { EventFormat, AgeGroup, EventMode } from '../types';

// ---------------------------------------------------------------------------
// Event Categories — 10 Main Categories + Subcategories
// ---------------------------------------------------------------------------
export interface EventCategoryDef {
  name: string;
  icon: string;  // emoji shorthand, mapped to Lucide icons in UI
  color: string;
  subcategories: string[];
}

export const EVENT_CATEGORIES: EventCategoryDef[] = [
  {
    name: 'Arts & Crafts',
    icon: '🎨',
    color: 'bg-pink-50 text-pink-600 border-pink-100',
    subcategories: ['Painting', 'Pottery', 'Sketching', 'Clay Modelling', 'DIY Crafts', 'Origami', 'Sculpture', 'Calligraphy', 'Resin Art', 'Textile Art'],
  },
  {
    name: 'Performing Arts',
    icon: '🎭',
    color: 'bg-purple-50 text-purple-600 border-purple-100',
    subcategories: ['Dance', 'Theatre / Acting', 'Singing / Vocal Music', 'Instrument Learning', 'Stand-up Comedy', 'Mime', 'Puppetry'],
  },
  {
    name: 'STEM & Innovation',
    icon: '🔬',
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    subcategories: ['Robotics', 'Coding', 'Artificial Intelligence', 'Game Development', 'App Development', 'Web Development', 'Electronics', 'Science Experiments', 'Space & Astronomy'],
  },
  {
    name: 'Sports & Fitness',
    icon: '⚽',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    subcategories: ['Football', 'Cricket', 'Basketball', 'Chess', 'Yoga', 'Martial Arts', 'Gymnastics', 'Skating', 'Pickle Ball', 'Swimming', 'Tennis', 'Badminton'],
  },
  {
    name: 'Languages & Communication',
    icon: '💬',
    color: 'bg-sky-50 text-sky-600 border-sky-100',
    subcategories: ['Public Speaking', 'Debate', 'Storytelling', 'Creative Writing', 'Spoken English', 'Foreign Languages', 'Indian Languages', 'Phonics'],
  },
  {
    name: 'Life Skills',
    icon: '🧠',
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    subcategories: ['Personality Development', 'Entrepreneurship', 'Financial Literacy', 'Emotional Intelligence', 'Leadership', 'Time Management'],
  },
  {
    name: 'Mind & Strategy Games',
    icon: '♟️',
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    subcategories: ['Chess', 'Abacus', 'Vedic Maths', 'Memory Skills', 'Problem Solving', 'Rubix Cube', 'Sudoku'],
  },
  {
    name: 'Edutainment & Experiences',
    icon: '🎪',
    color: 'bg-rose-50 text-rose-600 border-rose-100',
    subcategories: ['Science Shows', 'Magic Shows', 'Interactive Storytelling', 'Museum Tours', 'Virtual Reality', 'Escape Rooms'],
  },
  {
    name: 'Nature & Outdoors',
    icon: '🌿',
    color: 'bg-green-50 text-green-600 border-green-100',
    subcategories: ['Gardening', 'Nature Exploration', 'Environmental Education', 'Adventure Skills', 'Wildlife Learning', 'Bird Watching', 'Camping'],
  },
  {
    name: 'Festivals & Celebrations',
    icon: '🎉',
    color: 'bg-orange-50 text-orange-600 border-orange-100',
    subcategories: ['Cultural Festivals', 'Holiday Workshops', 'Seasonal Craft', 'Community Events', 'Food Festivals', 'Music Festivals'],
  },
];

// ---------------------------------------------------------------------------
// Event Formats — Selectable Tags
// ---------------------------------------------------------------------------
export const EVENT_FORMATS: EventFormat[] = [
  'Workshop',
  'Camp',
  'Masterclass',
  'Competition',
  'Tournament',
  'Showcase',
  'Bootcamp',
  'Demo / Trial',
  'Meetup',
  'Webinar',
];

// ---------------------------------------------------------------------------
// Age Group Presets
// ---------------------------------------------------------------------------
export const AGE_GROUPS: AgeGroup[] = [
  '0-3',
  '3-5',
  '6-8',
  '9-12',
  '13-16',
  'All Ages',
];

// ---------------------------------------------------------------------------
// Event Modes
// ---------------------------------------------------------------------------
export const EVENT_MODES: EventMode[] = ['Online', 'Offline', 'Hybrid'];

// ---------------------------------------------------------------------------
// Helper: Get subcategories for a category name
// ---------------------------------------------------------------------------
export function getSubcategories(categoryName: string): string[] {
  return EVENT_CATEGORIES.find(c => c.name === categoryName)?.subcategories ?? [];
}
