"use client";

import type { Plan } from "@fitness/types";
import { Check, Edit, Plus, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";

import { CustomDropdown } from "@/components/custom-dropdown";
import { createPlanAction, deletePlanAction, updatePlanAction } from "@/lib/plan-actions";

interface PlanManagementClientProps {
  plans: Plan[];
}

export function PlanManagementClient({ plans }: PlanManagementClientProps) {
  const [isPending, startTransition] = useTransition();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("monthly");
  const [durationDays, setDurationDays] = useState<number | "">(30);
  const [price, setPrice] = useState<number | "">(9.99);
  const [currency, setCurrency] = useState("USD");
  const [storeProductId, setStoreProductId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [benefits, setBenefits] = useState<string[]>([
    "Unlimited AI Chat Assistant",
    "Advanced Workout Analytics",
    "Custom Exercise Creation",
  ]);
  const [newBenefitInput, setNewBenefitInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingPlan(null);
    setName("");
    setDescription("");
    setDuration("monthly");
    setDurationDays(30);
    setPrice(9.99);
    setCurrency("USD");
    setStoreProductId("com.fitness.pro.monthly");
    setIsActive(true);
    setBenefits([
      "Unlimited AI Chat Assistant",
      "Advanced Workout Analytics",
      "Custom Exercise Creation",
    ]);
    setNewBenefitInput("");
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setDescription(plan.description ?? "");
    setDuration(plan.duration);
    setDurationDays(plan.durationDays ?? "");
    setPrice(plan.price);
    setCurrency(plan.currency);
    setStoreProductId(plan.storeProductId ?? "");
    setIsActive(plan.isActive);
    setBenefits(plan.benefits ?? []);
    setNewBenefitInput("");
    setError(null);
    setIsModalOpen(true);
  };

  const handleAddBenefit = () => {
    if (!newBenefitInput.trim()) return;
    setBenefits([...benefits, newBenefitInput.trim()]);
    setNewBenefitInput("");
  };

  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Plan name is required");
      return;
    }

    const currentBenefits = [...benefits];
    if (newBenefitInput.trim() && !currentBenefits.includes(newBenefitInput.trim())) {
      currentBenefits.push(newBenefitInput.trim());
    }

    startTransition(async () => {
      try {
        const payload = {
          name: name.trim(),
          description: description.trim() || undefined,
          duration: duration.trim(),
          durationDays: typeof durationDays === "number" ? durationDays : undefined,
          price: Number(price) || 0,
          currency: currency.trim() || "USD",
          storeProductId: storeProductId.trim() || undefined,
          isActive,
          benefits: currentBenefits.filter((b) => b.trim().length > 0),
        };

        if (editingPlan) {
          await updatePlanAction(editingPlan.id, payload);
        } else {
          await createPlanAction(payload);
        }

        setIsModalOpen(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to save plan");
      }
    });
  };

  const handleDelete = (planId: string) => {
    startTransition(async () => {
      try {
        await deletePlanAction(planId);
        setDeletingPlan(null);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete plan");
      }
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Subscription Plans</h1>
          <p className="text-sm text-neutral-500">
            Manage premium tier subscription plans for app users & RevenueCat/Play Store sync
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition"
        >
          <Plus size={16} />
          Create Plan
        </button>
      </div>

      {/* Plans List Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition ${
              plan.isActive ? "border-neutral-200" : "border-neutral-200 opacity-60 bg-neutral-50/50"
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">{plan.name}</h3>
                  <p className="text-xs text-neutral-500 capitalize mt-0.5">{plan.duration} Plan</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    plan.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {plan.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="my-4">
                <span className="text-3xl font-extrabold text-neutral-900">
                  {plan.currency === "USD" ? "$" : plan.currency} {plan.price}
                </span>
                <span className="text-xs text-neutral-500"> / {plan.duration}</span>
              </div>

              {plan.description ? (
                <p className="text-xs text-neutral-600 mb-4">{plan.description}</p>
              ) : null}

              {plan.storeProductId ? (
                <div className="mb-4 rounded-lg bg-neutral-100 px-3 py-1.5 text-[11px] font-mono text-neutral-600">
                  <span className="text-neutral-400 font-sans">Store ID: </span>
                  {plan.storeProductId}
                </div>
              ) : null}

              <div className="space-y-2 border-t border-neutral-100 pt-4">
                <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Benefits ({plan.benefits.length})
                </p>
                <ul className="space-y-1.5 text-xs text-neutral-600">
                  {plan.benefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-600 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                  {plan.benefits.length === 0 ? (
                    <li className="text-neutral-400 italic">No benefits listed</li>
                  ) : null}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              <button
                onClick={() => openEditModal(plan)}
                className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <Edit size={14} />
                Edit
              </button>
              <button
                onClick={() => setDeletingPlan(plan)}
                className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ))}

        {plans.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 p-12 text-center">
            <h3 className="text-sm font-semibold text-neutral-700">No premium plans created</h3>
            <p className="mt-1 text-xs text-neutral-500">
              Create subscription plans to offer premium features to users.
            </p>
            <button
              onClick={openCreateModal}
              className="cursor-pointer mt-4 inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              <Plus size={16} />
              Create First Plan
            </button>
          </div>
        ) : null}
      </div>

      {/* Create / Edit Plan Modal */}
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                {editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600">
                  {error}
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pro Monthly, Annual VIP"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short summary of this plan"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Duration Label *
                  </label>
                  <CustomDropdown
                    options={[
                      { value: "monthly", label: "Monthly", sublabel: "Billed monthly (e.g. 30 days)" },
                      { value: "yearly", label: "Yearly", sublabel: "Billed annually (e.g. 365 days)" },
                      { value: "weekly", label: "Weekly", sublabel: "Billed weekly (e.g. 7 days)" },
                      { value: "lifetime", label: "Lifetime", sublabel: "One-time payment non-expiring" },
                    ]}
                    value={duration}
                    onChange={(val) => setDuration(val)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Duration in Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={durationDays}
                    onChange={(e) =>
                      setDurationDays(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="e.g. 30, 365"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="e.g. 9.99"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    placeholder="USD"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Store Product ID (Play Store / RevenueCat / App Store)
                </label>
                <input
                  type="text"
                  value={storeProductId}
                  onChange={(e) => setStoreProductId(e.target.value)}
                  placeholder="com.fitness.pro.monthly"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono text-neutral-900 outline-none focus:border-neutral-900"
                />
              </div>

              {/* Dynamic Benefits Array Input */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-neutral-700">
                  Plan Benefits / Features
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBenefitInput}
                    onChange={(e) => setNewBenefitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddBenefit();
                      }
                    }}
                    placeholder="Add a benefit (e.g. Unlimited AI Chat)"
                    className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="cursor-pointer rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-200"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 pt-1">
                  {benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-800"
                    >
                      <span className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-600" />
                        {benefit}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(index)}
                        className="cursor-pointer text-neutral-400 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="cursor-pointer h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span className="text-xs font-medium text-neutral-700">
                    Plan is Active and available for subscription
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="cursor-pointer rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? "Saving..." : editingPlan ? "Save Changes" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      {deletingPlan ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-neutral-900">Delete Plan</h3>
            <p className="mt-2 text-xs text-neutral-600">
              Are you sure you want to delete <strong className="text-neutral-900">{deletingPlan.name}</strong>? Any users currently assigned to this plan will revert to unlinked plans.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingPlan(null)}
                className="cursor-pointer rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingPlan.id)}
                disabled={isPending}
                className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Deleting..." : "Delete Plan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
