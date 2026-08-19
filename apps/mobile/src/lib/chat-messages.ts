import type { ChatMessage } from '@fitness/types';
import { ChatMessageRole } from '@fitness/types';
import type { UIMessage } from 'ai';
import { isTextUIPart } from 'ai';

/** Persistable API messages → AI SDK UI messages for `useChat`. */
export function toUIMessages(messages: ChatMessage[]): UIMessage[] {
  return messages
    .filter((message) => message.role !== ChatMessageRole.System)
    .map((message) => ({
      id: message.id,
      role: message.role as 'user' | 'assistant',
      parts: [{ type: 'text' as const, text: message.content }],
    }));
}

/** Concatenate text parts for bubble rendering. */
export function textFromUIMessage(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join('');
}

export function isMessageStreaming(message: UIMessage): boolean {
  return message.parts.some(
    (part) => isTextUIPart(part) && part.state === 'streaming',
  );
}
