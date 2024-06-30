import { Routes, Route, useLocation } from "react-router-dom";
import Layout from "./views/layouts/Layout";
import Staff from "./views/pages/Welcome/Staff";
import Build from "./views/pages/Build";
import ReimbursementTable from "./views/pages/Reimbursement";
import InvoiceTable from "./views/pages/Invoice";
import Calendar from "./views/pages/Calendar/Calendar";
import './App.css'
function App() {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Layout />}>
        <Route index element={<Staff />} />
        <Route path="*" element={<Build />} />
        <Route path="/reimbursement" element={<ReimbursementTable />} />
        <Route path="/invoices" element={<InvoiceTable />} />
        <Route path="/calendar" element={<Calendar />} />
      </Route>
    </Routes>
  );
}

export default App;
