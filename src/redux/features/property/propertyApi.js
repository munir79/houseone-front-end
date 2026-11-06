'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import { PROPERTIES, PROPERTY_BY_ID, PROPERTY_CONTACTS, PROPERTY_CONTACT_BY_ID, PROPERTY_SUMMARY } from "@/utils/url";

export const propertyApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. MY HOUSES
    getProperties: builder.query({
      query: (params) => ({ url: PROPERTIES, params }),
      providesTags: ["Property"],
    }),

    //SUMMARY FOR THE PROPERTIES PAGE
    getPropertySummary: builder.query({
      query: () => PROPERTY_SUMMARY,
      providesTags: ["Property", "Unit"],
    }),

    //2. ONE HOUSE
    getProperty: builder.query({
      query: (id) => PROPERTY_BY_ID(id),
      providesTags: ["Property"],
    }),

    //3. ADD HOUSE
    createProperty: builder.mutation({
      query: (body) => ({
        url: PROPERTIES,
        method: 'POST',
        body,
      }),
      invalidatesTags: ["Property"],
    }),

    //4. UPDATE HOUSE
    updateProperty: builder.mutation({
      query: ({ id, ...body }) => ({
        url: PROPERTY_BY_ID(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ["Property"],
    }),

    //5. DELETE HOUSE
    deleteProperty: builder.mutation({
      query: (id) => ({
        url: PROPERTY_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: ["Property"],
    }),

    //6. CONTACTS
    getContacts: builder.query({
      query: (propertyId) => PROPERTY_CONTACTS(propertyId),
      providesTags: ["ServiceContact"],
    }),

    //7. ADD CONTACT
    createContact: builder.mutation({
      query: ({ propertyId, ...body }) => ({
        url: PROPERTY_CONTACTS(propertyId),
        method: 'POST',
        body,
      }),
      invalidatesTags: ["ServiceContact"],
    }),

    //8. UPDATE CONTACT
    updateContact: builder.mutation({
      query: ({ propertyId, contactId, ...body }) => ({
        url: PROPERTY_CONTACT_BY_ID(propertyId, contactId),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ["ServiceContact"],
    }),

    //9. DELETE CONTACT
    deleteContact: builder.mutation({
      query: ({ propertyId, contactId }) => ({
        url: PROPERTY_CONTACT_BY_ID(propertyId, contactId),
        method: 'DELETE',
      }),
      invalidatesTags: ["ServiceContact"],
    }),
  }),
});

export const {
  useGetPropertiesQuery,
  useGetPropertySummaryQuery,
  useGetPropertyQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
  useGetContactsQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
} = propertyApi;
