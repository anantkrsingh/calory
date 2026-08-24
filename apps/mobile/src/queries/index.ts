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
  useChatDetail,
  useChats,
  useCreateChat,
  useDeleteChat,
  useUpdateChat,
} from './chats.queries';
export { useCreateMeasurement } from './measurements.queries';
export { useSendOtp, useResendOtp, useVerifyOtp } from './otp.queries';
export { QuotesQueries, useTodayQuote } from './quotes.queries';
export {
  StepsQueries,
  useDailySteps,
  useStepsRange,
  useUpsertSteps,
} from './steps.queries';
export { useUpdateProfile, useUploadAvatar } from './users.queries';
export {
  WorkoutRoutinesQueries,
  useTodayCalories,
} from './workout-routines.queries';
