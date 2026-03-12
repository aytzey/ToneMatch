export type SubscriptionPlan = "free" | "plus" | "pro";

export type SubscriptionStateView = {
  plan: SubscriptionPlan;
  provider: string;
  periodEndsAt: string | null;
};

export type RecommendationCard = {
  id: string;
  title: string;
  category: string;
  description?: string;
  reason: string;
  score: number;
  price: string;
  merchantUrl?: string | null;
  merchantName?: string | null;
  merchantSource?: string | null;
  isPremium?: boolean;
  colorFamily?: string;
};

export type StyleSummary = {
  title: string;
  description: string;
};

export type StyleFocusItem = {
  title: string;
  copy: string;
};

export type StylePalette = {
  core: string[];
  avoid: string[];
};

export type AnalysisSnapshot = {
  undertone: string;
  contrast: string;
  confidence: number;
  summary: StyleSummary;
  focusItems: StyleFocusItem[];
  palette: StylePalette;
  recommendations: RecommendationCard[];
  capturedAt?: string;
  sourceSessionId?: string | null;
};

export type ClothingCheck = {
  visible_colors: string[];
  verdict: string;
  explanation: string;
  suggestion: string;
};

export type StyleExperience = {
  undertone: string;
  contrast: string;
  confidence: number;
  plan: SubscriptionPlan;
  summary: StyleSummary;
  focusItems: StyleFocusItem[];
  palette: StylePalette;
  recommendations: RecommendationCard[];
};

export type StyleTheorySection = {
  title: string;
  body: string;
};

export type StyleTheoryExample = {
  title: string;
  copy: string;
};

export type StyleTheoryView = {
  title: string;
  subtitle: string;
  intro: string;
  pullQuote: string;
  sections: StyleTheorySection[];
  examples: StyleTheoryExample[];
  closing: string;
  source: "ai" | "fallback";
};

export type AnalysisSessionView = {
  id: string;
  status: string;
  confidenceScore?: number | null;
  createdAt: string;
};

export type WardrobeItemView = {
  id: string;
  name: string;
  note: string;
  tags: string[];
  fitScore?: number | null;
  createdAt?: string;
};

export type ExportPayload = {
  exportedAt: string;
  user: {
    id?: string;
    email?: string | null;
  };
  styleProfile?: Record<string, unknown> | null;
  analysisSessions: unknown[];
  wardrobeItems: unknown[];
  feedbackEvents: unknown[];
  commerceClickEvents?: unknown[];
  quickCheckResults?: unknown[];
  subscriptionState?: SubscriptionStateView | null;
  revenuecatEvents?: unknown[];
};

export type QuickCheckView = {
  id: string;
  label: string;
  score: number;
  confidence: number;
  bestUse: string;
  reason: string;
  colorFamily: string;
  createdAt?: string;
  clothingCheck?: ClothingCheck | null;
};
