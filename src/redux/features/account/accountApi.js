'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import { ACCOUNT } from "@/utils/url";

// প্রোফাইল বদলালে উপরের নাম ও ছবিও বদলায় ("User")
export const accountApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. ACCOUNT — প্রোফাইল ও পছন্দ
    getAccount: builder.query({
      query: () => ACCOUNT,
      providesTags: ["User"],
    }),

    //2. PROFILE
    updateProfile: builder.mutation({
      query: (body) => ({ url: `${ACCOUNT}/profile`, method: 'PATCH', body }),
      invalidatesTags: ["User"],
    }),

    //3. PASSWORD — নতুন Token আসে, বাকি Device Logout
    changePassword: builder.mutation({
      query: (body) => ({ url: `${ACCOUNT}/password`, method: 'POST', body }),
    }),

    //4. SETTINGS — রসিদের তথ্য, নোটিফিকেশন
    updateAccountSettings: builder.mutation({
      query: (body) => ({ url: `${ACCOUNT}/settings`, method: 'PATCH', body }),
      invalidatesTags: ["User"],
    }),

    //5. ALL DATA
    exportAccountData: builder.query({
      query: () => `${ACCOUNT}/export`,
      keepUnusedDataFor: 0,
    }),
  }),
});

export const {
  useGetAccountQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUpdateAccountSettingsMutation,
  useLazyExportAccountDataQuery,
} = accountApi;
