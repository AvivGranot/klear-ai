/**
 * Bot Module Index
 * Exports all bot handlers and utilities
 */

// Main router
export {
  routeMessage,
  sendMessages,
  forwardToEmployee,
  notifyManager,
  broadcastToRole,
  type IncomingMessage,
  type OutgoingMessage,
  type RouteResult,
} from './message-router';

// Onboarding
export {
  handleOnboarding,
  getOrCreateSession,
  createSession,
  isOnboarding,
  getSessionRole,
  type OnboardingStep,
  type OnboardingResponse,
} from './onboarding';

// Manager chat
export {
  handleManagerMessage,
  isLikelyCommand,
  type ManagerResponse,
  type ManagerCommand,
} from './manager-chat';

// Employee chat
export {
  handleEmployeeQuery,
  getSuggestedQuestions,
  handleFeedback,
  type EmployeeResponse,
  type AISearchResult,
} from './employee-chat';

// Escalation handling
export {
  createEscalation,
  resolveEscalation,
  getPendingEscalationForManager,
  getPendingEscalations,
  getManagerNotification,
  assignEscalationToManager,
  getEscalationStats,
  type EscalationResult,
  type EscalationNotification,
} from './escalation-handler';
