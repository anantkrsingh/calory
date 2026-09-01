export const ACCOUNT_DELETION_QUEUE_NAME = 'account-deletion';

/** Result of one sweep of the account-deletion cron. */
export interface AccountDeletionSweepResult {
  /** Accounts past their grace period and hard-deleted this run. */
  deleted: number;
}
