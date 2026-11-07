'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import { BILLS, BILL_ADJUST, BILL_BY_ID, BILL_GENERATE, BILL_PREVIEW, TENANCY_BILLS } from "@/utils/url";

// বিল বদলালে বাড়ির টেবিল ও ড্যাশবোর্ডের সংখ্যাও বদলায়
const CHANGED_TAGS = ["Bill", "Unit", "Tenancy", "Property"];

export const billApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. BILLS OF A MONTH
    getBills: builder.query({
      query: (params) => ({ url: BILLS, params }),
      providesTags: ["Bill"],
    }),

    //2. WHAT WILL BE CREATED
    getBillPreview: builder.query({
      query: (params) => ({ url: BILL_PREVIEW, params }),
      providesTags: ["Bill"],
    }),

    //3. BILLS OF A TENANT
    getTenancyBills: builder.query({
      query: (tenancyId) => TENANCY_BILLS(tenancyId),
      providesTags: ["Bill"],
    }),

    //4. CREATE BILLS
    generateBills: builder.mutation({
      query: (body) => ({ url: BILL_GENERATE, method: 'POST', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //5. EDIT
    updateBill: builder.mutation({
      query: ({ id, ...body }) => ({ url: BILL_BY_ID(id), method: 'PATCH', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //6. ADJUSTMENT
    addBillAdjustment: builder.mutation({
      query: ({ id, ...body }) => ({ url: BILL_ADJUST(id), method: 'POST', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //7. DELETE
    deleteBill: builder.mutation({
      query: (id) => ({ url: BILL_BY_ID(id), method: 'DELETE' }),
      invalidatesTags: CHANGED_TAGS,
    }),
  }),
});

export const {
  useGetBillsQuery,
  useGetBillPreviewQuery,
  useGetTenancyBillsQuery,
  useGenerateBillsMutation,
  useUpdateBillMutation,
  useAddBillAdjustmentMutation,
  useDeleteBillMutation,
} = billApi;
