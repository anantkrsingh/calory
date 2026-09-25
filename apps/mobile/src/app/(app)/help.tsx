import type {
  SupportTicket,
  TicketStatus,
  TicketTimelineEvent,
} from '@fitness/types';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Paperclip, X } from 'lucide-react-native';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { getErrorMessage } from '@/api/errors';
import { ScreenAppBar } from '@/components/screen-app-bar';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  useAddTicketComment,
  useCreateTicket,
  useReopenTicket,
  useTickets,
  useUploadTicketAttachment,
} from '@/queries/tickets.queries';
import type { LocalImageFile } from '@/services/users.service';

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const HAIRLINE = StyleSheet.hairlineWidth || 1;
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'heic',
  'heif',
]);

type AttachmentDraft = LocalImageFile & {
  size?: number;
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_review: 'In review',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: '#2563EB',
  in_review: '#A16207',
  resolved: '#16803A',
  closed: '#525252',
};

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTicketDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function isAllowedAttachment(
  name?: string | null,
  mimeType?: string | null,
  uri?: string | null,
): boolean {
  const normalizedMime = mimeType?.toLowerCase();
  if (normalizedMime && ALLOWED_ATTACHMENT_MIME_TYPES.has(normalizedMime)) {
    return true;
  }

  const extension = (name ?? uri)?.split('.').pop()?.toLowerCase();
  return Boolean(extension && ALLOWED_ATTACHMENT_EXTENSIONS.has(extension));
}

function mimeTypeForAttachment(name?: string | null, mimeType?: string | null): string {
  if (mimeType) return mimeType;

  const extension = name?.split('.').pop()?.toLowerCase();
  if (extension === 'heic') return 'image/heic';
  if (extension === 'heif') return 'image/heif';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'gif') return 'image/gif';
  return 'image/jpeg';
}

export default function HelpScreen() {
  const theme = useTheme();
  const sheetRef = useRef<TrueSheet>(null);
  const detailSheetRef = useRef<TrueSheet>(null);
  const tickets = useTickets({ page: 1, limit: 10 });
  const createTicket = useCreateTicket();
  const addComment = useAddTicketComment();
  const reopenTicket = useReopenTicket();
  const uploadAttachment = useUploadTicketAttachment();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<AttachmentDraft | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  const submitting = createTicket.isPending || uploadAttachment.isPending;
  const subjectValid = subject.trim().length >= 3;
  const messageValid = message.trim().length >= 10;
  const canSubmit = subjectValid && messageValid && !submitting;

  const recentTickets = useMemo(
    () => tickets.data?.items ?? [],
    [tickets.data?.items],
  );
  const detailTicket = useMemo(
    () =>
      selectedTicket
        ? recentTickets.find((ticket) => ticket.id === selectedTicket.id) ??
          selectedTicket
        : null,
    [recentTickets, selectedTicket],
  );
  const commenting = addComment.isPending || reopenTicket.isPending;

  const pickAttachment = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo library access in Settings to attach a screenshot or photo to your support ticket.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsMultipleSelection: false,
    });

    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;

    if (asset.fileSize && asset.fileSize > MAX_ATTACHMENT_BYTES) {
      Alert.alert('Attachment too large', 'Please choose an image under 5 MB.');
      return;
    }

    if (!isAllowedAttachment(asset.fileName, asset.mimeType, asset.uri)) {
      Alert.alert(
        'Unsupported attachment',
        'Please choose JPEG, PNG, WebP, GIF, HEIC, or HEIF.',
      );
      return;
    }

    setAttachment({
      uri: asset.uri,
      name: asset.fileName ?? 'ticket-attachment.jpg',
      type: mimeTypeForAttachment(asset.fileName, asset.mimeType),
      size: asset.fileSize,
    });
  }, []);

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmissionError(null);

    try {
      const uploaded = attachment
        ? await uploadAttachment.mutateAsync(attachment)
        : undefined;

      await createTicket.mutateAsync({
        subject: subject.trim(),
        message: message.trim(),
        attachments: uploaded ? [uploaded] : [],
      });

      setSubject('');
      setMessage('');
      setAttachment(null);
      await sheetRef.current?.dismiss();
      Alert.alert('Ticket submitted', 'Our team can now review it from admin.');
    } catch (error) {
      setSubmissionError(
        getErrorMessage(error, 'Please try again in a moment.'),
      );
    }
  }, [
    attachment,
    canSubmit,
    createTicket,
    message,
    subject,
    uploadAttachment,
  ]);

  const openTicket = useCallback((ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setCommentText('');
    setCommentError(null);
    void detailSheetRef.current?.present();
  }, []);

  const submitComment = useCallback(async () => {
    if (!detailTicket || commentText.trim().length === 0 || commenting) return;

    setCommentError(null);
    try {
      const canReopen =
        detailTicket.status === 'resolved' || detailTicket.status === 'closed';
      const input = { message: commentText.trim(), attachments: [] };
      const updated = canReopen
        ? await reopenTicket.mutateAsync({ id: detailTicket.id, input })
        : await addComment.mutateAsync({ id: detailTicket.id, input });

      setSelectedTicket(updated);
      setCommentText('');
    } catch (error) {
      setCommentError(
        getErrorMessage(error, 'Please try again in a moment.'),
      );
    }
  }, [addComment, commentText, commenting, detailTicket, reopenTicket]);

  return (
    <TabScreen appBar={false} header={<ScreenAppBar title="Tickets" />}>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        refreshControl={
          <RefreshControl
            refreshing={tickets.isRefetching}
            onRefresh={() => void tickets.refetch()}
            tintColor={Brand.accent}
          />
        }
        contentContainerStyle={styles.content}
        bottomOffset={Spacing.four}
      >
        {tickets.isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Brand.accent} />
          </View>
        ) : null}

        {tickets.isError ? (
          <ThemedText themeColor="textSecondary">
            Couldn’t load tickets.
          </ThemedText>
        ) : recentTickets.length > 0 ? (
          <View style={styles.ticketList}>
            {recentTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onPress={() => openTicket(ticket)}
              />
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.emptyState,
              { borderColor: theme.border, backgroundColor: theme.surface },
            ]}
          >
            <Camera size={22} color={theme.textSecondary} strokeWidth={1.8} />
            <ThemedText themeColor="textSecondary">
              Your submitted tickets will appear here.
            </ThemedText>
          </View>
        )}

        <PrimaryButton
          label="Create Ticket"
          onPress={() => void sheetRef.current?.present()}
          style={styles.createButton}
          textStyle={styles.createButtonText}
        />
      </KeyboardAwareScrollView>

      <TrueSheet
        ref={sheetRef}
        detents={['auto']}
        dimmed
        dimmedDetentIndex={0}
        cornerRadius={20}
        dismissible={!submitting}
        draggable={false}
        backgroundColor={theme.background}
      >
        <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={styles.sheetContent}
          bottomOffset={Spacing.four}
        >
          <View style={styles.sheetHeader}>
            <ThemedText fontWeight="700" style={styles.sheetTitle}>
              Create ticket
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close ticket form"
              hitSlop={8}
              disabled={submitting}
              onPress={() => void sheetRef.current?.dismiss()}
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: theme.backgroundElement },
                submitting && styles.disabled,
                pressed && Pressed,
              ]}
            >
              <X size={18} color={theme.text} strokeWidth={2} />
            </Pressable>
          </View>

          <Field label="Subject">
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="What do you need help with?"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="sentences"
              returnKeyType="next"
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
            />
          </Field>

          <Field label="Message">
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Share what happened and what you expected."
              placeholderTextColor={theme.textSecondary}
              multiline
              textAlignVertical="top"
              style={[
                styles.input,
                styles.messageInput,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
            />
          </Field>

          {attachment ? (
            <View
              style={[
                styles.attachment,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
            >
              <Image
                source={{ uri: attachment.uri }}
                style={styles.attachmentThumb}
                contentFit="cover"
                transition={150}
                accessibilityIgnoresInvertColors
              />
              <View style={styles.attachmentInfo}>
                <ThemedText fontWeight="600" numberOfLines={1}>
                  {attachment.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatBytes(attachment.size) || 'Ready to upload'}
                </ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove attachment"
                hitSlop={8}
                onPress={() => setAttachment(null)}
                style={({ pressed }) => [
                  styles.iconButton,
                  { backgroundColor: theme.surface },
                  pressed && Pressed,
                ]}
              >
                <X size={18} color={theme.text} strokeWidth={2} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Attach screenshot or photo"
              onPress={() => void pickAttachment()}
              style={({ pressed }) => [
                styles.attachButton,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.backgroundElement,
                },
                pressed && Pressed,
              ]}
            >
              <Paperclip size={18} color={theme.text} strokeWidth={2} />
              <ThemedText
                type="small"
                fontWeight="600"
                style={styles.attachLabel}
                numberOfLines={1}
              >
                Attach screenshot or photo
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.attachHint}
              >
                Max 5 MB
              </ThemedText>
            </Pressable>
          )}

          {submissionError ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: Brand.accent,
                },
              ]}
            >
              <ThemedText type="small" fontWeight="700" style={styles.errorText}>
                Couldn’t submit ticket
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {submissionError}
              </ThemedText>
            </View>
          ) : null}

          <PrimaryButton
            label={submitting ? 'Submitting...' : 'Submit Ticket'}
            onPress={() => void submit()}
            disabled={!canSubmit}
            style={styles.submitButton}
          />
        </KeyboardAwareScrollView>
      </TrueSheet>

      <TrueSheet
        ref={detailSheetRef}
        detents={[0.75, 0.92]}
        dimmed
        dimmedDetentIndex={0}
        cornerRadius={20}
        dismissible={!commenting}
        draggable={false}
        backgroundColor={theme.background}
      >
        {detailTicket ? (
          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={styles.sheetContent}
            bottomOffset={Spacing.four}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.detailTitleBlock}>
                <ThemedText fontWeight="700" style={styles.sheetTitle} numberOfLines={1}>
                  {detailTicket.subject}
                </ThemedText>
                <StatusBadge status={detailTicket.status} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close ticket timeline"
                hitSlop={8}
                disabled={commenting}
                onPress={() => void detailSheetRef.current?.dismiss()}
                style={({ pressed }) => [
                  styles.iconButton,
                  { backgroundColor: theme.backgroundElement },
                  commenting && styles.disabled,
                  pressed && Pressed,
                ]}
              >
                <X size={18} color={theme.text} strokeWidth={2} />
              </Pressable>
            </View>

            <View style={styles.timeline}>
              {detailTicket.timeline.length > 0 ? (
                detailTicket.timeline.map((event) => (
                  <TimelineEventCard key={event.id} event={event} />
                ))
              ) : (
                <TimelineEventCard
                  event={{
                    id: detailTicket.id,
                    type: 'created',
                    actorRole: 'user',
                    message: detailTicket.message,
                    attachments: detailTicket.attachments,
                    createdAt: detailTicket.createdAt,
                  }}
                />
              )}
            </View>

            <Field
              label={
                detailTicket.status === 'resolved' ||
                detailTicket.status === 'closed'
                  ? 'Reopen with feedback'
                  : 'Add comment'
              }
            >
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder={
                  detailTicket.status === 'resolved' ||
                  detailTicket.status === 'closed'
                    ? 'Tell us what still needs attention.'
                    : 'Add more detail to this ticket.'
                }
                placeholderTextColor={theme.textSecondary}
                multiline
                textAlignVertical="top"
                style={[
                  styles.input,
                  styles.commentInput,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
              />
            </Field>

            {commentError ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: Brand.accent,
                  },
                ]}
              >
                <ThemedText type="small" fontWeight="700" style={styles.errorText}>
                  Couldn’t update ticket
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {commentError}
                </ThemedText>
              </View>
            ) : null}

            <PrimaryButton
              label={
                commenting
                  ? 'Submitting...'
                  : detailTicket.status === 'resolved' ||
                      detailTicket.status === 'closed'
                    ? 'Reopen Ticket'
                    : 'Add Comment'
              }
              onPress={() => void submitComment()}
              disabled={commentText.trim().length === 0 || commenting}
              style={styles.submitButton}
              textStyle={styles.createButtonText}
            />
          </KeyboardAwareScrollView>
        ) : null}
      </TrueSheet>
    </TabScreen>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <ThemedText type="small" fontWeight="600" themeColor="textSecondary">
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

function TicketCard({
  ticket,
  onPress,
}: {
  ticket: SupportTicket;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${ticket.subject} ticket`}
      onPress={onPress}
      style={[
        styles.ticketCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.ticketTopRow}>
        <ThemedText fontWeight="700" numberOfLines={1} style={styles.ticketTitle}>
          {ticket.subject}
        </ThemedText>
        <StatusBadge status={ticket.status} />
      </View>
      <ThemedText themeColor="textSecondary" numberOfLines={2}>
        {ticket.message}
      </ThemedText>
      <View style={styles.ticketMeta}>
        <ThemedText type="small" themeColor="textSecondary">
          {formatTicketDate(ticket.createdAt)}
        </ThemedText>
        {ticket.attachments.length > 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            {ticket.attachments.length} attachment
            {ticket.attachments.length === 1 ? '' : 's'}
          </ThemedText>
        ) : null}
      </View>
      {ticket.adminNote ? (
        <View
          style={[
            styles.adminNote,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
        >
          <ThemedText type="small" fontWeight="700">
            Admin note
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {ticket.adminNote}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const statusColor = STATUS_COLORS[status];
  return (
    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}1A` }]}>
      <ThemedText
        type="small"
        fontWeight="700"
        style={{ color: statusColor }}
        numberOfLines={1}
      >
        {STATUS_LABELS[status]}
      </ThemedText>
    </View>
  );
}

function eventTitle(event: TicketTimelineEvent): string {
  if (event.type === 'created') return 'Ticket created';
  if (event.type === 'reopened') return 'Ticket reopened';
  if (event.type === 'status_change') {
    return event.toStatus ? `Status changed to ${STATUS_LABELS[event.toStatus]}` : 'Status changed';
  }
  return event.actorRole === 'admin' ? 'Admin comment' : 'Comment';
}

function TimelineEventCard({ event }: { event: TicketTimelineEvent }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.timelineCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.timelineHeader}>
        <ThemedText fontWeight="700" style={styles.timelineTitle}>
          {eventTitle(event)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatTicketDate(event.createdAt)}
        </ThemedText>
      </View>
      {event.actorName ? (
        <ThemedText type="small" themeColor="textSecondary">
          {event.actorRole === 'admin' ? 'Admin' : 'You'} · {event.actorName}
        </ThemedText>
      ) : null}
      {event.message ? (
        <ThemedText themeColor="textSecondary" style={styles.timelineMessage}>
          {event.message}
        </ThemedText>
      ) : null}
      {event.attachments.length > 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          {event.attachments.length} attachment
          {event.attachments.length === 1 ? '' : 's'}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
    paddingBottom: 40,
    paddingTop: Spacing.four,
  },
  sheetContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  sheetTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  field: { gap: Spacing.one },
  input: {
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: HAIRLINE,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  messageInput: {
    minHeight: 132,
  },
  commentInput: {
    minHeight: 96,
  },
  attachButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderCurve: 'continuous',
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 56,
    paddingHorizontal: Spacing.three,
  },
  attachHint: {
    marginLeft: 'auto',
  },
  attachLabel: {
    flex: 1,
  },
  attachment: {
    alignItems: 'center',
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: HAIRLINE,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 72,
    padding: Spacing.one,
  },
  attachmentThumb: {
    borderRadius: 10,
    height: 56,
    width: 56,
  },
  attachmentInfo: {
    flex: 1,
    gap: 2,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  submitButton: {
    marginTop: Spacing.one,
  },
  createButton: {
    marginTop: Spacing.one,
  },
  createButtonText: {
    fontSize: 15,
    lineHeight: 21,
  },
  disabled: {
    opacity: 0.5,
  },
  errorBox: {
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: HAIRLINE,
    gap: 2,
    padding: Spacing.two,
  },
  errorText: {
    color: Brand.accent,
  },
  loadingRow: {
    alignItems: 'center',
    minHeight: 28,
  },
  ticketList: {
    gap: Spacing.two,
  },
  ticketCard: {
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: HAIRLINE,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  detailTitleBlock: {
    flex: 1,
    gap: Spacing.one,
    paddingRight: Spacing.two,
  },
  timeline: {
    gap: Spacing.two,
  },
  timelineCard: {
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: HAIRLINE,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  timelineHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  timelineTitle: {
    flex: 1,
  },
  timelineMessage: {
    lineHeight: 20,
  },
  ticketTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  ticketTitle: {
    flex: 1,
  },
  statusBadge: {
    borderRadius: 999,
    maxWidth: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ticketMeta: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  adminNote: {
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: HAIRLINE,
    gap: 2,
    marginTop: Spacing.one,
    padding: Spacing.two,
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: 14,
    borderCurve: 'continuous',
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: Spacing.two,
    justifyContent: 'center',
    minHeight: 104,
    padding: Spacing.three,
  },
});
