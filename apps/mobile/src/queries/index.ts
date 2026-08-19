export {
  AuthQueries,
  useChangePassword,
  useLogin,
  useLogout,
  useMe,
  useRegister,
  useVerifyRegistration,
} from './auth.queries';
export {
  ChatsQueries,
  useChat,
  useChats,
  useCreateChat,
  useDeleteChat,
  useStreamChatMessage,
  useUpdateChat,
} from './chats.queries';
export { useCreateMeasurement } from './measurements.queries';
export { useSendOtp, useResendOtp, useVerifyOtp } from './otp.queries';
export { QuotesQueries, useTodayQuote } from './quotes.queries';
export { useUpdateProfile } from './users.queries';
export {
  WorkoutRoutinesQueries,
  useTodayCalories,
} from './workout-routines.queries';
