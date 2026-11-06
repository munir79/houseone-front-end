"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, Volume2, VolumeX, X } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { cn } from "@/lib/cn";
import { formatTimeAgo } from "@/lib/formatTimeAgo";
import {
  useDeleteNotificationMutation,
  useGetMyNotificationsQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "@/redux/features/notification/notificationApi";
import { useSocketEvent } from "@/socket/useSocketEvent";

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const { playSound, isSoundEnabled, toggleSound } = useNotificationSound();

  const { data, refetch, isLoading } = useGetMyNotificationsQuery();
  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = data?.data?.data || [];
  const unreadCount = data?.data?.unreadCount || 0;

  // Polling নেই — Socket খবর দিলে তবেই নতুন ডেটা আসে
  useSocketEvent("notification", (notification) => {
    playSound();
    toast(notification.title, { description: notification.message });
    refetch();
  });

  // Net কেটে আবার যুক্ত হলে মাঝের Notification গুলো মিলিয়ে নেওয়া
  useSocketEvent("connect", () => refetch());

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={isOpen}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-primary-soft"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-3 top-16 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card md:absolute md:inset-x-auto md:top-full md:right-0 md:mt-2 md:w-96">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="min-h-11 rounded-lg px-2 text-xs font-medium text-primary hover:bg-primary-soft"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={toggleSound}
                aria-label={isSoundEnabled ? "Turn sound off" : "Turn sound on"}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-primary-soft"
              >
                {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState icon={BellOff} title="No notifications" description="New updates will show here." />
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={cn(
                    "group flex items-start gap-2 border-b border-border py-1 pr-1 pl-4 last:border-b-0",
                    !notification.isRead && "bg-primary-soft/50"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => !notification.isRead && markAsRead(notification._id)}
                    className="flex min-w-0 flex-1 items-start gap-2 py-2 text-left"
                  >
                    {!notification.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    <span className="min-w-0">
                      <span className="block text-sm font-medium wrap-break-word">{notification.title}</span>
                      <span className="block text-xs wrap-break-word text-muted">{notification.message}</span>
                      <span className="mt-1 block text-xs text-muted">{formatTimeAgo(notification.createdAt)}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNotification(notification._id)}
                    aria-label={`Delete notification: ${notification.title}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:text-danger focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
