import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

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

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setParams(val ? { q: val } : {}, { replace: true });
  };

  function handleClear() {
    setQuery("");
    setResults([]);
    setTotalResults(0);
    setPage(1);
    setStatus("Cleared. Type at least 3 characters to search.");

    setParams({}, { replace: true });

    const input = document.getElementById("search");
    input?.focus();
  }

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  async function fetchPage(q, pageNum, signal) {
    const url = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(q)}&page=${pageNum}`;
    const res = await fetch(url, { signal });
    const data = await res.json();
    if (data?.Response === "True" && Array.isArray(data.Search)) return data;
    throw new Error(data?.Error || "No results found.");
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

    const ac = new AbortController();
    const signal = ac.signal;

    setIsSearching(true);
    setStatus("Searching…");

    const timer = setTimeout(async () => {
      try {
        const data = await fetchPage(q, 1, signal);
        const total = Number.parseInt(data.totalResults || "0", 10);
        const safeTotal = Number.isFinite(total) ? total : data.Search.length;

        if (signal.aborted) return;
        setResults(data.Search);
        setTotalResults(safeTotal);
        setStatus(
          safeTotal
            ? `Found ${safeTotal} result${safeTotal === 1 ? "" : "s"}. Showing ${data.Search.length}.`
            : `Found ${data.Search.length} result${data.Search.length === 1 ? "" : "s"}.`
        );
        queueMicrotask(() => mainRef.current?.focus?.());
      } catch (err) {
        if (!signal.aborted) {
          setResults([]);
          setTotalResults(0);
          setStatus(err.message === "No results found." ? "No results found." : "Network error. Check your connection.");
        }
      } finally {
        if (!signal.aborted) setIsSearching(false);
      }
    }, 300); // debounce

    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [query]);

  const canLoadMore = results.length > 0 && totalResults > results.length;

  async function handleLoadMore() {
    if (!canLoadMore || isLoadingMore) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);

    const ac = new AbortController();
    const signal = ac.signal;

    try {
      const data = await fetchPage(query.trim(), nextPage, signal);
      if (signal.aborted) return;
      setResults((prev) => {
        const combined = [...prev, ...data.Search];
        setStatus(`Showing ${combined.length} of ${totalResults}.`);
        return combined;
      });
      setPage(nextPage);
    } catch (err) {
      if (!signal.aborted) setStatus("No more results or network error.");
    } finally {
      if (!signal.aborted) setIsLoadingMore(false);
    }
  }

  const lightLogo = `${import.meta.env.BASE_URL}cinesearch.png`;
  const darkLogo = `${import.meta.env.BASE_URL}cinesearch_dark.png`;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to results
      </a>

      <nav className="container topbar">
        <div className="brand" aria-label="CineSearch home" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="logo-box" aria-label="CineSearch logo" role="img">
            <img
              src={lightLogo}
              alt="CineSearch logo"
              className={`logo-img ${theme === "light" ? "is-active" : ""}`}
              aria-hidden={theme !== "light"}
            />
            <img
              src={darkLogo}
              alt="CineSearch logo (dark mode)"
              className={`logo-img ${theme === "dark" ? "is-active" : ""}`}
              aria-hidden={theme !== "dark"}
            />
          </div>
          <strong>
            Cine<span className="accent">Search</span>
          </strong>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn" to="/">
            Home
          </Link>
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
            <label htmlFor="search" className="sr-only">
              Search movies by title
            </label>

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

          <p id="helper" className="helper">
            Type at least 3 characters to search.
          </p>

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
        <div className="results-shell">
          <div id="status" className="status" role="status" aria-live="polite">
            {status}
          </div>

          <section id="results" className="grid" aria-label="Search results">
            <h2 className="sr-only">Search results</h2>
            {results.map((m) => (
              <article key={m.imdbID} className="card">
                <Link
                  to={`/movie?i=${m.imdbID}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                  className="card-button"
                  aria-label={`View details for ${m.Title}`}
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
                </Link>
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
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">
          <small>
            Powered by{" "}
            <a href="https://www.omdbapi.com/" target="_blank" rel="noopener noreferrer">
              OMDb API
            </a>
            .
          </small>
        </div>
      </footer>
    </>
  );
}
