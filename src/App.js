import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

// Customer pages
import Discover from "./users/pages/Discover";
import Merchant from "./users/pages/Merchant";
import Profile from "./users/pages/Profile";
import BottomTabBar from "./users/components/BottomTabBar";
import MobileHeader from "./users/components/MobileHeader";

// Merchant pages
import MerchantBottomTabBar from "./merchant/components/MerchantBottomTabBar";

// Admin pages
import AdminBottomTabBar from "./admin/components/AdminBottomTabBar";
import Feed from "./users/pages/Feed";
import MerchantApp from "./merchant/MerchantApp";
import RequireMerchantAuth from "./merchant/auth/requireMerchantAuth";
import MerchantLogin from "./merchant/pages/MerchantLogin";
import AdminLogin from "./admin/components/AdminLogin";
import RequireAdminAuth from "./admin/auth/requireAdminAuth";
import AdminApp from "./admin/AdminApp";
import Explore from "./users/pages/Explore";

export default function App() {
  const loc = useLocation();
  const [loading, setLoading] = useState(true);

  // Run initData once on mount
  useEffect(() => {
    const boot = async () => {
      try {
        console.log("Init")   // 👈 seeds Supabase if empty
      } catch (err) {
        console.error("App init failed:", err.message);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading initial data...</p>
      </div>
    );
  }

  const isMerchantRoute = loc.pathname.startsWith("/client");
  const isAdminRoute = loc.pathname.startsWith("/admin");

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 group/design-root overflow-x-hidden"
    >
      {/* Mobile header for customers only */}
      {!isMerchantRoute && !isAdminRoute && <MobileHeader />}

      <main
        className="flex-1 overflow-auto pb-16 overflow-auto"
      >
        
        <Routes>
          <Route path="/merchant-login" element={<MerchantLogin/>}/>
          <Route path="/admin-login" element={<AdminLogin/>}/>

          {/* Customer routes */}
          <Route path="/" element={<Feed />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/discover/:category?" element={<Discover />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/merchant/:merchantNameId" element={<Merchant />} />
          <Route path="/profile" element={<Profile />} />

          {/* Merchant routes */}
        <Route element={<RequireMerchantAuth />}>
          <Route path="/client/*" element={<MerchantApp />} />
        </Route>
          {/* Admin routes */}
        <Route element={<RequireAdminAuth />}>
          <Route path="/admin/*" element={<AdminApp />} />
        </Route>
        </Routes>
      </main>

      {/* Bottom tab bars by role */}
      {isMerchantRoute ? (
        <MerchantBottomTabBar />
      ) : isAdminRoute ? (
        <AdminBottomTabBar />
      ) : (
        <BottomTabBar />
      )}
    </div>
  );
}
