"use client";

import type { Exercise } from "@fitness/types";
import {
  Equipment,
  ExerciseCategory,
  MuscleGroup,
} from "@fitness/types";
import type { ExerciseInstructionStepInput } from "@fitness/validation";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  ImagePlus,
  Images,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { CustomDropdown } from "@/components/custom-dropdown";
import {
  createExerciseAction,
  deleteExerciseAction,
  getUploadSignatureAction,
  updateExerciseAction,
} from "@/lib/exercise-actions";

const MAX_GALLERY_IMAGES = 10;
const MAX_STEPS = 20;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** A step being edited in the form — same shape the API expects, generated
 * client-side so a brand-new step has a stable id before it's ever saved. */
type StepDraft = ExerciseInstructionStepInput;

function newStepDraft(order: number): StepDraft {
  return { id: crypto.randomUUID(), order, text: "", image: undefined };
}

function labelize(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const CATEGORY_OPTIONS = Object.values(ExerciseCategory).map((value) => ({
  value,
  label: labelize(value),
}));

const EQUIPMENT_OPTIONS = Object.values(Equipment).map((value) => ({
  value,
  label: labelize(value),
}));

const MUSCLE_OPTIONS = Object.values(MuscleGroup).map((value) => ({
  value,
  label: labelize(value),
}));

interface ExerciseManagementClientProps {
  exercises: Exercise[];
  total: number;
  page: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  search?: string;
}

function buildQuery(page: number, search?: string): string {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (search) params.set("search", search);
  return params.toString();
}

/**
 * Uploads straight from the browser to Cloudinary using a short-lived
 * signature from the API (admin-only) — the file bytes never pass through
 * our Next.js or API servers.
 */
async function uploadFile(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`"${file.name}" is larger than 5MB`);
  }
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    throw new Error(`"${file.name}" must be JPEG, PNG, WebP, or GIF`);
  }

  const { cloudName, apiKey, timestamp, signature, folder } = await getUploadSignatureAction();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error?.message ?? `Upload failed with ${response.status}`);
  }

  return body.secure_url as string;
}

export function ExerciseManagementClient({
  exercises,
  total,
  page,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  search,
}: ExerciseManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(ExerciseCategory.Strength);
  const [equipment, setEquipment] = useState<string>(Equipment.Barbell);
  const [primaryMuscles, setPrimaryMuscles] = useState<string[]>([MuscleGroup.Chest]);
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const [images, setImages] = useState<string[]>([]);
  const [steps, setSteps] = useState<StepDraft[]>([]);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null);
  const [galleryPickerStepId, setGalleryPickerStepId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const stepInputRef = useRef<HTMLInputElement>(null);

  const openCreateModal = () => {
    setEditingExercise(null);
    setName("");
    setCategory(ExerciseCategory.Strength);
    setEquipment(Equipment.Barbell);
    setPrimaryMuscles([MuscleGroup.Chest]);
    setSecondaryMuscles([]);
    setInstructions("");
    setThumbnail(undefined);
    setImages([]);
    setSteps([]);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setName(exercise.name);
    setCategory(exercise.category);
    setEquipment(exercise.equipment);
    setPrimaryMuscles([...exercise.primaryMuscles]);
    setSecondaryMuscles([...exercise.secondaryMuscles]);
    setInstructions(exercise.instructions ?? "");
    setThumbnail(exercise.thumbnail);
    setImages([...(exercise.images ?? [])]);
    setSteps(
      [...(exercise.instructionSteps ?? [])]
        .sort((a, b) => a.order - b.order)
        .map((step) => ({ ...step })),
    );
    setError(null);
    setIsModalOpen(true);
  };

  const toggleMuscle = (
    muscle: string,
    list: string[],
    setList: (next: string[]) => void,
  ) => {
    if (list.includes(muscle)) {
      setList(list.filter((m) => m !== muscle));
    } else {
      setList([...list, muscle]);
    }
  };

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setUploadingThumbnail(true);
    try {
      const url = await uploadFile(file);
      setThumbnail(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload thumbnail");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const remaining = MAX_GALLERY_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`You can upload at most ${MAX_GALLERY_IMAGES} gallery images`);
      return;
    }

    const toUpload = files.slice(0, remaining);
    setError(null);
    setUploadingGallery(true);
    try {
      const urls: string[] = [];
      for (const file of toUpload) {
        urls.push(await uploadFile(file));
      }
      setImages((prev) => [...prev, ...urls]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload images");
    } finally {
      setUploadingGallery(false);
    }
  };

  const addStep = () => {
    if (steps.length >= MAX_STEPS) {
      setError(`You can add at most ${MAX_STEPS} steps`);
      return;
    }
    setSteps((prev) => [...prev, newStepDraft(prev.length)]);
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((step) => step.id !== id));
    if (galleryPickerStepId === id) setGalleryPickerStepId(null);
  };

  const updateStepText = (id: string, text: string) => {
    setSteps((prev) => prev.map((step) => (step.id === id ? { ...step, text } : step)));
  };

  const setStepImage = (id: string, image: string | undefined) => {
    setSteps((prev) => prev.map((step) => (step.id === id ? { ...step, image } : step)));
  };

  const moveStep = (id: string, direction: -1 | 1) => {
    setSteps((prev) => {
      const index = prev.findIndex((step) => step.id === id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const openStepUpload = (id: string) => {
    setGalleryPickerStepId(null);
    setUploadingStepId(id);
    stepInputRef.current?.click();
  };

  const handleStepImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const stepId = uploadingStepId;
    if (!file || !stepId) {
      setUploadingStepId(null);
      return;
    }

    setError(null);
    try {
      const url = await uploadFile(file);
      setStepImage(stepId, url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload step image");
    } finally {
      setUploadingStepId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Exercise name is required");
      return;
    }
    if (primaryMuscles.length === 0) {
      setError("Pick at least one primary muscle");
      return;
    }
    if (steps.some((step) => !step.text.trim())) {
      setError("Every step needs text, or remove the empty one");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          name: name.trim(),
          category: category as (typeof ExerciseCategory)[keyof typeof ExerciseCategory],
          equipment: equipment as (typeof Equipment)[keyof typeof Equipment],
          primaryMuscles: primaryMuscles as Array<
            (typeof MuscleGroup)[keyof typeof MuscleGroup]
          >,
          secondaryMuscles: secondaryMuscles as Array<
            (typeof MuscleGroup)[keyof typeof MuscleGroup]
          >,
          instructions: instructions.trim() || undefined,
          instructionSteps: steps.map((step, index) => ({
            ...step,
            order: index,
            text: step.text.trim(),
          })),
          thumbnail: thumbnail ?? null,
          images,
        };

        if (editingExercise) {
          await updateExerciseAction(editingExercise.id, payload);
        } else {
          await createExerciseAction(payload);
        }

        setIsModalOpen(false);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to save exercise");
      }
    });
  };

  const handleDelete = (exerciseId: string) => {
    startTransition(async () => {
      try {
        await deleteExerciseAction(exerciseId);
        setDeletingExercise(null);
        router.refresh();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete exercise");
      }
    });
  };

  const isUploading = uploadingThumbnail || uploadingGallery;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Exercises</h1>
          <p className="text-sm text-neutral-500">{total} total in the catalogue</p>
        </div>
        <div className="flex items-center gap-2">
          <form method="get" className="flex gap-2">
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search by name"
              className="w-64 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Search
            </button>
          </form>
          <button
            type="button"
            onClick={openCreateModal}
            className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition"
          >
            <Plus size={16} />
            Create Exercise
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Exercise</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Equipment</th>
              <th className="px-4 py-3">Primary muscles</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exercises.map((exercise) => (
              <tr key={exercise.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {exercise.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={exercise.thumbnail}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover border border-neutral-200"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400">
                        <ImagePlus size={16} />
                      </div>
                    )}
                    <span className="font-medium text-neutral-900">{exercise.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-600 capitalize">{labelize(exercise.category)}</td>
                <td className="px-4 py-3 text-neutral-600 capitalize">{labelize(exercise.equipment)}</td>
                <td className="px-4 py-3 text-neutral-600 capitalize">
                  {exercise.primaryMuscles.map(labelize).join(", ")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      exercise.isCustom
                        ? "bg-neutral-100 text-neutral-600"
                        : "bg-neutral-900 text-white"
                    }`}
                  >
                    {exercise.isCustom ? "Custom" : "Catalogue"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(exercise)}
                      className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingExercise(exercise)}
                      className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {exercises.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  No exercises found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {hasPreviousPage ? (
              <a
                href={`?${buildQuery(page - 1, search)}`}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
              >
                Previous
              </a>
            ) : null}
            {hasNextPage ? (
              <a
                href={`?${buildQuery(page + 1, search)}`}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
              >
                Next
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                {editingExercise ? "Edit Exercise" : "Create Exercise"}
              </h2>
              <button
                type="button"
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
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Barbell Back Squat"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-700">
                    Category *
                  </label>
                  <CustomDropdown
                    options={CATEGORY_OPTIONS}
                    value={category}
                    onChange={setCategory}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-700">
                    Equipment *
                  </label>
                  <CustomDropdown
                    options={EQUIPMENT_OPTIONS}
                    value={equipment}
                    onChange={setEquipment}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-neutral-700">
                  Primary muscles *
                </label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_OPTIONS.map((option) => {
                    const selected = primaryMuscles.includes(option.value);
                    return (
                      <button
                        key={`primary-${option.value}`}
                        type="button"
                        onClick={() =>
                          toggleMuscle(option.value, primaryMuscles, setPrimaryMuscles)
                        }
                        className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                          selected
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-neutral-700">
                  Secondary muscles
                </label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_OPTIONS.map((option) => {
                    const selected = secondaryMuscles.includes(option.value);
                    return (
                      <button
                        key={`secondary-${option.value}`}
                        type="button"
                        onClick={() =>
                          toggleMuscle(option.value, secondaryMuscles, setSecondaryMuscles)
                        }
                        className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                          selected
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Description
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  placeholder="Optional coaching cues or form notes"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs font-medium text-neutral-700">
                    Thumbnail
                  </label>
                  {thumbnail ? (
                    <button
                      type="button"
                      onClick={() => setThumbnail(undefined)}
                      className="cursor-pointer text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <p className="mb-2 text-[11px] text-neutral-400">
                  Max 5MB. JPEG/PNG are converted to WebP on upload.
                </p>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleThumbnailChange}
                />
                {thumbnail ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnail}
                      alt="Thumbnail preview"
                      className="h-28 w-28 rounded-xl border border-neutral-200 object-cover"
                    />
                    <button
                      type="button"
                      disabled={uploadingThumbnail}
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="cursor-pointer absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 text-xs font-medium text-white opacity-0 transition hover:bg-black/50 hover:opacity-100 disabled:cursor-not-allowed"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={uploadingThumbnail}
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="cursor-pointer flex h-28 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-sm text-neutral-600 hover:border-neutral-400 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingThumbnail ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <ImagePlus size={16} />
                        Upload thumbnail
                      </>
                    )}
                  </button>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs font-medium text-neutral-700">
                    Gallery images
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    {images.length}/{MAX_GALLERY_IMAGES} · max 5MB each
                  </span>
                </div>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={handleGalleryChange}
                />
                <div className="flex flex-wrap gap-2">
                  {images.map((url) => (
                    <div key={url} className="group relative h-20 w-20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="h-20 w-20 rounded-lg border border-neutral-200 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((item) => item !== url))}
                        className="cursor-pointer absolute -right-1.5 -top-1.5 rounded-full bg-neutral-900 p-1 text-white opacity-0 transition group-hover:opacity-100"
                        aria-label="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {images.length < MAX_GALLERY_IMAGES ? (
                    <button
                      type="button"
                      disabled={uploadingGallery}
                      onClick={() => galleryInputRef.current?.click()}
                      className="cursor-pointer flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-[11px] font-medium text-neutral-600 hover:border-neutral-400 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {uploadingGallery ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <Plus size={16} />
                          Add
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs font-medium text-neutral-700">
                    Steps
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    {steps.length}/{MAX_STEPS}
                  </span>
                </div>
                <p className="mb-2 text-[11px] text-neutral-400">
                  Step-by-step how-to — separate from the description above. Each
                  step can carry an image: upload a new one, or reuse one from the
                  gallery.
                </p>
                <input
                  ref={stepInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleStepImageChange}
                />
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={step.id} className="rounded-xl border border-neutral-200 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                          {index + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveStep(step.id, -1)}
                            disabled={index === 0}
                            className="cursor-pointer rounded-lg p-1 text-neutral-500 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label="Move step up"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStep(step.id, 1)}
                            disabled={index === steps.length - 1}
                            className="cursor-pointer rounded-lg p-1 text-neutral-500 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label="Move step down"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeStep(step.id)}
                            className="cursor-pointer rounded-lg p-1 text-red-500 hover:bg-red-50"
                            aria-label="Remove step"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={step.text}
                        onChange={(e) => updateStepText(step.id, e.target.value)}
                        rows={2}
                        placeholder="What should the athlete do in this step?"
                        className="mb-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                      />

                      {step.image ? (
                        <div className="relative inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={step.image}
                            alt=""
                            className="h-20 w-28 rounded-lg border border-neutral-200 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setStepImage(step.id, undefined)}
                            className="cursor-pointer absolute -right-1.5 -top-1.5 rounded-full bg-neutral-900 p-1 text-white"
                            aria-label="Remove step image"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={uploadingStepId === step.id}
                            onClick={() => openStepUpload(step.id)}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-dashed border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {uploadingStepId === step.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <ImagePlus size={13} />
                            )}
                            Upload image
                          </button>
                          {images.length > 0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setGalleryPickerStepId(
                                  galleryPickerStepId === step.id ? null : step.id,
                                )
                              }
                              className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50"
                            >
                              <Images size={13} />
                              Choose from gallery
                            </button>
                          ) : null}
                        </div>
                      )}

                      {galleryPickerStepId === step.id ? (
                        <div className="mt-2 flex flex-wrap gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                          {images.map((url) => (
                            <button
                              key={url}
                              type="button"
                              onClick={() => {
                                setStepImage(step.id, url);
                                setGalleryPickerStepId(null);
                              }}
                              className="cursor-pointer overflow-hidden rounded-lg border-2 border-transparent hover:border-neutral-900"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt="" className="h-14 w-14 object-cover" />
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                {steps.length < MAX_STEPS ? (
                  <button
                    type="button"
                    onClick={addStep}
                    className="cursor-pointer mt-2 inline-flex items-center gap-1 rounded-lg border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50"
                  >
                    <Plus size={14} />
                    Add step
                  </button>
                ) : null}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || isUploading}
                  className="cursor-pointer rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending
                    ? "Saving..."
                    : editingExercise
                      ? "Save Changes"
                      : "Create Exercise"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deletingExercise ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-neutral-900">Delete Exercise</h3>
            <p className="mt-2 text-xs text-neutral-600">
              Are you sure you want to delete{" "}
              <strong className="text-neutral-900">{deletingExercise.name}</strong>? This
              removes it from the shared catalogue.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingExercise(null)}
                className="cursor-pointer rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingExercise.id)}
                disabled={isPending}
                className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete Exercise"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
