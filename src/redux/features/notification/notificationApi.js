'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import { MY_NOTIFICATIONS, NOTIFICATION_BY_ID, READ_ALL_NOTIFICATIONS } from "@/utils/url";

export const notificationApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. MY NOTIFICATIONS
    // params — Notifications পাতার পাতা, সংখ্যা ও "না পড়া" ফিল্টার; Bell এ কিছু লাগে না
    getMyNotifications: builder.query({
      query: (params) => ({ url: MY_NOTIFICATIONS, params }),
      providesTags: ["Notification"],
    }),

    //2. MARK ONE AS READ
    markNotificationAsRead: builder.mutation({
      query: (id) => ({
        url: `${NOTIFICATION_BY_ID(id)}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ["Notification"],
    }),

    //3. MARK ALL AS READ
    markAllNotificationsAsRead: builder.mutation({
      query: () => ({
        url: READ_ALL_NOTIFICATIONS,
        method: 'PATCH',
      }),
      invalidatesTags: ["Notification"],
    }),

    //4. DELETE
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: NOTIFICATION_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetMyNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;
