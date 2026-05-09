import { useState, useEffect, useRef, useCallback } from "react";
import {
  searchLocalPOIs,
  fetchPhotonResults,
  type LocationResult,
} from "../lib/locationSearch";
import type { GeoCoords } from "./map/useGeolocation";

// ─── Props ────────────────────────────────────────────────────────────────────

interface LocationSearchInputProps {
  /** Label shown above the input (e.g. "PICKUP LOCATION" or "DESTINATION") */
  label: string;

  /** Placeholder text inside the input */
  placeholder?: string;

  /** Controlled value — the human-readable address string */
  value: string;

  /** Called when the user picks a result. Provides both display label and coords. */
  onSelect: (label: string, coords: GeoCoords) => void;

  /** Called on every keystroke so parent can keep label in sync */
  onChange?: (value: string) => void;

  /** User's live GPS coords (or CIT-U fallback) from useGeolocation() */
  biasCoords: GeoCoords;

  /** Optional prefix icon slot */
  icon?: React.ReactNode;

  /** Optional extra className on the wrapper */
  className?: string;
}

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

// ─── Local-only icon (pin or search marker) ───────────────────────────────────

function CampusIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 mt-0.5">
      <rect x="1" y="1" width="8" height="8" rx="1" fill="#10b981" opacity="0.15" />
      <path d="M5 2.5L5 7.5M2.5 5L7.5 5" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 mt-0.5">
      <circle cx="5" cy="5" r="3.5" stroke="#2563eb" strokeWidth="0.9" />
      <path d="M5 1.5C5 1.5 6.5 3 6.5 5C6.5 7 5 8.5 5 8.5" stroke="#2563eb" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M5 1.5C5 1.5 3.5 3 3.5 5C3.5 7 5 8.5 5 8.5" stroke="#2563eb" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M1.5 5H8.5" stroke="#2563eb" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LocationSearchInput({
  label,
  placeholder = "Search location...",
  value,
  onSelect,
  onChange,
  biasCoords,
  icon,
  className = "",
}: LocationSearchInputProps) {
  const [inputValue, setInputValue]   = useState(value);
  const [results, setResults]         = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen]           = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightIdx, setHighlight]  = useState(-1);
  const wrapperRef                    = useRef<HTMLDivElement>(null);
  const inputRef                      = useRef<HTMLInputElement>(null);

  // Sync controlled value from parent (e.g. when parent resets it)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const debouncedQuery = useDebounce(inputValue, 300);

  // ── Layer 1 + Layer 2: Search ─────────────────────────────────────────────
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q || q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      // Layer 1 — instant local POI match
      const local = searchLocalPOIs(q);

      if (local.length > 0) {
        // Local results found: show immediately, no network call needed
        if (!cancelled) {
          setResults(local);
          setIsOpen(true);
          setIsSearching(false);
        }
      } else {
        // Layer 2 — debounced Photon API with dynamic location bias
        setIsSearching(true);
        try {
          const remote = await fetchPhotonResults(q, biasCoords, 6);
          if (!cancelled) {
            setResults(remote);
            setIsOpen(remote.length > 0);
          }
        } catch {
          // Silently fail — don't crash the UI on network errors
          if (!cancelled) setResults([]);
        } finally {
          if (!cancelled) setIsSearching(false);
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [debouncedQuery, biasCoords]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlight(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Input handlers ─────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    setHighlight(-1);
    onChange?.(v);
  };

  const handleSelect = useCallback(
    (result: LocationResult) => {
      setInputValue(result.label);
      setIsOpen(false);
      setResults([]);
      setHighlight(-1);
      onChange?.(result.label);
      onSelect(result.label, result.coords);
      inputRef.current?.blur();
    },
    [onSelect, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIdx]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlight(-1);
    }
  };

  const handleFocus = () => {
    if (results.length > 0) setIsOpen(true);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Label */}
      <p className="font-mono text-[8px] text-[#6a7282] tracking-[1px] mb-1">{label}</p>

      {/* Input row */}
      <div className="border border-[#d1d5dc] flex items-center gap-2 px-2 h-[34px] focus-within:border-black transition-colors">
        {icon && <span className="shrink-0">{icon}</span>}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="flex-1 font-mono text-[10px] text-black bg-transparent outline-none tracking-[0.3px] placeholder:text-[#d1d5dc]"
        />
        {/* Searching spinner */}
        {isSearching && (
          <svg
            className="shrink-0 animate-spin text-[#99a1af]"
            width="10" height="10" viewBox="0 0 24 24" fill="none"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <ul
          className="absolute z-[600] top-full left-0 right-0 bg-white border border-[#e5e7eb] shadow-lg overflow-hidden"
          style={{ marginTop: "2px", maxHeight: "220px", overflowY: "auto" }}
          role="listbox"
        >
          {results.map((r, i) => (
            <li
              key={r.id}
              role="option"
              aria-selected={i === highlightIdx}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(r); }}
              className={`flex items-start gap-2 px-3 py-2 cursor-pointer transition-colors ${
                i === highlightIdx ? "bg-[#f3f4f6]" : "hover:bg-[#f9f9f9]"
              } ${i !== results.length - 1 ? "border-b border-[#f3f4f6]" : ""}`}
            >
              {/* Source badge icon */}
              <span className="mt-[1px]">
                {r.source === "local" ? <CampusIcon /> : <GlobeIcon />}
              </span>

              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] text-black truncate">{r.label}</p>
                {r.sublabel && (
                  <p className="font-mono text-[8px] text-[#99a1af] truncate mt-0.5">
                    {r.sublabel}
                  </p>
                )}
              </div>

              {/* Source label */}
              <span
                className={`shrink-0 font-mono text-[7px] px-1 py-0.5 self-center ${
                  r.source === "local"
                    ? "bg-[#d1fae5] text-[#065f46]"
                    : "bg-[#dbeafe] text-[#1e40af]"
                }`}
              >
                {r.source === "local" ? "CAMPUS" : "MAP"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
