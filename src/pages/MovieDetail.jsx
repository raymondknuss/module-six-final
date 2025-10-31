import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";

const API_KEY = import.meta.env.VITE_OMDB_API_KEY;

export default function MovieDetail() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const backQuery = params.get("q") || "";
  const id = movieId || params.get("i");

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

  const [movie, setMovie] = useState(null);
  const [status, setStatus] = useState("Loading…");
  const [recs, setRecs] = useState([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  const lightLogo = `${import.meta.env.BASE_URL}cinesearch.png`;
  const darkLogo = `${import.meta.env.BASE_URL}cinesearch_dark.png`;

  const uniqueById = (arr) => {
    const seen = new Set();
    return arr.filter((x) => {
      if (!x?.imdbID || seen.has(x.imdbID)) return false;
      seen.add(x.imdbID);
      return true;
    });
  };

  const keywordCandidatesFromTitle = (title) =>
    String(title || "")
      .split(/[^A-Za-z0-9]+/)
      .filter((w) => w.length > 2) 
      .slice(0, 6); 

  async function omdbSearch(q, signal) {
    const res = await fetch(
      `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(q)}&page=1`,
      { signal }
    );
    const data = await res.json();
    if (data?.Response === "True" && Array.isArray(data.Search)) return data.Search;
    return [];
  }

  useEffect(() => {
    if (!id) return;

    const ac = new AbortController();
    const signal = ac.signal;

    async function load() {
      setStatus("Loading…");
      setMovie(null);
      setRecs([]);
      window.scrollTo(0, 0);

      try {
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${API_KEY}&i=${encodeURIComponent(id)}&plot=full`,
          { signal }
        );
        const data = await res.json();
        if (signal.aborted) return;

        if (data?.Response === "True") {
          setMovie(data);
          setStatus("");
          fetchRecs(data, signal);
        } else {
          setStatus(data?.Error || "Unable to load movie.");
        }
      } catch (err) {
        if (!signal.aborted) setStatus("Network error while loading movie.");
      }
    }

    async function fetchRecs(m, signal) {
      setIsLoadingRecs(true);
      try {
        let pool = [];

        for (const word of keywordCandidatesFromTitle(m.Title)) {
          const batch = await omdbSearch(word, signal);
          pool = pool.concat(batch);
          if (pool.length >= 8) break; 
        }

        if (!pool.length && m.Director) {
          const last = m.Director.trim().split(/\s+/).pop();
          pool = pool.concat(await omdbSearch(last, signal));
        }

        if (!pool.length && m.Genre) {
          const firstGenre = m.Genre.split(",")[0].trim();
          pool = pool.concat(await omdbSearch(firstGenre, signal));
        }

        const filtered = uniqueById(pool.filter((x) => x.imdbID !== id)).slice(0, 5);
        setRecs(filtered);
      } catch (err) {
        if (!signal.aborted) setRecs([]);
      } finally {
        if (!signal.aborted) setIsLoadingRecs(false);
      }
    }

    load();

    return () => ac.abort();
  }, [id]);

  if (!id) {
    return (
      <main className="container" style={{ padding: "2rem" }}>
        <div className="status">No movie id provided.</div>
      </main>
    );
  }

  if (status && !movie) {
    return (
      <>
        <nav className="container topbar">
          <div className="brand" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="logo-box" aria-label="CineSearch logo" role="img">
              <img src={lightLogo} alt="CineSearch logo" className="logo-img is-active" />
            </div>
            <strong>
              Cine<span className="accent">Search</span>
            </strong>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link className="btn" to="/">
              Home
            </Link>
            {backQuery ? (
              <Link className="btn" to={`/search?q=${encodeURIComponent(backQuery)}`}>
                Back to results
              </Link>
            ) : null}
            <button className="btn" type="button" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
              {themeLabel}
            </button>
          </div>
        </nav>
        <main className="container" style={{ padding: "2rem" }}>
          <div className="status" role="status" aria-live="polite">
            {status}
          </div>
        </main>
      </>
    );
  }

  if (!movie) return null;

  const poster = movie.Poster && movie.Poster !== "N/A" ? movie.Poster : null;

  return (
    <>
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
          {backQuery ? (
            <Link className="btn" to={`/search?q=${encodeURIComponent(backQuery)}`}>Back to results</Link>
          ) : (
            <button className="btn" type="button" onClick={() => navigate(-1)}>Back</button>
          )}
          <button className="btn" type="button" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
            {themeLabel}
          </button>
        </div>
      </nav>

      <main className="container" style={{ padding: "24px 0 48px" }}>
        <article
          className="card card--static"
          style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 16, padding: 16 }}
        >
          {poster ? (
            <img className="poster" src={poster} alt={`${movie.Title} poster`} width="160" />
          ) : (
            <div className="poster poster--empty" aria-hidden="true" style={{ width: 160, height: 240 }} />
          )}
          <div>
            <h1 className="title" style={{ marginTop: 0 }}>
              {movie.Title}
            </h1>
            <p className="meta">{[movie.Year, movie.Rated, movie.Runtime, movie.Genre].filter(Boolean).join(" · ")}</p>
            <p style={{ marginTop: 12 }}>{movie.Plot}</p>
            {movie.Director && (
              <p className="meta">
                <strong>Director:</strong> {movie.Director}
              </p>
            )}
            {movie.Actors && (
              <p className="meta">
                <strong>Cast:</strong> {movie.Actors}
              </p>
            )}
            {movie.imdbRating && (
              <p className="meta">
                <strong>IMDb:</strong> {movie.imdbRating}
              </p>
            )}
          </div>
        </article>

        <section className="mt-8" style={{ marginTop: 28 }}>
          <h2>
            Recommended
            {recs.length ? (
              <span className="meta" style={{ marginLeft: 8 }}>
                (Based on search results)
              </span>
            ) : null}
          </h2>

          {isLoadingRecs ? (
            <div className="status" role="status" aria-live="polite">
              Loading recommendations…
            </div>
          ) : recs.length ? (
            <div className="grid" style={{ marginTop: 12 }}>
              {recs.map((r) => (
                <article key={r.imdbID} className="card">
                  <Link
                    to={`/movie?i=${r.imdbID}${backQuery ? `&q=${encodeURIComponent(backQuery)}` : ""}`}
                    className="card-button"
                    aria-label={`View details for ${r.Title}`}
                  >
                    {r.Poster && r.Poster !== "N/A" ? (
                      <img
                        className="poster"
                        src={r.Poster}
                        alt={`${r.Title} poster`}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="poster poster--empty" aria-hidden="true" />
                    )}
                    <div className="card-body">
                      <h3 className="title">{r.Title}</h3>
                      <p className="meta">
                        {r.Year}
                        {r.Type ? ` · ${String(r.Type).toUpperCase()}` : ""}
                      </p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p className="meta">No recommendations found.</p>
          )}
        </section>
      </main>
    </>
  );
}
