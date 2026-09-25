"use server";

import type { SupportTicket } from "@fitness/types";
import { revalidatePath } from "next/cache";

import { ApiError, apiFetch } from "@/lib/api";

export interface TicketReviewState {
  error?: string;
  success?: boolean;
}

export async function updateTicketAction(
  _prevState: TicketReviewState,
  formData: FormData,
): Promise<TicketReviewState> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const adminNote = String(formData.get("adminNote") ?? "").trim();

  if (!id || !status) return { error: "Missing ticket status." };

  try {
    await apiFetch<SupportTicket>(`/tickets/admin/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        adminNote: adminNote || undefined,
      }),
    });
  } catch (error) {
    return {
      error:
        error instanceof ApiError
          ? error.message
          : "Could not update ticket.",
    };
  }

  revalidatePath("/tickets");
  return { success: true };
}
