'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import {
  TENANCIES,
  TENANCY_BY_ID,
  TENANCY_END,
  TENANCY_MEMBER,
  TENANCY_MEMBERS,
  TENANCY_NOTICE,
  TENANCY_SUMMARY,
  TENANTS,
  TENANT_BY_ID,
  TENANT_DOCUMENTS,
  TENANT_NID,
  UNIT_TENANCIES,
} from "@/utils/url";

// ভাড়াটিয়া ওঠা-নামায় ইউনিট ও বাড়ির সংখ্যাও বদলায়
// নতুন ভাড়াটিয়া বা ভাড়া বদলালে এই মাসের বিল বাকির হিসাবও বদলায়
const CHANGED_TAGS = ["Tenancy", "Unit", "Property", "Bill"];

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
      invalidatesTags: CHANGED_TAGS,
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

    //10. MEMBERS
    addMember: builder.mutation({
      query: ({ id, ...body }) => ({ url: TENANCY_MEMBERS(id), method: 'POST', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    updateMember: builder.mutation({
      query: ({ id, memberId, ...body }) => ({ url: TENANCY_MEMBER(id, memberId), method: 'PATCH', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    // left, returned, primary
    memberAction: builder.mutation({
      query: ({ id, memberId, action, ...body }) => ({ url: `${TENANCY_MEMBER(id, memberId)}/${action}`, method: 'POST', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    revealMemberNid: builder.mutation({
      query: ({ id, memberId }) => `${TENANCY_MEMBER(id, memberId)}/nid`,
    }),

    getMemberDocuments: builder.mutation({
      query: ({ id, memberId }) => `${TENANCY_MEMBER(id, memberId)}/documents`,
    }),

    //11. PICK AN EXISTING TENANT
    searchTenants: builder.query({
      query: (search) => ({ url: TENANTS, params: { search } }),
      providesTags: ["Tenancy"],
    }),

    //12. UPDATE TENANT
    updateTenant: builder.mutation({
      query: ({ id, ...body }) => ({ url: TENANT_BY_ID(id), method: 'PATCH', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //13. FULL NID — Mutation, তাই Browser এর Cache এ থাকে না
    revealNid: builder.mutation({
      query: (id) => TENANT_NID(id),
    }),

    //14. DOCUMENT LINKS
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
  useAddMemberMutation,
  useUpdateMemberMutation,
  useMemberActionMutation,
  useRevealMemberNidMutation,
  useGetMemberDocumentsMutation,
  useSearchTenantsQuery,
  useUpdateTenantMutation,
  useRevealNidMutation,
  useGetDocumentLinksMutation,
} = tenancyApi;
