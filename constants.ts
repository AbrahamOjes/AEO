
import { MentionPosition, Sentiment } from './types';

export const POSITION_POINTS: Record<MentionPosition, number> = {
  [MentionPosition.Primary]: 3,
  [MentionPosition.Secondary]: 2,
  [MentionPosition.Tertiary]: 1,
  [MentionPosition.None]: 0,
};

export const SENTIMENT_MODIFIER: Record<Sentiment, number> = {
  [Sentiment.Positive]: 1.2,
  [Sentiment.Neutral]: 1.0,
  [Sentiment.Negative]: 0.5,
};

export const MAX_POINTS_PER_CHECK = 3 * 1.2; // Primary (3) * Positive (1.2)
