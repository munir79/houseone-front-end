'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import { PAYMENTS, PAYMENT_ACTION, PAYMENT_ADVANCE, PAYMENT_ADVANCE_SUMMARY, PUBLIC_RECEIPT } from "@/utils/url";

// টাকা নিলে বিল, বাড়ির টেবিল ও ড্যাশবোর্ড সব বদলায়
const CHANGED_TAGS = ["Payment", "Bill", "Unit", "Tenancy", "Property"];

export const paymentApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. PAYMENTS OF A BILL OR TENANT
    getPayments: builder.query({
      query: (params) => ({ url: PAYMENTS, params }),
      providesTags: ["Payment"],
    }),

    //2. ADVANCE — চুক্তি, পাওয়া, বাকি
    getAdvanceSummary: builder.query({
      query: (tenancyId) => PAYMENT_ADVANCE_SUMMARY(tenancyId),
      providesTags: ["Payment"],
    }),

    //3. TAKE BILL PAYMENT
    payBill: builder.mutation({
      query: (body) => ({ url: PAYMENTS, method: 'POST', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //4. TAKE ADVANCE
    payAdvance: builder.mutation({
      query: (body) => ({ url: PAYMENT_ADVANCE, method: 'POST', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //5. CANCEL
    voidPayment: builder.mutation({
      query: ({ id, reason }) => ({ url: PAYMENT_ACTION(id, "void"), method: 'POST', body: { reason } }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //6. SLIP SENT
    markSlipSent: builder.mutation({
      query: (id) => ({ url: PAYMENT_ACTION(id, "sent"), method: 'POST' }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //7. TENANT SIDE — RECEIPT
    getPublicReceipt: builder.query({
      query: (token) => PUBLIC_RECEIPT(token),
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useGetAdvanceSummaryQuery,
  usePayBillMutation,
  usePayAdvanceMutation,
  useVoidPaymentMutation,
  useMarkSlipSentMutation,
  useGetPublicReceiptQuery,
} = paymentApi;
