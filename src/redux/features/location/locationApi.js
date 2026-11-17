'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import { LOCATION_AREAS, LOCATION_REVERSE, LOCATION_SEARCH, UPLOAD_SIGNATURE } from "@/utils/url";

export const locationApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. CITY AND AREA LIST
    getLocations: builder.query({
      query: () => LOCATION_AREAS,
      keepUnusedDataFor: 3600,
    }),

    //2. MAP SEARCH
    searchPlaces: builder.query({
      query: (q) => ({ url: LOCATION_SEARCH, params: { q } }),
    }),

    //3. GPS POINT TO PLACE — জেলা ও এলাকা
    reversePlace: builder.query({
      query: ({ lat, lng }) => ({ url: LOCATION_REVERSE, params: { lat, lng } }),
    }),

    //4. IMAGE UPLOAD SIGNATURE
    getUploadSignature: builder.mutation({
      query: (target) => ({
        url: UPLOAD_SIGNATURE,
        method: 'POST',
        body: { target },
      }),
    }),
  }),
});

export const { useGetLocationsQuery, useSearchPlacesQuery, useLazyReversePlaceQuery, useGetUploadSignatureMutation } = locationApi;
