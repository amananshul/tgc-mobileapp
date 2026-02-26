import type {GrowthIntent} from '../../../types/auth';

export const INTENT_OPTIONS: Array<{
  id: GrowthIntent;
  title: string;
  icon: string;
  description: string;
  accent: 'mint' | 'coral' | 'lavender';
}> = [
  {
    id: 'LEARN',
    title: 'Learn',
    icon: '📚',
    description: 'Discover knowledge from creators, mentors, and peers.',
    accent: 'mint',
  },
  {
    id: 'EARN',
    title: 'Earn',
    icon: '💼',
    description: 'Turn your skills into gigs, collaborations, and income.',
    accent: 'coral',
  },
  {
    id: 'ENTERTAIN',
    title: 'Entertain',
    icon: '🎤',
    description: 'Share your talent and energize people around you.',
    accent: 'lavender',
  },
  {
    id: 'VOLUNTEER',
    title: 'Volunteer',
    icon: '🤝',
    description: 'Contribute your time and skills to community causes.',
    accent: 'mint',
  },
  {
    id: 'NETWORK',
    title: 'Network',
    icon: '🌐',
    description: 'Build meaningful relationships and collaborations.',
    accent: 'coral',
  },
];

export const INTEREST_OPTIONS = [
  'Tech',
  'Music',
  'Art',
  'Sports',
  'Education',
  'Fitness',
  'Startups',
  'Gaming',
  'Food',
  'Travel',
  'Wellness',
  'Business',
];

export const SKILL_OPTIONS = [
  'Coding',
  'DJing',
  'Photography',
  'Design',
  'Public Speaking',
  'Event Planning',
  'Marketing',
  'Video Editing',
  'Teaching',
  'Singing',
  'Dancing',
  'Content Creation',
  'Management',
  'Writing',
];
