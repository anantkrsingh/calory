"use client";

import type { Plan, User } from "@fitness/types";
import { AlertCircle, Calendar, CreditCard, Sparkles, User as UserIcon, X } from "lucide-react";
import { useState, useTransition } from "react";

import { CustomDatePicker } from "@/components/custom-date-picker";
import { CustomDropdown, type CustomDropdownOption } from "@/components/custom-dropdown";
import { updateUserAction } from "@/lib/user-actions";

interface EditUserModalProps {
  user: User | null;
  plans: Plan[];
  defaultCredits: number;
  isOpen: boolean;
  onClose: () => void;
}

export function EditUserModal({
  user,
  plans,
  defaultCredits,
  isOpen,
  onClose,
}: EditUserModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form states - declared unconditionally at top level
  const [totalCredits, setTotalCredits] = useState<number>(
    user?.totalCredits ?? defaultCredits,
  );
  const [remainingCredits, setRemainingCredits] = useState<number>(
    user?.remainingCredits ?? defaultCredits,
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    user?.planId ?? "",
  );
  const [customPlanName, setCustomPlanName] = useState<string>(
    user?.planName ?? "",
  );
  const [planExpiresAt, setPlanExpiresAt] = useState<string>(
    user?.planExpiresAt ? user.planExpiresAt.split("T")[0] : "",
  );
  const [role, setRole] = useState<"user" | "admin">(user?.role ?? "user");
  const [emailVerified, setEmailVerified] = useState<boolean>(
    user?.emailVerified ?? false,
  );

  // State is re-initialized from the `user` prop by the `key={user.id}` the
  // caller puts on this component, so it remounts fresh per user instead of
  // syncing via an effect (see user-table-client.tsx).

  // Early return AFTER all hooks
  if (!isOpen || !user) return null;

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    if (planId === "custom") {
      // keep current custom name
    } else if (planId === "") {
      setCustomPlanName("");
    } else {
      const selected = plans.find((p) => p.id === planId);
      if (selected) {
        setCustomPlanName(selected.name);
        // Auto-calculate expiration date based on plan duration if not set
        if (selected.durationDays && !planExpiresAt) {
          const exp = new Date();
          exp.setDate(exp.getDate() + selected.durationDays);
          setPlanExpiresAt(exp.toISOString().split("T")[0]);
        }
      }
    }
  };

  const handleResetToDefaultCredits = () => {
    setTotalCredits(defaultCredits);
    setRemainingCredits(defaultCredits);
    setError(null);
  };

  const handleTotalCreditsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = raw.replace(/^0+(?=\d)/, "");
    const val = sanitized === "" ? 0 : Math.max(0, parseInt(sanitized, 10) || 0);
    setTotalCredits(val);
    setError(null);
  };

  const handleRemainingCreditsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = raw.replace(/^0+(?=\d)/, "");
    const val = sanitized === "" ? 0 : Math.max(0, parseInt(sanitized, 10) || 0);
    setRemainingCredits(val);
    setError(null);
  };

  const isRemainingExceeded = remainingCredits > totalCredits;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (remainingCredits > totalCredits) {
      setError("Remaining credits cannot exceed total credits.");
      return;
    }

    startTransition(async () => {
      try {
        const planName =
          selectedPlanId === "custom"
            ? customPlanName
            : selectedPlanId
            ? plans.find((p) => p.id === selectedPlanId)?.name ?? customPlanName
            : null;

        await updateUserAction(user.id, {
          role,
          emailVerified,
          totalCredits: Number(totalCredits),
          remainingCredits: Number(remainingCredits),
          planId: selectedPlanId && selectedPlanId !== "custom" ? selectedPlanId : null,
          planName: planName || null,
          planExpiresAt: planExpiresAt ? new Date(planExpiresAt).toISOString() : null,
        });

        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to update user");
      }
    });
  };

  // Build custom dropdown options for plans
  const planDropdownOptions: CustomDropdownOption[] = [
    { value: "", label: "No Active Plan (Free)", sublabel: "Basic free tier user" },
    ...plans.map((p) => ({
      value: p.id,
      label: p.name,
      sublabel: `${p.currency === "USD" ? "$" : p.currency}${p.price} / ${p.duration}`,
    })),
    { value: "custom", label: "Custom Plan", sublabel: "Specify a custom plan name" },
  ];

  // Build custom dropdown options for role
  const roleDropdownOptions: CustomDropdownOption[] = [
    { value: "user", label: "User", sublabel: "Standard app client access" },
    { value: "admin", label: "Admin", sublabel: "Full admin panel access" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-xl relative">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-800">
              <UserIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Edit User</h2>
              <p className="text-xs text-neutral-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-5">
          {error ? (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* User Chat Credits */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-neutral-900 text-sm">
                <Sparkles size={16} className="text-amber-500" />
                <span>AI Chat Credits</span>
              </div>
              <button
                type="button"
                onClick={handleResetToDefaultCredits}
                className="cursor-pointer text-xs text-neutral-600 hover:text-neutral-900 underline font-medium"
              >
                Reset to Default ({defaultCredits})
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Total Credits
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalCredits}
                  onFocus={(e) => e.target.select()}
                  onChange={handleTotalCreditsChange}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900 shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Remaining Credits
                </label>
                <input
                  type="number"
                  min="0"
                  value={remainingCredits}
                  onFocus={(e) => e.target.select()}
                  onChange={handleRemainingCreditsChange}
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none shadow-xs ${
                    isRemainingExceeded
                      ? "border-red-500 text-red-600 focus:border-red-600"
                      : "border-neutral-200 text-neutral-900 focus:border-neutral-900"
                  }`}
                />
              </div>
            </div>

            {isRemainingExceeded ? (
              <p className="mt-2 text-[11px] font-medium text-red-600 flex items-center gap-1">
                <AlertCircle size={13} />
                <span>Remaining credits cannot exceed total credits ({totalCredits})</span>
              </p>
            ) : null}
          </div>

          {/* Premium Plan & Expiry */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-4">
            <div className="flex items-center gap-2 font-medium text-neutral-900 text-sm">
              <CreditCard size={16} className="text-indigo-500" />
              <span>Subscription Plan</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Select Plan
              </label>
              <CustomDropdown
                options={planDropdownOptions}
                value={selectedPlanId}
                onChange={handlePlanChange}
                placeholder="Select Plan"
              />
            </div>

            {selectedPlanId === "custom" ? (
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Custom Plan Name
                </label>
                <input
                  type="text"
                  value={customPlanName}
                  onChange={(e) => setCustomPlanName(e.target.value)}
                  placeholder="e.g. VIP Enterprise Plan"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900 shadow-xs"
                />
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1 flex items-center gap-1">
                <Calendar size={13} />
                <span>Plan Expires On</span>
              </label>
              <CustomDatePicker
                dropUp
                value={planExpiresAt}
                onChange={(dateStr) => setPlanExpiresAt(dateStr)}
                placeholder="Select expiration date"
              />
              <p className="mt-1 text-[11px] text-neutral-500">
                Leave empty for non-expiring or lifetime plans.
              </p>
            </div>
          </div>

          {/* Account Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                User Role
              </label>
              <CustomDropdown
                dropUp
                options={roleDropdownOptions}
                value={role}
                onChange={(val) => setRole(val as "user" | "admin")}
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={emailVerified}
                  onChange={(e) => setEmailVerified(e.target.checked)}
                  className="cursor-pointer h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <span className="text-xs font-medium">Email Verified</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || isRemainingExceeded}
              className="cursor-pointer rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
