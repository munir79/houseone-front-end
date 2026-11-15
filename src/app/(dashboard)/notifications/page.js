"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellOff, ChevronRight, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Skeleton from "@/components/ui/Skeleton";
import { bdDateInput } from "@/lib/bdTime";
import { cn } from "@/lib/cn";
import { formatTimeAgo } from "@/lib/formatTimeAgo";
import { notificationLink } from "@/lib/notificationLink";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import {
  useDeleteNotificationMutation,
  useGetMyNotificationsQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "@/redux/features/notification/notificationApi";

const PAGE_SIZE = 20;
const MAX_SIZE = 100;
const FILTERS = { all: "সব", unread: "না পড়া" };
const DAY_MS = 24 * 60 * 60 * 1000;

// আজ · গতকাল · এই সপ্তাহ · আগে — বাংলাদেশের তারিখ ধরে
const groupOf = (createdAt) => {
  const today = new Date(`${bdDateInput()}T00:00:00Z`);
  const day = new Date(`${bdDateInput(createdAt)}T00:00:00Z`);
  const daysAgo = Math.round((today - day) / DAY_MS);
  if (daysAgo <= 0) return "আজ";
  if (daysAgo === 1) return "গতকাল";
  return daysAgo < 7 ? "এই সপ্তাহ" : "আগে";
};

// সব নোটিফিকেশন — চাপলে পড়া হয়, সেই কাজের পাতায় যায়
const NotificationsPage = () => {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data, isLoading, isFetching } = useGetMyNotificationsQuery({ limit, ...(filter === "unread" ? { unread: "true" } : {}) });
  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarking }] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = data?.data?.data || [];
  const total = data?.data?.meta?.total || 0;
  const unreadCount = data?.data?.unreadCount || 0;
  const groups = notifications.reduce((all, notification) => {
    const name = groupOf(notification.createdAt);
    const group = all.find((item) => item.name === name);
    if (group) group.items.push(notification);
    else all.push({ name, items: [notification] });
    return all;
  }, []);

  const open = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);
    const link = notificationLink(notification);
    if (link) router.push(link);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${toBanglaNumber(unreadCount)}টি পড়া হয়নি` : "সব পড়া হয়েছে"}
        action={
          unreadCount > 0 && (
            <Button variant="outline" size="sm" isLoading={isMarking} onClick={() => markAllAsRead()}>
              সব পড়া হয়েছে
            </Button>
          )
        }
      />

      <Card flush className="overflow-hidden">
        <div className="border-b border-border p-3 sm:p-4">
          <SegmentedControl
            label="Filter notifications"
            options={Object.values(FILTERS)}
            value={FILTERS[filter]}
            onChange={(label) => {
              setFilter(label === FILTERS.unread ? "unread" : "all");
              setLimit(PAGE_SIZE);
            }}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState icon={BellOff} title={filter === "unread" ? "সব পড়া হয়েছে" : "No notifications"} description="নতুন কিছু হলে এখানে আর bell-এ দেখাবে।" />
        ) : (
          <div className={cn("transition-opacity", isFetching && "opacity-60")}>
            {groups.map((group) => (
              <section key={group.name} data-notification-group={group.name}>
                <h2 className="border-b border-border bg-background px-4 py-2 text-xs font-semibold text-muted">{group.name}</h2>
                <ul className="divide-y divide-border">
                  {group.items.map((notification) => {
                    const hasLink = Boolean(notificationLink(notification));
                    return (
                      <li key={notification._id} data-notification={notification.type} className={cn("flex items-center gap-1 pr-1", !notification.isRead && "bg-primary-soft/50")}>
                        <button type="button" onClick={() => open(notification)} className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left">
                          <span className={cn("h-2 w-2 shrink-0 rounded-full", notification.isRead ? "bg-transparent" : "bg-primary")} aria-hidden="true" />
                          <span className="min-w-0 flex-1">
                            <span className={cn("block text-sm wrap-break-word", !notification.isRead && "font-semibold")}>{notification.title}</span>
                            <span className="block text-sm wrap-break-word text-muted">{notification.message}</span>
                            <span className="block text-xs text-muted">{formatTimeAgo(notification.createdAt)}</span>
                          </span>
                          {hasLink && <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteNotification(notification._id)}
                          aria-label={`Delete notification: ${notification.title}`}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        {notifications.length < total && limit < MAX_SIZE && (
          <div className="border-t border-border p-3 text-center">
            <Button variant="ghost" size="sm" isLoading={isFetching} onClick={() => setLimit(Math.min(MAX_SIZE, limit + PAGE_SIZE))}>
              আরও দেখুন
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotificationsPage;
