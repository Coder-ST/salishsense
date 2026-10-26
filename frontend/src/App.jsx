import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import HomePage from "./pages/Home.jsx";
import SourcesPage from "./pages/Sources.jsx";
import InsideTheIssuePage from "./pages/InsideTheIssue.jsx";
import OurResearchPage from "./pages/OurResearch.jsx";
import AiAnalysisPage from "./pages/AiAnalysis.jsx";
import SiteNav from "./components/Navbar";
import Footer from "./components/Footer";
function AppLayout() {
  const { pathname } = useLocation();

  // scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <SiteNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sources" element={<SourcesPage />} />
        <Route path="/inside-the-issue" element={<InsideTheIssuePage />} />
        <Route path="/our-research" element={<OurResearchPage />} />
        <Route path="/ai-analysis" element={<AiAnalysisPage />} />
      </Routes>
      <Footer />
    </>
  );
}

export default AppLayout;
