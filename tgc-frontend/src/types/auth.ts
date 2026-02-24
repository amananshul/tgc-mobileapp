export type ProfileIntent = 'LEARN' | 'EARN' | 'ENTERTAIN' | null;
export type ProfileMode = 'USER' | 'HOST';

export type UserRole = 'USER' | 'HOST' | 'ADMIN';

export interface UserData {
  id: string;
  email: string;
  phone: string | null;
  phoneVerified: boolean;
  role: UserRole;
}

export interface ProfileData {
  id: string;
  intent: ProfileIntent;
  avatarPath: string | null;
  avatarUrl: string | null;
  username: string | null;
  fullName: string | null;
  city: string | null;
  bio: string | null;
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
  avatarPath?: string | null;
  username?: string;
  fullName?: string;
  city?: string;
  bio?: string;
  interests?: string[];
  skills?: string[];
  activeMode?: ProfileMode;
}

export interface UpdateProfileResponse {
  profile: ProfileData;
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
}
