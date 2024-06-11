import { Routes, Route, useLocation } from "react-router-dom";
import Layout from "./views/layouts/Layout";
import Staff from "./views/pages/Welcome/Staff";
import Build from "./views/pages/Build";

function App() {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Layout />}>
        <Route index element={<Staff />} />
        <Route path="*" element={<Build />} /> {/* Wildcard route */}
      </Route>
    </Routes>
  );
}

export default App;
