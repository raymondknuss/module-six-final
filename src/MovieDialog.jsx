import { useEffect, useRef, useState } from "react";

export default function MovieDialog({
  open,
  imdbID,
  onClose,
  apiKey,
  initialMovie,
}) {
  const [movie, setMovie] = useState(initialMovie ?? null);
  const [loading, setLoading] = useState(!initialMovie);

  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (initialMovie) {
      setMovie(initialMovie);
      setLoading(false);
    } else {
      setMovie(null);
      setLoading(true);
    }
  }, [open, initialMovie]);

  useEffect(() => {
    if (!open || !imdbID || initialMovie) return;

    const ctrl = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setMovie(null);

        const url = `https://www.omdbapi.com/?apikey=${apiKey}&i=${encodeURIComponent(
          imdbID
        )}&plot=short`;

        const res = await fetch(url, { signal: ctrl.signal });
        const data = await res.json();

        if (data.Response === "True") {
          setMovie(data);
        } else {
          setMovie({
            Title: "Details unavailable",
            Plot: data?.Error ?? "No details available.",
            Poster: "",
            Year: "",
            Genre: "",
            Runtime: "",
            Rated: "",
          });
        }
      } catch (err) {
        if (err?.name === "AbortError") return; // closed or changed
        setMovie({
          Title: "Network error",
          Plot: "Please check your connection and try again.",
          Poster: "",
          Year: "",
          Genre: "",
          Runtime: "",
          Rated: "",
        });
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [open, imdbID, apiKey, initialMovie]);

  useEffect(() => {
    if (!open) return;

    const body = document.body;
    previouslyFocusedRef.current = document.activeElement;
    body.classList.add("no-scroll");

    queueMicrotask(() => (closeBtnRef.current || dialogRef.current)?.focus?.());

    function onKeydown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key === "Tab") {
        const root = dialogRef.current;
        if (!root) return;

        const focusables = root.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const items = Array.from(focusables).filter(
          (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
        );
        if (items.length === 0) return;

        const first = items[0];
        const last = items[items.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("keydown", onKeydown);
      body.classList.remove("no-scroll");
      const el = previouslyFocusedRef.current;
      if (el && typeof el.focus === "function" && document.contains(el)) el.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
      aria-describedby="modalPlot modalMeta"
    >
      <button
        className="overlay"
        type="button"
        aria-label="Close details"
        onClick={onClose}
      />
      <div className="dialog" role="document" ref={dialogRef} tabIndex={-1}>
        <button
          className="close"
          type="button"
          aria-label="Close"
          onClick={onClose}
          ref={closeBtnRef}
        >
          ✕
        </button>

        <div className="dialog-body">
          {/* Poster */}
          {loading ? (
            <div className="modal-skeleton" aria-hidden="true" />
          ) : (
            <img
              className="modal-poster"
              alt={movie?.Title ? `${movie.Title} poster` : ""}
              src={movie?.Poster && movie.Poster !== "N/A" ? movie.Poster : `${import.meta.env.BASE_URL}cinesearch.png`}
              loading="eager"
              decoding="async"
            />
          )}

          {/* Text (no loading copy; stays blank until ready) */}
          <div className="dialog-text" aria-live="polite">
            <h2 id="modalTitle">{movie?.Title || ""}</h2>
            <p id="modalMeta" className="meta">
              {loading
                ? ""
                : [movie?.Year, movie?.Rated && `Rated ${movie.Rated}`, movie?.Runtime, movie?.Genre]
                    .filter(Boolean)
                    .join(" · ")}
            </p>
            <p id="modalPlot">{loading ? "" : movie?.Plot || ""}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
