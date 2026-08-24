import { Redirect, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect } from 'react';

import { useChatSessionStore } from '@/stores/chat-session.store';

/**
 * Deep-link / legacy route: set the active conversation and land on the Chat tab.
 */
export default function ChatIdRedirect() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const setActiveId = useChatSessionStore((s) => s.setActiveConversationId);

  useEffect(() => {
    if (id) setActiveId(id);
  }, [id, setActiveId]);

  return <Redirect href={'/(tabs)/chat' as Href} />;
}
