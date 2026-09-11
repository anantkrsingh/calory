"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

interface PickedUser {
  id: string;
  email: string;
  displayName: string;
}

interface UserPickerProps {
  selected: PickedUser[];
  onChange: (users: PickedUser[]) => void;
}

/** Type-ahead search (debounced, via the same-origin `/api/users/search`
 * proxy) plus a list of picked recipients, for targeting specific users. */
export function UserPicker({ selected, onChange }: UserPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Nothing to clear here: the dropdown below only renders once the query
    // is 2+ chars, so a stale `results` value while it's short is never seen.
    if (query.trim().length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/users/search?search=${encodeURIComponent(query.trim())}`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((users: PickedUser[]) => setResults(users))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const selectedIds = new Set(selected.map((u) => u.id));

  const add = (user: PickedUser) => {
    if (selectedIds.has(user.id)) return;
    onChange([...selected, user]);
    setQuery("");
    setResults([]);
  };

  const remove = (id: string) => {
    onChange(selected.filter((u) => u.id !== id));
  };

  return (
    <div>
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email or name"
          className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-neutral-900"
        />
      </div>

      {query.trim().length >= 2 ? (
        <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
          {loading ? (
            <div className="px-3 py-2 text-sm text-neutral-400">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-neutral-400">No matches</div>
          ) : (
            results.map((user) => (
              <button
                type="button"
                key={user.id}
                onClick={() => add(user)}
                disabled={selectedIds.has(user.id)}
                className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="font-medium text-neutral-900">{user.displayName}</span>
                <span className="text-xs text-neutral-500">{user.email}</span>
              </button>
            ))
          )}
        </div>
      ) : null}

      {selected.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selected.map((user) => (
            <span
              key={user.id}
              className="inline-flex items-center gap-1 rounded-full bg-neutral-100 py-1 pl-2.5 pr-1.5 text-xs font-medium text-neutral-700"
            >
              {user.displayName || user.email}
              <button
                type="button"
                onClick={() => remove(user.id)}
                className="cursor-pointer rounded-full p-0.5 hover:bg-neutral-200"
                aria-label={`Remove ${user.email}`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-neutral-400">
          Search and pick at least one recipient.
        </p>
      )}
    </div>
  );
}
