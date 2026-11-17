'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import { PROPERTY_ACTIVITY } from "@/utils/url";

export const activityApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. সম্পদের কাজের হিসাব — কে (actor), কোন কাজ (group), কোন সময় (range)
    getActivity: builder.query({
      query: ({ propertyId, ...params }) => ({ url: PROPERTY_ACTIVITY(propertyId), params }),
      providesTags: ["Activity"],
    }),

    //2. একটা লাইন মোছা — শুধু মূল মালিক
    deleteActivityEntry: builder.mutation({
      query: ({ propertyId, entryId }) => ({ url: `${PROPERTY_ACTIVITY(propertyId)}/${entryId}`, method: 'DELETE' }),
      invalidatesTags: ["Activity"],
    }),

    //3. আজকের, শেষ ৭ দিনের বা শেষ ৩০ দিনের সব মোছা
    clearActivity: builder.mutation({
      query: ({ propertyId, range }) => ({ url: PROPERTY_ACTIVITY(propertyId), method: 'DELETE', params: { range } }),
      invalidatesTags: ["Activity"],
    }),
  }),
});

export const { useGetActivityQuery, useDeleteActivityEntryMutation, useClearActivityMutation } = activityApi;
