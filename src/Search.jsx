import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import MovieDialog from "./MovieDialog.jsx";

const API_KEY = import.meta.env.VITE_OMDB_API_KEY;

export default function Search() {
  const [params, setParams] = useSearchParams();
  const initialQ = params.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [status, setStatus] = useState("Type at least 3 characters to search.");
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [activeImdbID, setActiveImdbID] = useState(null);
  const [prefetchedMovie, setPrefetchedMovie] = useState(null);

  useEffect(() => {
    if (initialQ && initialQ !== query) setQuery(initialQ);
  }, [initialQ]); 

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    return prefersDark ? "dark" : "light";
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  const themeLabel = useMemo(() => (theme === "dark" ? "🌙 Dark" : "🔆 Light"), [theme]);

  const clearBtnRef = useRef(null);
  const mainRef = useRef(null);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    setParams(val ? { q: val } : {}, { replace: true });
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setTotalResults(0);
    setPage(1);
    setStatus("Cleared. Type at least 3 characters to search.");
    clearBtnRef.current?.focus?.();
  }

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  async function openDetails(imdbID) {
    try {
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=${API_KEY}&i=${encodeURIComponent(imdbID)}&plot=short`
      );
      const data = await res.json();

      if (data.Response === "True") {
        setPrefetchedMovie(data);
      } else {
        setPrefetchedMovie({
          Title: "Details unavailable",
          Plot: data?.Error ?? "No details available.",
          Poster: "",
          Year: "",
          Genre: "",
          Runtime: "",
          Rated: "",
        });
      }
    } catch {
      setPrefetchedMovie({
        Title: "Network error",
        Plot: "Please check your connection and try again.",
        Poster: "",
        Year: "",
        Genre: "",
        Runtime: "",
        Rated: "",
      });
    } finally {
      setActiveImdbID(imdbID);
      setIsOpen(true);
    }
  }

  function closeDetails() {
    setIsOpen(false);
    setPrefetchedMovie(null);
  }

  useEffect(() => {
    const q = query.trim();
    setPage(1);
    setTotalResults(0);

    if (!q || q.length < 3) {
      setResults([]);
      setStatus("Type at least 3 characters to search.");
      return;
    }

    setIsSearching(true);
    setStatus("Searching…");

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(q)}&page=1`;
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();

        if (data.Response === "True" && Array.isArray(data.Search)) {
            setResults(data.Search);
            const total = Number.parseInt(data.totalResults || "0", 10);
            const safeTotal = Number.isFinite(total) ? total : data.Search.length;
            setTotalResults(safeTotal);
            setStatus(
                safeTotal
                    ? `Found ${safeTotal} result${safeTotal === 1 ? "" : "s"}. Showing ${data.Search.length}.`
                    : `Found ${data.Search.length} result${data.Search.length === 1 ? "" : "s"}.`
            );
            queueMicrotask(() => mainRef.current?.focus?.());
        }else {
          setResults([]);
          setTotalResults(0);
          setStatus(data?.Error ? `No results. (${data.Error})` : "No results found.");
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          setStatus("Network error. Check your connection.");
          setResults([]);
          setTotalResults(0);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const canLoadMore = results.length > 0 && totalResults > results.length;

  async function handleLoadMore() {
    if (!canLoadMore || isLoadingMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const url = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(
        query.trim()
      )}&page=${nextPage}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.Response === "True" && Array.isArray(data.Search)) {
        setResults((prev) => {
          const combined = [...prev, ...data.Search];
          const shown = combined.length;
          setStatus(`Showing ${shown} of ${totalResults}.`);
          return combined;
        });
        setPage(nextPage);
      } else {
        setStatus(data?.Error ? `No more results. (${data.Error})` : "No more results.");
      }
    } catch {
      setStatus("Network error while loading more.");
    } finally {
      setIsLoadingMore(false);
    }
  }

const logoSrc = `${import.meta.env.BASE_URL}${theme === "dark" ? "cinesearch_dark.png" : "cinesearch.png"}`;
const lightLogo = `${import.meta.env.BASE_URL}cinesearch.png`;
const darkLogo  = `${import.meta.env.BASE_URL}cinesearch_dark.png`;

  return (
    <>
      <a className="skip-link" href="#main">Skip to results</a>

      {/* Top bar: brand left, Go to Home right */}
      <nav className="container topbar">
        <div className="brand" aria-label="CineSearch home" style={{ display: "flex", alignItems: "center", gap: 8 }}>
         <div className="logo-box" aria-label="CineSearch logo" role="img">
            <img src={lightLogo} alt="CineSearch logo" className={`logo-img ${theme === "light" ? "is-active" : ""}`} aria-hidden={theme !== "light"} />
            <img src={darkLogo} alt="CineSearch logo (dark mode)" className={`logo-img ${theme === "dark" ? "is-active" : ""}`} aria-hidden={theme !== "dark"} />
          </div>
          <strong>
            Cine<span className="accent">Search</span>
          </strong>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn" to="/">Home</Link>
        </div>
      </nav>

      <header className="site-header">
        <div className="container header-inner">
          <h1>
            Find Your <span className="accent">Movie</span>
          </h1>
          <p className="tagline">Search by title. We’ll fetch results from OMDb.</p>

          <form
            id="searchForm"
            className="search-wrap"
            role="search"
            aria-label="Movie search"
            noValidate
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="search" className="sr-only">Search movies by title</label>

            <input
              id="search"
              name="q"
              type="search"
              placeholder={'Search movies... try "fast"'}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              inputMode="search"
              aria-describedby="helper"
              value={query}
              onChange={handleChange}
            />

            <button
              id="clearBtn"
              type="button"
              aria-label="Clear search"
              onClick={handleClear}
              disabled={!query}
              ref={clearBtnRef}
            >
              ✕
            </button>
          </form>

          <p id="helper" className="helper">Type at least 3 characters to search.</p>

          <div className="toggles" role="group" aria-label="Appearance">
            <button
              id="appearanceToggle"
              className="btn"
              type="button"
              aria-label="Toggle appearance"
              aria-pressed={theme === "dark"}
              onClick={toggleTheme}
            >
              {themeLabel}
            </button>
          </div>
        </div>
      </header>

        <main
        id="main"
        ref={mainRef}
        className="container"
        tabIndex={-1}
        aria-busy={isSearching || isLoadingMore ? "true" : "false"}
        >
        <div id="status" className="status" role="status" aria-live="polite">
          {status}
        </div>

        <section id="results" className="grid" aria-label="Search results">
          <h2 className="sr-only">Search results</h2>

          {results.map((m) => (
            <article key={m.imdbID} className="card">
              <button
                className="card-button"
                type="button"
                onClick={() => openDetails(m.imdbID)}
              >
            {m.Poster !== "N/A" ? (
                <img
                    className="poster"
                    src={m.Poster}
                    alt={`${m.Title} poster`}
                    loading="lazy"
                    decoding="async"
                />
            ) : (
                <div className="poster poster--empty" aria-hidden="true" />
            )}
                <div className="card-body">
                  <h3 className="title">{m.Title}</h3>
                  <p className="meta">
                    {m.Year}
                    {m.Type && ` · ${String(m.Type).toUpperCase()}`}
                  </p>
                </div>
              </button>
            </article>
          ))}
        </section>

        {canLoadMore && (
          <div className="load-more-wrap">
            <button
              className="btn"
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              aria-live="polite"
            >
              {isLoadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}

        <MovieDialog
          open={isOpen}
          imdbID={activeImdbID}
          onClose={closeDetails}
          apiKey={API_KEY}
          initialMovie={prefetchedMovie}
        />
      </main>

      <footer className="site-footer">
        <div className="container">
          <small>
            Powered by{" "}
            <a href="https://www.omdbapi.com/" target="_blank" rel="noopener noreferrer">
              OMDb API
            </a>.
          </small>
        </div>
      </footer>
    </>
  );
}
