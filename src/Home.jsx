import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function IconSearch(props) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" {...props}>
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconBookmark(props) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" {...props}>
      <path d="M6 3h12v18l-6-3-6 3V3z" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconStar(props) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" {...props}>
      <path
        d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18l-5.8 3.1 1.1-6.5L2.6 9.8l6.5-.9L12 3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();

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

  const [term, setTerm] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  useEffect(() => {
    const q = term.trim();
    if (q.length < 3) return;
    const t = setTimeout(() => {
      navigate(`/search?q=${encodeURIComponent(q)}`, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [term, navigate]);

  const logoSrc = `${import.meta.env.BASE_URL}${theme === "dark" ? "cinesearch_dark.png" : "cinesearch.png"}`;
  const lightLogo = `${import.meta.env.BASE_URL}cinesearch.png`;
  const darkLogo  = `${import.meta.env.BASE_URL}cinesearch_dark.png`;

  return (
    <>
      {/* Top bar: right-side button only (brand to header below) */}
      <nav className="container topbar" style={{ justifyContent: "flex-end" }}>
        <Link className="btn" to="/search">Search</Link>
      </nav>

      {/* Hero: center wordmark, supporting copy, search, toggle */}
      <header className="site-header">
        <div className="container header-inner">
          <h1 className="brand" style={{ justifyContent: "center", gap: 10, margin: 0 }}>
           <div className="logo-box" aria-label="CineSearch logo" role="img">
                <img src={lightLogo} alt="CineSearch logo" className={`logo-img ${theme === "light" ? "is-active" : ""}`} aria-hidden={theme !== "light"} />
                <img src={darkLogo} alt="CineSearch logo (dark mode)" className={`logo-img ${theme === "dark" ? "is-active" : ""}`} aria-hidden={theme !== "dark"} />
            </div>
            <span>
              <strong>Cine</strong>
              <span className="accent"><strong>Search</strong></span>
            </span>
          </h1>

          <p className="tagline" style={{ marginTop: 10 }}>
            Discover films. <span className="accent">Instantly.</span>
          </p>
          <p className="tagline" style={{ marginTop: 0 }}>
            Smart search powered by OMDb. No sign-up required.
          </p>

          {/* Search */}
          <form onSubmit={onSubmit} className="search-wrap" role="search" aria-label="Movie search">
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
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
            {term && (
                <button type="button" className="btn" onClick={() => setTerm("")} aria-label="Clear search">
                    Clear
            </button>
            )}
          </form>

          {/* Theme toggle */}
          <div className="toggles" role="group" aria-label="Appearance" style={{ marginTop: 12 }}>
            <button
              className="btn"
              type="button"
              aria-label="Toggle appearance"
              aria-pressed={theme === "dark"}
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            >
              {themeLabel}
            </button>
          </div>
        </div>
      </header>

      {/* Features row */}
      <section className="container" style={{ padding: "28px 0 48px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <article className="card" style={{ padding: 14 }}>
            <div className="meta" style={{ alignItems: "center", gap: 8 }}>
              <IconSearch /> <strong>Powerful Search</strong>
            </div>
            <p className="meta" style={{ marginTop: 8 }}>
              Search across thousands of titles with instant pagination.
            </p>
          </article>

          <article className="card" style={{ padding: 14 }}>
            <div className="meta" style={{ alignItems: "center", gap: 8 }}>
              <IconBookmark /> <strong>Clean UI</strong>
            </div>
            <p className="meta" style={{ marginTop: 8 }}>
              Focused layout with keyboard-friendly navigation and dialog.
            </p>
          </article>

          <article className="card" style={{ padding: 14 }}>
            <div className="meta" style={{ alignItems: "center", gap: 8 }}>
              <IconStar /> <strong>Rich Details</strong>
            </div>
            <p className="meta" style={{ marginTop: 8 }}>
              Click any result to view ratings, cast, genre, and full plot.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
