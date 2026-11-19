'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import { LISTINGS, LISTING_BY_ID, LISTING_BY_UNIT } from "@/utils/url";

export const listingApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. MY LISTINGS — stats ও ৭ দিনের হিসাবসহ
    getMyListings: builder.query({
      query: (world) => ({ url: LISTINGS, params: world ? { world } : undefined }),
      providesTags: ["Listing"],
    }),

    //2. A UNIT'S OPEN LISTING
    getUnitListing: builder.query({
      query: (unitId) => LISTING_BY_UNIT(unitId),
      providesTags: ["Listing"],
    }),

    //3. POST ON TO-LET
    createListing: builder.mutation({
      query: (body) => ({ url: LISTINGS, method: 'POST', body }),
      invalidatesTags: ["Listing"],
    }),

    //4. EDIT
    updateListing: builder.mutation({
      query: ({ id, ...body }) => ({ url: LISTING_BY_ID(id), method: 'PATCH', body }),
      invalidatesTags: ["Listing"],
    }),

    //5. PAUSE, RESUME, RENEW, CLOSE
    changeListing: builder.mutation({
      query: ({ id, action }) => ({ url: `${LISTING_BY_ID(id)}/${action}`, method: 'POST' }),
      invalidatesTags: ["Listing"],
    }),
  }),
});

export const { useGetMyListingsQuery, useGetUnitListingQuery, useCreateListingMutation, useUpdateListingMutation, useChangeListingMutation } = listingApi;
