export type Game = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  cover_url: string | null;
  icon: string;
  is_active: boolean;
  sort_order: number;
};

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  points_balance: number;
  role: "member" | "moderator" | "admin";
};

export type Challenge = {
  id: string;
  game_id: string;
  title: string;
  description: string;
  points_reward: number;
  reward_label: string | null;
  status: "active" | "coming_soon" | "archived";
  games?: Pick<Game, "id" | "slug" | "name" | "icon">;
};

export type ChallengeSubmission = {
  id: string;
  challenge_id: string;
  profile_id: string;
  proof_url: string | null;
  proof_link: string | null;
  status: "pending" | "approved" | "rejected";
  moderator_note: string | null;
  points_awarded: number | null;
  created_at: string;
};

export type Reward = {
  id: string;
  game_id: string;
  title: string;
  description: string | null;
  points_cost: number;
  icon: string;
  is_available: boolean;
  games?: Pick<Game, "id" | "slug" | "name">;
};

export type RewardOrder = {
  id: string;
  reward_id: string;
  points_spent: number;
  status: "pending" | "sent" | "received" | "cancelled";
  created_at: string;
  rewards?: Pick<Reward, "title" | "icon">;
};

export type ChatMessage = {
  id: string;
  game_id: string;
  profile_id: string;
  content: string;
  created_at: string;
  profiles?: Pick<Profile, "username" | "avatar_url">;
};

export type ChatBackground = {
  profile_id: string;
  game_id: string;
  bg_type: "default" | "color" | "image";
  bg_value: string | null;
};

export type LeaderboardRow = {
  profile_id: string;
  username: string;
  avatar_url: string | null;
  weekly_points: number;
  primary_game_id: string | null;
  primary_game_slug: string | null;
  primary_game_name: string | null;
};
