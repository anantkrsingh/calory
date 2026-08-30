import type { Entity, Id, IsoDateTime } from './common';
import type { ChatMessageRole } from './enums';

export interface ChatConversation extends Entity {
  userId: Id;
  title?: string;
  messageCount: number;
  lastMessageAt?: IsoDateTime;
}

export interface ChatMessage extends Entity {
  conversationId: Id;
  role: ChatMessageRole;
  content: string;
}

/** Conversation detail with the latest page of messages (oldest → newest). */
export interface ChatConversationDetail extends ChatConversation {
  messages: ChatMessage[];
}

/**
 * `ChatMessage.content` is a plain string, so a multiple-choice question
 * asked via the `askQuestion` tool is embedded in it as trailing text after
 * this marker, followed by a JSON-encoded `AskQuestionPayload`. Both the API
 * (writing it in `ChatsService.onFinish`) and the mobile app (parsing it in
 * `chat-messages.ts` to render option chips) must agree on this format.
 */
export const ASK_QUESTION_MARKER = '@@ASK_QUESTION@@';

export interface AskQuestionPayload {
  question: string;
  options: string[];
  allowMultiple?: boolean;
}
