'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import { ACCESS } from "@/utils/url";

// অ্যাক্সেস বদলালে সম্পদের তালিকা, Dashboard সব বদলায়
const CHANGED_TAGS = ["Access", "Property", "Unit", "Tenancy", "Bill", "Payment", "Expense"];

export const accessApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. যাঁদের অ্যাক্সেস দিয়েছি — propertyId দিলে শুধু সেই সম্পদের
    getAccessGrants: builder.query({
      query: (params) => ({ url: ACCESS, params }),
      providesTags: ["Access"],
    }),

    //2. নতুন অ্যাক্সেস
    inviteAccess: builder.mutation({
      query: (body) => ({ url: ACCESS, method: 'POST', body }),
      invalidatesTags: ["Access"],
    }),

    //3. অনুমতি, সম্পর্ক বা সম্পদ বদলানো
    updateAccess: builder.mutation({
      query: ({ grantId, ...body }) => ({ url: `${ACCESS}/${grantId}`, method: 'PATCH', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //4. অ্যাক্সেস তুলে নেওয়া
    revokeAccess: builder.mutation({
      query: (grantId) => ({ url: `${ACCESS}/${grantId}`, method: 'DELETE' }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //5. আমাকে পাঠানো অ্যাক্সেসের দাওয়াত
    getMyAccessInvites: builder.query({
      query: () => `${ACCESS}/invites`,
      providesTags: ["Access"],
    }),

    //6. ACCEPT / DECLINE
    answerAccessInvite: builder.mutation({
      query: ({ grantId, action }) => ({ url: `${ACCESS}/invites/${grantId}/${action}`, method: 'POST' }),
      invalidatesTags: CHANGED_TAGS,
    }),
  }),
});

export const {
  useGetAccessGrantsQuery,
  useInviteAccessMutation,
  useUpdateAccessMutation,
  useRevokeAccessMutation,
  useGetMyAccessInvitesQuery,
  useAnswerAccessInviteMutation,
} = accessApi;
