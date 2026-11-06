'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import { MY_NOTIFICATIONS, NOTIFICATION_BY_ID, READ_ALL_NOTIFICATIONS } from "@/utils/url";

export const notificationApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. MY NOTIFICATIONS
    getMyNotifications: builder.query({
      query: () => MY_NOTIFICATIONS,
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
