"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { WifiOff } from "lucide-react";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import { clearAuth, getToken } from "@/lib/authStorage";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { apiSlice } from "@/redux/api/apiSlice";
import { useGetMyProfileQuery } from "@/redux/features/auth/authApi";
import RealtimeSync from "@/socket/RealtimeSync";
import SocketProvider from "@/socket/SocketProvider";

const AppLayout = ({ children }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useAuthToken();
  const { isCollapsed, toggleSidebar } = useSidebarCollapsed();

  const { data, error, isLoading, refetch } = useGetMyProfileQuery(undefined, { skip: !token });

  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    dispatch(apiSlice.util.resetApiState());
    router.replace("/login");
  };

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <EmptyState
          icon={WifiOff}
          title="Could not load your account"
          description={getErrorMessage(error)}
          action={<Button onClick={refetch}>Try again</Button>}
        />
      </div>
    );
  }

  if (!token || isLoading || !data) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <SocketProvider token={token}>
      <RealtimeSync />
      <div className="min-h-screen">
        <Sidebar isCollapsed={isCollapsed} />
        <div className={cn("pb-22 transition-[padding] duration-200 md:pb-6", isCollapsed ? "md:pl-20" : "md:pl-68")}>
          <Topbar user={data.data} onLogout={handleLogout} isCollapsed={isCollapsed} onToggleSidebar={toggleSidebar} />
          <main className="px-4 py-4 md:px-6">{children}</main>
        </div>
        <BottomNav />
      </div>
    </SocketProvider>
  );
};

export default AppLayout;
