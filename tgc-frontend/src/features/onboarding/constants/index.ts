import type {ProfileIntent} from '../../../types/auth';

export const INTENT_OPTIONS: Array<{
  id: Exclude<ProfileIntent, null>;
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
];

export const INTEREST_OPTIONS = [
  'Tech',
  'Music',
  'Art',
  'Sports',
  'Education',
  'Fitness',
  'Startups',
];

export const SKILL_OPTIONS = [
  'DJing',
  'Coding',
  'Photography',
  'Event Planning',
  'Design',
  'Public Speaking',
];
