import type { AskQuestionPayload, ChatMessage } from '@fitness/types';
import { ASK_QUESTION_MARKER, ChatMessageRole } from '@fitness/types';
import type { UIMessage } from 'ai';
import { isTextUIPart } from 'ai';

// Must match the tool key `ChatsService` registers with `streamText` in the API.
const ASK_QUESTION_PART_TYPE = 'tool-askQuestion';

/** Split a persisted assistant message on the marker into its lead text and,
 * if present, the structured question it asked (see `ASK_QUESTION_MARKER`). */
function parseAskQuestionContent(content: string): {
  lead: string;
  question: AskQuestionPayload | null;
} {
  const index = content.indexOf(ASK_QUESTION_MARKER);
  if (index === -1) return { lead: content, question: null };

  const lead = content.slice(0, index).trim();
  const raw = content.slice(index + ASK_QUESTION_MARKER.length).trim();
  try {
    const parsed = JSON.parse(raw) as Partial<AskQuestionPayload>;
    if (typeof parsed.question !== 'string' || !Array.isArray(parsed.options)) {
      return { lead: content, question: null };
    }
    return {
      lead,
      question: {
        question: parsed.question,
        options: parsed.options,
        allowMultiple: parsed.allowMultiple,
      },
    };
  } catch {
    return { lead: content, question: null };
  }
}

/** Persistable API messages → AI SDK UI messages for `useChat`. A stored
 * askQuestion turn is rehydrated into a synthetic tool part so history and
 * live streaming render through the same path in `ChatThread`. */
export function toUIMessages(messages: ChatMessage[]): UIMessage[] {
  return messages
    .filter((message) => message.role !== ChatMessageRole.System)
    .map((message) => {
      if (message.role !== ChatMessageRole.Assistant) {
        return {
          id: message.id,
          role: message.role as 'user',
          parts: [{ type: 'text' as const, text: message.content }],
        };
      }

      const { lead, question } = parseAskQuestionContent(message.content);
      const parts: UIMessage['parts'] = [];
      if (lead) parts.push({ type: 'text', text: lead });
      if (question) {
        parts.push({
          type: ASK_QUESTION_PART_TYPE,
          toolCallId: `${message.id}-question`,
          state: 'input-available',
          input: question,
        } as never);
      }

      return { id: message.id, role: 'assistant' as const, parts };
    });
}

/** Concatenate text parts for markdown rendering. */
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

/** The question the coach is asking in this message, if it called
 * `askQuestion` (live, mid-stream, or replayed from history). */
export function askQuestionFromUIMessage(
  message: UIMessage,
): AskQuestionPayload | null {
  for (const part of message.parts as {
    type: string;
    input?: unknown;
  }[]) {
    if (part.type !== ASK_QUESTION_PART_TYPE || !part.input) continue;
    const input = part.input as Partial<AskQuestionPayload>;
    if (typeof input.question !== 'string' || !Array.isArray(input.options)) {
      continue;
    }
    return {
      question: input.question,
      options: input.options,
      allowMultiple: input.allowMultiple,
    };
  }
  return null;
}

/** A short label for what the coach is doing while a tool call is in
 * flight and no text has arrived yet, for the thinking indicator. */
export function pendingToolLabel(message: UIMessage): string | null {
  for (const part of message.parts as {
    type: string;
    state?: string;
  }[]) {
    if (!part.type.startsWith('tool-')) continue;
    if (part.state === 'output-available' || part.state === 'output-error') {
      continue;
    }

    const toolName = part.type.slice('tool-'.length);
    if (toolName === 'getUserDetails') return 'Checking your profile…';
    if (toolName === 'askQuestion') return 'Preparing a question…';
    return 'Working on it…';
  }
  return null;
}
