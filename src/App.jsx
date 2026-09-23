import { useEffect } from "react";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";
import PersistLogin from "./components/PersistLogin";
import RequireAuth from "./components/RequireAuth";
import F404Page from "./F404Page";
import Login from "./Login";
import SignUp from "./SignUp";
import Unauthorized from "./Unauthorized";
import ChangePassword from "./ChangePassword";

// Layout
import useScrollToTop from "./components/useScrollToTop";

import Layout from "./website/components/Layout";
import DashboardLayout from "./admin-dashboard/DashboardLayout";
import Clients from "./admin-dashboard/clients/Clients";
import ClientDetails from "./admin-dashboard/clients/ClientDetails";
import AdminProfile from "./admin-dashboard/profile/AdminProfile";
import Dashboard from "./admin-dashboard/DashboardOverview";
import ClientSupport from "./website/support/ClientSupport";
import AdminSupport from "./admin-dashboard/support/AdminSupport";
import Messages from "./admin-dashboard/support/Messages";

// Client Pages
import ClientDashboard from "./website/dashboard/ClientDashboard";
import PayoutNames from "./website/payouts/PayoutNames";
import PayoutRequests from "./website/payouts/PayoutRequests";
import Transactions from "./website/transactions/Transactions";
import PaymentMethodsPage from "./website/dashboard/PaymentMethodsPage";
import Subaccounts from "./website/dashboard/Subaccounts";
import SubaccountDashboard from "./website/dashboard/SubaccountDashboard";
// Admin Pages
import AdminPayoutNames from "./admin-dashboard/payouts/AdminPayoutNames";
import AdminPayoutRequests from "./admin-dashboard/payouts/AdminPayoutRequests";
import AdminAllocationRequests from "./admin-dashboard/payouts/AdminAllocationRequests";
import AdminPayments from "./admin-dashboard/payments/AdminPayments";
import ProcessPayouts from "./admin-dashboard/payouts/ProcessPayouts";
import FeeLedger from "./admin-dashboard/ledger/FeeLedger";
import AdminTransactions from "./admin-dashboard/transactions/AdminTransactions";
import AdminDailyReport from "./admin-dashboard/reports/AdminDailyReport";
import ClientDailyReport from "./website/reports/ClientDailyReport";

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  });

  useScrollToTop();

  useEffect(() => {
    const handleGlobalDragOver = (e) => {
      e.preventDefault();
    };
    const handleGlobalDrop = (e) => {
      e.preventDefault();
    };
    window.addEventListener("dragover", handleGlobalDragOver);
    window.addEventListener("drop", handleGlobalDrop);
    return () => {
      window.removeEventListener("dragover", handleGlobalDragOver);
      window.removeEventListener("drop", handleGlobalDrop);
    };
  }, []);

  return (
    <div className="relative">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route>
            <Route path="/*" element={<F404Page />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Login />} />
            {/* <Route path="/signup" element={<SignUp />} /> */}

            <Route element={<PersistLogin />}>
              <Route path="/change-password" element={<ChangePassword />} />
              <Route
                element={<RequireAuth allowedRoles={["client", "Client"]} />}
              >
                <Route>
                  <Route path="/client" element={<Layout />}>
                    <Route index element={<ClientDashboard />} />
                    <Route path="payout-names" element={<PayoutNames />} />
                    <Route path="daily-report" element={<ClientDailyReport />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="payment-methods" element={<PaymentMethodsPage />} />
                    <Route path="subaccounts" element={<Subaccounts />} />
                    <Route path="profile" element={<AdminProfile />} />
                    <Route path="support" element={<ClientSupport />} />
                  </Route>
                </Route>
              </Route>

              {/* admin */}
              <Route
                element={<RequireAuth allowedRoles={["admin", "Admin"]} />}
              >
                <Route>
                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="overview" element={<Dashboard />} />
                    <Route path="payout-names" element={<AdminPayoutNames />} />
                    <Route path="allocation-requests" element={<AdminAllocationRequests />} />
                    <Route path="process-payouts" element={<ProcessPayouts />} />
                    <Route path="payments" element={<AdminPayments />} />
                    <Route path="daily-report" element={<AdminDailyReport />} />
                    <Route path="fee-ledger" element={<FeeLedger />} />
                    <Route path="transactions" element={<AdminTransactions />} />
                    <Route path="clients" element={<Clients />} />
                    <Route path="clients/:_id" element={<ClientDetails />} />
                    <Route path="profile" element={<AdminProfile />} />
                    <Route path="supports" element={<AdminSupport />} />
                    <Route path="messages/:userId" element={<Messages />} />
                  </Route>
                </Route>
              </Route>

              {/* Subaccount */}
              <Route
                element={<RequireAuth allowedRoles={["subaccount"]} />}
              >
                <Route>
                  <Route path="/subaccount" element={<SubaccountDashboard />} />
                </Route>
              </Route>
            </Route>
          </Route>
        </Routes>
      </QueryClientProvider>
    </div>
  );
}

export default App;
