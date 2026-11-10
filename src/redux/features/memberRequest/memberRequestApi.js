'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import { MEMBER_REQUESTS, MEMBER_REQUEST_ACTION, PUBLIC_MEMBER } from "@/utils/url";

// সদস্য নিজে তথ্য দিলে Server "Tenancy" জানায়, তাই অপেক্ষার তালিকাও সাথে সাথে আসে
export const memberRequestApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. FLAT'S MEMBER LINK
    getMemberLink: builder.mutation({
      query: (tenancyId) => ({ url: `${MEMBER_REQUESTS(tenancyId)}/link`, method: 'POST' }),
    }),

    //2. WAITING FOR APPROVAL
    getMemberRequests: builder.query({
      query: (tenancyId) => MEMBER_REQUESTS(tenancyId),
      providesTags: ["Tenancy"],
    }),

    //3. APPROVE OR REJECT
    decideMemberRequest: builder.mutation({
      query: ({ tenancyId, requestId, action }) => ({ url: MEMBER_REQUEST_ACTION(tenancyId, requestId, action), method: 'POST' }),
      invalidatesTags: ["Tenancy", "Unit"],
    }),

    //4. MEMBER SIDE — FLAT INFO
    getPublicMemberLink: builder.query({
      query: (token) => PUBLIC_MEMBER(token),
    }),

    //5. MEMBER SIDE — UPLOAD
    getPublicMemberSignature: builder.mutation({
      query: (token) => ({ url: `${PUBLIC_MEMBER(token)}/signature`, method: 'POST' }),
    }),

    //6. MEMBER SIDE — SEND
    submitMemberRequest: builder.mutation({
      query: ({ token, ...body }) => ({ url: `${PUBLIC_MEMBER(token)}/submit`, method: 'POST', body }),
    }),
  }),
});

export const {
  useGetMemberLinkMutation,
  useGetMemberRequestsQuery,
  useDecideMemberRequestMutation,
  useGetPublicMemberLinkQuery,
  useGetPublicMemberSignatureMutation,
  useSubmitMemberRequestMutation,
} = memberRequestApi;
