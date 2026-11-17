'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import { DASHBOARD_MONEY } from "@/utils/url";

// বিল, টাকা, ভাড়াটিয়া বা বাড়ি বদলালেই Dashboard এর হিসাব নতুন করে আসে
export const dashboardApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. MONEY — এই মাস, Advance, আদায় হয়নি, chart, বাড়ি, সাম্প্রতিক রসিদ
    getDashboardMoney: builder.query({
      // propertyId দিলে শুধু সেই সম্পদের — Overview তে
      query: (params) => ({ url: DASHBOARD_MONEY, params }),
      providesTags: ["Bill", "Payment", "Tenancy", "Property", "Expense"],
    }),
  }),
});

export const { useGetDashboardMoneyQuery } = dashboardApi;
