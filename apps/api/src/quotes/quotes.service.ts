import { Injectable, NotFoundException } from '@nestjs/common';
import { toDailyQuote } from '@fitness/db';
import type { DailyQuote } from '@fitness/types';

import { PrismaService } from '../prisma/prisma.service';

/** UTC calendar date, so every client agrees on which day a quote belongs to. */
export const todayIso = (now: Date = new Date()): string =>
  now.toISOString().slice(0, 10);

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Today's quote, falling back to the most recent one if today's is not generated yet. */
  async today(): Promise<DailyQuote> {
    const date = todayIso();

    const quote =
      (await this.prisma.dailyQuote.findUnique({ where: { date } })) ??
      (await this.prisma.dailyQuote.findFirst({ orderBy: { date: 'desc' } }));

    if (!quote) throw new NotFoundException('No quote available yet');

    return toDailyQuote(quote);
  }
}
