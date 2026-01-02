import React, { useEffect, Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

// Customer (critical path)
import Feed from "./users/pages/Feed";
import Discover from "./users/pages/Discover";
import Explore from "./users/pages/Explore";
import Profile from "./users/pages/Profile";
import BottomTabBar from "./users/components/BottomTabBar";
import MobileHeader from "./users/components/MobileHeader";

// Guards
import RequireMerchantAuth from "./merchant/auth/requireMerchantAuth";
import RequireAdminAuth from "./admin/auth/requireAdminAuth";

// Lazy-loaded routes
const Merchant = lazy(() => import("./users/pages/Merchant"));
const MerchantApp = lazy(() => import("./merchant/MerchantApp"));
const AdminApp = lazy(() => import("./admin/AdminApp"));
const MerchantLogin = lazy(() => import("./merchant/pages/MerchantLogin"));
const AdminLogin = lazy(() => import("./admin/components/AdminLogin"));
const MerchantBottomTabBar = lazy(() =>
  import("./merchant/components/MerchantBottomTabBar")
);
const AdminBottomTabBar = lazy(() =>
  import("./admin/components/AdminBottomTabBar")
);

export default function App() {
  useEffect(() => {
    document.getElementById("html-skeleton")?.remove();
  }, []);

  const loc = useLocation();
  const isMerchantRoute = loc.pathname.startsWith("/client");
  const isAdminRoute = loc.pathname.startsWith("/admin");

  return (
    <div className="relative min-h-screen flex w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark">
      {/* Customer header only */}
      {!isMerchantRoute && !isAdminRoute && <MobileHeader />}

      <main className="flex-1 overflow-auto mb-14">
        <Suspense fallback={null}>
          <Routes>
            {/* Logins */}
            <Route path="/merchant-login" element={<MerchantLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />

            {/* Customer */}
            <Route path="/" element={<Feed />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/discover/:category?" element={<Discover />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/merchant/:merchantNameId" element={<Merchant />} />
            <Route path="/profile" element={<Profile />} />

            {/* Merchant */}
            <Route element={<RequireMerchantAuth />}>
              <Route path="/client/*" element={<MerchantApp />} />
            </Route>

            {/* Admin */}
            <Route element={<RequireAdminAuth />}>
              <Route path="/admin/*" element={<AdminApp />} />
            </Route>
          </Routes>
        </Suspense>
      </main>

      {/* Bottom bars */}
      {isMerchantRoute ? (
        <Suspense fallback={null}>
          <MerchantBottomTabBar />
        </Suspense>
      ) : isAdminRoute ? (
        <Suspense fallback={null}>
          <AdminBottomTabBar />
        </Suspense>
      ) : (
        <BottomTabBar />
      )}
    </div>
  );
}
