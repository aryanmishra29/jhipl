import { Routes, Route, useLocation } from "react-router-dom";
import Layout from "./views/layouts/Layout";
import Staff from "./views/pages/Welcome/Staff";
// import Build from "./views/pages/Build";
import Purchase from "./views/pages/purchase/Purchase";
import ReimbursementTable from "./views/pages/Reimbursement";
import InvoiceTable from "./views/pages/Invoice";
import Calendar from "./views/pages/Calendar/Calendar";
import Login from "./views/pages/Login";
import ProtectedRoute from "./views/pages/ProtectedRoute";
import AdminDashboard from "./views/pages/admin/AdminDashboard";
import './App.css';
import AdminReimbursementTable from "./views/pages/admin/AdminReimbursementTable";
import AdminInvoiceTable from "./views/pages/admin/AdminInvoiceTable";
import PurchaseOrder from "./views/pages/admin/PurchaseOrder";

function App() {
  const location = useLocation();
  const userType = localStorage.getItem("userType") || null;

  // Inside App component
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute userType={userType} requiredType="USER">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Staff />} />
        <Route path="reimbursement" element={<ReimbursementTable />} />
        <Route path="invoices" element={<InvoiceTable />} />
        <Route path="calendar" element={<Calendar />} />
        {/* <Route path="*" element={<Build />} /> */}
        <Route path="purchase-orders" element={<Purchase />} />

      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute userType={userType} requiredType="ADMIN">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="reimbursement" element={<AdminReimbursementTable />} />
        <Route path="invoices" element={<AdminInvoiceTable />} />
        <Route path="calendar" element={<Calendar />} />
        {/* <Route path="*" element={<Build />} /> */}
        <Route path="purchase-orders" element={<PurchaseOrder />} />
      </Route>
    </Routes>
  );

}

export default App;
