'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import { INVITES, PROPERTY_SHARING } from "@/utils/url";

// অংশীদার যোগ-বাদ হলে বাড়ির তালিকা, Dashboard, রিপোর্ট সব বদলায়
const CHANGED_TAGS = ["Sharing", "Property", "Unit", "Tenancy", "Bill", "Payment", "Expense"];

export const shareApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. HOUSE SHARING — সদস্য, দাওয়াত, ভাগ
    getSharing: builder.query({
      query: (propertyId) => PROPERTY_SHARING(propertyId),
      providesTags: ["Sharing", "Property"],
    }),

    //2. SET SHARES — শতাংশে বা ফ্ল্যাট ভাগে
    setShares: builder.mutation({
      query: ({ propertyId, ...body }) => ({ url: `${PROPERTY_SHARING(propertyId)}/shares`, method: 'PUT', body }),
      invalidatesTags: ["Sharing", "Payment"],
    }),

    //3. INVITE A PARTNER
    inviteOwner: builder.mutation({
      query: ({ propertyId, email }) => ({ url: `${PROPERTY_SHARING(propertyId)}/invites`, method: 'POST', body: { email } }),
      invalidatesTags: ["Sharing"],
    }),

    //4. CANCEL INVITE
    cancelInvite: builder.mutation({
      query: ({ propertyId, inviteId }) => ({ url: `${PROPERTY_SHARING(propertyId)}/invites/${inviteId}`, method: 'DELETE' }),
      invalidatesTags: ["Sharing"],
    }),

    //5. REMOVE PARTNER
    removeOwner: builder.mutation({
      query: ({ propertyId, userId }) => ({ url: `${PROPERTY_SHARING(propertyId)}/members/${userId}`, method: 'DELETE' }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //6. SETTLEMENT — দেনা মেটানো
    recordSettlement: builder.mutation({
      query: ({ propertyId, ...body }) => ({ url: `${PROPERTY_SHARING(propertyId)}/settlements`, method: 'POST', body }),
      invalidatesTags: ["Sharing", "Payment"],
    }),

    //7. DELETE SETTLEMENT
    deleteSettlement: builder.mutation({
      query: ({ propertyId, settlementId }) => ({ url: `${PROPERTY_SHARING(propertyId)}/settlements/${settlementId}`, method: 'DELETE' }),
      invalidatesTags: ["Sharing", "Payment"],
    }),

    //8. MY INVITES
    getMyInvites: builder.query({
      query: () => INVITES,
      providesTags: ["Sharing"],
    }),

    //8b. INVITES I SENT — Shared Access পাতায়
    getSentInvites: builder.query({
      query: () => `${INVITES}/sent`,
      providesTags: ["Sharing"],
    }),

    //9. ACCEPT / DECLINE
    answerInvite: builder.mutation({
      query: ({ inviteId, action }) => ({ url: `${INVITES}/${inviteId}/${action}`, method: 'POST' }),
      invalidatesTags: CHANGED_TAGS,
    }),
  }),
});

export const {
  useGetSharingQuery,
  useSetSharesMutation,
  useInviteOwnerMutation,
  useCancelInviteMutation,
  useRemoveOwnerMutation,
  useRecordSettlementMutation,
  useDeleteSettlementMutation,
  useGetMyInvitesQuery,
  useGetSentInvitesQuery,
  useAnswerInviteMutation,
} = shareApi;
