import { EntityType } from '../types';

export interface BatchMock {
    name: string;
    days: string;
    time: string;
    capacity: number;
    enrolled: number;
}

export interface ListingMock {
    id: string;
    title: string;
    category: string;
    entityType: EntityType;
    status: 'Live' | 'Paused';
    batches: BatchMock[];
}

export const mockListings: ListingMock[] = [
    {
        id: '1', title: 'Hatha Yoga', category: 'Yoga & Wellness', entityType: 'Classes', status: 'Live',
        batches: [
            { name: 'Morning Batch', days: 'Mon, Wed, Fri', time: '7:00–8:00 AM', capacity: 15, enrolled: 12 },
            { name: 'Evening Batch', days: 'Tue, Thu', time: '6:00–7:00 PM', capacity: 20, enrolled: 8 },
        ]
    },
    {
        id: '2', title: 'Kids Contemporary Dance', category: 'Dance & Movement', entityType: 'Classes', status: 'Live',
        batches: [
            { name: 'Weekend Morning', days: 'Sat', time: '10:00–11:30 AM', capacity: 25, enrolled: 22 },
        ]
    },
    {
        id: '3', title: 'Summer Art Workshop', category: 'Arts & Crafts', entityType: 'Events', status: 'Live',
        batches: [
            { name: 'June Batch', days: 'Mon–Fri', time: '10:00–12:00 PM', capacity: 30, enrolled: 18 },
        ]
    },
    {
        id: '4', title: 'Keyboard Basics', category: 'Music & Instruments', entityType: 'Classes', status: 'Paused',
        batches: [
            { name: 'Sunday Batch', days: 'Sun', time: '11:00 AM–12:00 PM', capacity: 10, enrolled: 0 },
        ]
    },
    {
        id: '5', title: 'Weekend Robotics Camp', category: 'STEM & Innovation', entityType: 'Events', status: 'Live',
        batches: [
            { name: 'Sat–Sun Batch', days: 'Sat, Sun', time: '2:00–5:00 PM', capacity: 20, enrolled: 14 },
        ]
    },
];
