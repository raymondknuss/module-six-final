import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import Search from "./Search";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="*" element={<div style={{ padding: 24 }}>Page not found.</div>} />
    </Routes>
  );
}
