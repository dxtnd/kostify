import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";

// SUPER ADMIN
import SuperAdminLayout from "./components/super-admin/SuperAdminLayout";
import Dashboard from "./pages/super-admin/Dashboard";
import Owners from "./pages/super-admin/Owners";
import Kosts from "./pages/super-admin/Kosts";
import Monitoring from "./pages/super-admin/Monitoring";

// OWNER
import OwnerLayout from "./components/owner/OwnerLayout";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import Rooms from "./pages/owner/Rooms";
import Tenants from "./pages/owner/Tenants";
import Payments from "./pages/owner/Payments";
import Billing from "./pages/owner/Billing";
import Complaint from "./pages/owner/Complaint";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            LOGIN
        ========================= */}
        <Route
          path="/"
          element={<Login />}
        />


        {/* =========================
            SUPER ADMIN
        ========================= */}
        <Route
          path="/super-admin"
          element={<SuperAdminLayout />}
        >
          <Route
            path="dashboard"
            element={<Dashboard />}
          />

          <Route
            path="owners"
            element={<Owners />}
          />

          <Route
            path="kosts"
            element={<Kosts />}
          />

          <Route
            path="monitoring"
            element={<Monitoring />}
          />
        </Route>


        {/* =========================
            OWNER / PEMILIK KOS
        ========================= */}
        <Route
          path="/owner"
          element={<OwnerLayout />}
        >
          <Route
            path="dashboard"
            element={<OwnerDashboard />}
          />

          <Route
            path="rooms"
            element={<Rooms />}
          />

          <Route
            path="tenants"
            element={<Tenants />}
          />

          <Route
            path="bills"
            element={<Payments />}
          />

          <Route 
            path="billing" 
            element={<Billing />} 
          />

          <Route
            path="complaints"
            element={<Complaint />}
          />

        </Route>


      </Routes>
    </BrowserRouter>
  );
}

export default App;