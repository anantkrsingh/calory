/**
 * BullMQ Queue Constants
 */

// Injection token for queue provider
import { Queue } from 'bullmq';

export const BULL_QUEUE_PROVIDER = Symbol('BULL_QUEUE_PROVIDER');

export type QueueProvider = (name: string) => Queue;
