import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Search from "./pages/Search";
import MovieDetail from "./pages/MovieDetail";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="/movie" element={<MovieDetail />} />    
      <Route path="/movie/:movieId" element={<MovieDetail />} />
      <Route path="*" element={<div style={{ padding: 24 }}>Page not found.</div>} />
    </Routes>
  );
}
