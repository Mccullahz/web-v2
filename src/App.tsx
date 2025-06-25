import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Portfolio } from "./pages/Port";
import { Gui } from "./pages/Gui";
import { Flacer } from "./pages/Flacer";
import { Pms } from "./pages/Pms";
import { Lms } from "./pages/Lms";
import { Ysa } from "./pages/Ysa";
import { NotFound } from "./pages/NotFound";

export const App: React.FC = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/portfolio" element={<Portfolio />} />
	<Route path="/gui" element={<Gui />} />
	<Route path="/flacer" element={<Flacer />} />
	<Route path="/pms" element={<Pms />} />
	<Route path="/lms" element={<Lms />} />
	<Route path="/ysa" element={<Ysa />} />
	<Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </Router>
  );
};

