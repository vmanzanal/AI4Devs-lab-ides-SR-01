// Candidates Components Index
// Central export point for all candidate-related components

// Components
export { CandidateCard } from './CandidateCard';
export { CandidateList } from './CandidateList';

// Types
export type { CandidateCardProps } from './CandidateCard';
export type { CandidateListProps } from './CandidateList';

// Import components for organized access
import { CandidateCard } from './CandidateCard';
import { CandidateList } from './CandidateList';

// Re-export for convenience
export const CandidateListComponents = {
  CandidateCard,
  CandidateList
};
