'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import { REPORT } from "@/utils/url";

// টাকা, খরচ বা ভাড়াটিয়া বদলালে খোলা রিপোর্টও নতুন হিসাবে আসে
export const reportApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. REPORT — সময় ও বাড়ি ধরে আয়, খরচ, লাভ
    getReport: builder.query({
      query: (params) => ({ url: REPORT, params }),
      providesTags: ["Payment", "Expense", "Bill", "Tenancy", "Property"],
    }),
  }),
});

export const { useGetReportQuery } = reportApi;
