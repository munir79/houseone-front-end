'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import { ISSUES, ISSUE_BY_ID, ISSUE_PHOTOS, PUBLIC_ISSUES } from "@/utils/url";

// অভিযোগ বদলালে বাড়ির টেবিল ও ড্যাশবোর্ডের সংখ্যাও বদলায়
const CHANGED_TAGS = ["Issue", "Unit", "Property"];

export const issueApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. LIST
    getIssues: builder.query({
      query: (params) => ({ url: ISSUES, params }),
      providesTags: ["Issue"],
    }),

    //2. ADD
    createIssue: builder.mutation({
      query: (body) => ({ url: ISSUES, method: 'POST', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //3. STATUS AND NOTE
    updateIssue: builder.mutation({
      query: ({ id, ...body }) => ({ url: ISSUE_BY_ID(id), method: 'PATCH', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //4. DELETE
    deleteIssue: builder.mutation({
      query: (id) => ({ url: ISSUE_BY_ID(id), method: 'DELETE' }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //5. PHOTO LINKS — Mutation, তাই Browser এর Cache এ থাকে না
    getIssuePhotos: builder.mutation({
      query: (id) => ISSUE_PHOTOS(id),
    }),

    //6. TENANT SIDE — LIST
    getPublicIssues: builder.query({
      query: (token) => PUBLIC_ISSUES(token),
      providesTags: ["Issue"],
    }),

    //7. TENANT SIDE — SEND
    createPublicIssue: builder.mutation({
      query: ({ token, ...body }) => ({ url: PUBLIC_ISSUES(token), method: 'POST', body }),
      invalidatesTags: ["Issue"],
    }),
  }),
});

export const {
  useGetIssuesQuery,
  useCreateIssueMutation,
  useUpdateIssueMutation,
  useDeleteIssueMutation,
  useGetIssuePhotosMutation,
  useGetPublicIssuesQuery,
  useCreatePublicIssueMutation,
} = issueApi;
