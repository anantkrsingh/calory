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
