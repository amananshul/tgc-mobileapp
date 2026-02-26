export type ProfileIntent = 'LEARN' | 'EARN' | 'ENTERTAIN' | null;
export type GrowthIntent =
  | 'LEARN'
  | 'EARN'
  | 'ENTERTAIN'
  | 'VOLUNTEER'
  | 'NETWORK';
export type ProfileMode = 'USER' | 'HOST';

export type UserRole = 'USER' | 'HOST' | 'ADMIN';

export interface UserData {
  id: string;
  email: string | null;
  supabaseId?: string | null;
  phone: string | null;
  phoneVerified: boolean;
  role: UserRole;
  onboardingCompleted: boolean;
}

export interface ProfileData {
  id: string;
  intent: ProfileIntent;
  growthIntent: GrowthIntent[];
  avatarPath: string | null;
  avatarUrl: string | null;
  username: string | null;
  fullName: string | null;
  city: string | null;
  bio: string | null;
  shortBio: string | null;
  interests: string[];
  skills: string[];
  activeMode: ProfileMode;
  onboardingStep: number;
  isOnboarded: boolean;
  karmaPoints: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserData;
  profile: ProfileData;
  _testOtp?: string;
  message?: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  user: UserData;
  profile: ProfileData;
}

export interface OtpVerifyResponse {
  message: string;
  phoneVerified: boolean;
}

export interface OtpResendResponse {
  message: string;
  _testOtp?: string;
}

export interface MeResponse {
  user: UserData;
  profile: ProfileData;
}

export interface UpdateProfilePayload {
  intent?: Exclude<ProfileIntent, null>;
  growthIntent?: GrowthIntent[];
  avatarPath?: string | null;
  username?: string;
  fullName?: string;
  city?: string;
  bio?: string;
  shortBio?: string;
  interests?: string[];
  skills?: string[];
  activeMode?: ProfileMode;
}

export interface UpdateProfileResponse {
  user?: UserData;
  profile: ProfileData;
}

export interface SaveOnboardingPayload {
  growthIntent: GrowthIntent[];
  avatarPath: string;
  username: string;
  fullName: string;
  city: string;
  shortBio: string;
  interests: string[];
  skills: string[];
}

export interface SaveOnboardingResponse {
  message: string;
  user: UserData;
  profile: ProfileData;
  onboardingCompleted: boolean;
}

export interface DashboardAction {
  id: string;
  title: string;
  description: string;
  done: boolean;
  accent: 'mint' | 'coral' | 'lavender';
}

export interface DashboardTribe {
  id: string;
  name: string;
  slug: string;
  members: number;
  coverImagePath?: string | null;
  coverImageUrl?: string | null;
}

// ──── Tribe Types ────────────────────────────────────────
export type TribeMemberRole = 'MEMBER' | 'MODERATOR' | 'OWNER';

export interface Tribe {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImagePath: string | null;
  coverImageUrl: string | null;
  category: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  memberCount: number;
  createdAt: string;
  isJoined?: boolean;
  memberRole?: TribeMemberRole | null;
}

export interface TribeWithJoinedAt extends Tribe {
  joinedAt: string;
}

export interface TribesListResponse {
  tribes: Tribe[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TribeDetailResponse {
  tribe: Tribe;
}

export interface JoinTribeResponse {
  message: string;
  tribe: Tribe;
  karmaPoints: number;
}

export interface LeaveTribeResponse {
  message: string;
}

export interface MyTribesResponse {
  tribes: TribeWithJoinedAt[];
}

export interface CreateTribePayload {
  name: string;
  description?: string;
  coverImagePath?: string;
  category?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
}

export interface HostEnableResponse {
  user: UserData;
}

export interface TribePostAuthor {
  username: string | null;
  fullName: string | null;
  avatarPath: string | null;
  avatarUrl: string | null;
}

export interface TribePost {
  id: string;
  tribeId: string;
  userId: string;
  content: string;
  imagePath: string | null;
  imageUrl: string | null;
  createdAt: string;
  author: TribePostAuthor;
}

export interface TribePostsResponse {
  posts: TribePost[];
}

export interface CreateTribePostPayload {
  content: string;
  imagePath?: string;
}

export interface CreateTribePostResponse {
  post: TribePost;
}

// ──── Event Types ─────────────────────────────────────────────────────────────

export type EventCategory =
  | 'WORKSHOP'
  | 'OPEN_MIC'
  | 'FITNESS'
  | 'MUSIC'
  | 'ART'
  | 'TECH'
  | 'SOCIAL'
  | 'VOLUNTEER'
  | 'OTHER';

export type EventVisibility = 'PUBLIC' | 'TRIBE_ONLY' | 'PRIVATE';

export interface EventTribeSummary {
  id: string;
  name: string;
  slug: string;
}

export interface EventCreator {
  id: string;
  fullName: string | null;
  username: string | null;
  avatarPath: string | null;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: EventCategory;
  city: string;
  venueName: string | null;
  addressText: string | null;
  startAt: string;
  endAt: string | null;
  coverImageUrl: string | null;
  visibility: EventVisibility;
  capacity: number | null;
  registrationCount: number;
  tribe: EventTribeSummary | null;
  createdBy: EventCreator | null;
  createdAt: string;
  isRegistered: boolean;
  myPassCode: string | null;
}

export interface EventsListResponse {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EventDetailResponse {
  event: Event;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  category?: EventCategory;
  city: string;
  venueName?: string;
  addressText?: string;
  startAt: string;
  endAt?: string;
  coverImageUrl?: string;
  visibility?: EventVisibility;
  tribeId?: string;
  capacity?: number;
}

export interface RegisterEventResponse {
  registration: {
    id: string;
    passCode: string;
    status: string;
    createdAt: string;
    event: {
      id: string;
      title: string;
      slug: string;
      startAt: string;
      city: string;
    } | null;
  };
}

export interface MyEventsResponse {
  created: Event[];
  registered: Array<{
    id: string;
    passCode: string;
    status: string;
    createdAt: string;
    event: Event;
  }>;
}

export interface DashboardResponse {
  user: UserData;
  profile: ProfileData;
  mode: ProfileMode;
  welcome: {
    title: string;
    subtitle: string;
  };
  onboarding: {
    onboardingStep: number;
    isOnboarded: boolean;
    completeness: number;
  };
  profileSummary: {
    title: string;
    completionText: string;
    level: number;
  };
  nextActions: DashboardAction[];
  karma: {
    level: number;
    points: number;
    pointsToNext: number;
    progress: number;
  };
  stats: {
    eventsAttended: number;
    gigsDone: number;
    connections: number;
  };
  hostStats: {
    totalRsvps: number;
    activeGigs: number;
    pendingApprovals: number;
  };
  tribes: DashboardTribe[];
  hostModeCard: {
    title: string;
    subtitle: string;
    cta: string;
    enabled: boolean;
  };
  upcomingEventsPreview?: Event[];
  nextBestActions?: Array<{
    code: string;
    title: string;
    subtitle: string;
    ctaRoute: string | null;
  }>;
}
