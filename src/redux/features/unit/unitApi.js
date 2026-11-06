'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import { PROPERTY_UNITS, PROPERTY_UNITS_BULK, UNIT_BY_ID } from "@/utils/url";

// ইউনিট বদলালে বাড়ির Card এর সংখ্যাও বদলায়, তাই Property ও
const CHANGED_TAGS = ["Unit", "Property"];

export const unitApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. UNITS OF A HOUSE
    getPropertyUnits: builder.query({
      query: (propertyId) => PROPERTY_UNITS(propertyId),
      providesTags: ["Unit"],
    }),

    //2. ONE UNIT
    getUnit: builder.query({
      query: (id) => UNIT_BY_ID(id),
      providesTags: ["Unit"],
    }),

    //3. ADD UNIT
    createUnit: builder.mutation({
      query: ({ propertyId, ...body }) => ({
        url: PROPERTY_UNITS(propertyId),
        method: 'POST',
        body,
      }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //4. QUICK ADD
    createUnitsInBulk: builder.mutation({
      query: ({ propertyId, ...body }) => ({
        url: PROPERTY_UNITS_BULK(propertyId),
        method: 'POST',
        body,
      }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //5. UPDATE UNIT
    updateUnit: builder.mutation({
      query: ({ id, ...body }) => ({
        url: UNIT_BY_ID(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //6. DELETE UNIT
    deleteUnit: builder.mutation({
      query: (id) => ({
        url: UNIT_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: CHANGED_TAGS,
    }),
  }),
});

export const {
  useGetPropertyUnitsQuery,
  useGetUnitQuery,
  useCreateUnitMutation,
  useCreateUnitsInBulkMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation,
} = unitApi;
