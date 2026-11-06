'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import {
  TENANCIES,
  TENANCY_BY_ID,
  TENANCY_END,
  TENANCY_NOTICE,
  TENANCY_SUMMARY,
  TENANTS,
  TENANT_BY_ID,
  TENANT_DOCUMENTS,
  TENANT_NID,
  UNIT_TENANCIES,
} from "@/utils/url";

// ভাড়াটিয়া ওঠা-নামায় ইউনিট ও বাড়ির সংখ্যাও বদলায়
const CHANGED_TAGS = ["Tenancy", "Unit", "Property"];

export const tenancyApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. TENANT LIST
    getTenancies: builder.query({
      query: (params) => ({ url: TENANCIES, params }),
      providesTags: ["Tenancy"],
    }),

    //2. SUMMARY
    getTenancySummary: builder.query({
      query: () => TENANCY_SUMMARY,
      providesTags: ["Tenancy"],
    }),

    //3. ONE TENANCY
    getTenancy: builder.query({
      query: (id) => TENANCY_BY_ID(id),
      providesTags: ["Tenancy"],
    }),

    //4. HISTORY OF A UNIT
    getUnitTenancies: builder.query({
      query: (unitId) => UNIT_TENANCIES(unitId),
      providesTags: ["Tenancy"],
    }),

    //5. MOVE IN
    createTenancy: builder.mutation({
      query: (body) => ({ url: TENANCIES, method: 'POST', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //6. UPDATE
    updateTenancy: builder.mutation({
      query: ({ id, ...body }) => ({ url: TENANCY_BY_ID(id), method: 'PATCH', body }),
      invalidatesTags: ["Tenancy"],
    }),

    //7. NOTICE
    giveNotice: builder.mutation({
      query: ({ id, leavingDate }) => ({ url: TENANCY_NOTICE(id), method: 'POST', body: { leavingDate } }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //8. CANCEL NOTICE
    cancelNotice: builder.mutation({
      query: (id) => ({ url: TENANCY_NOTICE(id), method: 'DELETE' }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //9. MOVE OUT
    endTenancy: builder.mutation({
      query: ({ id, endDate }) => ({ url: TENANCY_END(id), method: 'POST', body: { endDate } }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //10. PICK AN EXISTING TENANT
    searchTenants: builder.query({
      query: (search) => ({ url: TENANTS, params: { search } }),
      providesTags: ["Tenancy"],
    }),

    //11. UPDATE TENANT
    updateTenant: builder.mutation({
      query: ({ id, ...body }) => ({ url: TENANT_BY_ID(id), method: 'PATCH', body }),
      invalidatesTags: ["Tenancy"],
    }),

    //12. FULL NID — Mutation, তাই Browser এর Cache এ থাকে না
    revealNid: builder.mutation({
      query: (id) => TENANT_NID(id),
    }),

    //13. DOCUMENT LINKS
    getDocumentLinks: builder.mutation({
      query: (id) => TENANT_DOCUMENTS(id),
    }),
  }),
});

export const {
  useGetTenanciesQuery,
  useGetTenancySummaryQuery,
  useGetTenancyQuery,
  useGetUnitTenanciesQuery,
  useCreateTenancyMutation,
  useUpdateTenancyMutation,
  useGiveNoticeMutation,
  useCancelNoticeMutation,
  useEndTenancyMutation,
  useSearchTenantsQuery,
  useUpdateTenantMutation,
  useRevealNidMutation,
  useGetDocumentLinksMutation,
} = tenancyApi;
