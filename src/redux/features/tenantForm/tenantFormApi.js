'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import {
  FORM_SETTINGS,
  PUBLIC_FORM,
  PUBLIC_FORM_SIGNATURE,
  PUBLIC_FORM_SUBMIT,
  TENANT_FORMS,
  TENANT_FORM_ACTION,
  TENANT_FORM_BY_ID,
  TENANT_FORM_BY_UNIT,
} from "@/utils/url";

const CHANGED_TAGS = ["TenantForm", "Tenancy", "Unit", "Property"];

export const tenantFormApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. HOUSE SETTINGS
    getFormSettings: builder.query({
      query: (propertyId) => FORM_SETTINGS(propertyId),
      providesTags: ["TenantForm"],
    }),

    //2. SAVE SETTINGS
    updateFormSettings: builder.mutation({
      query: ({ propertyId, types }) => ({ url: FORM_SETTINGS(propertyId), method: 'PUT', body: types }),
      invalidatesTags: ["TenantForm"],
    }),

    //3. OPEN FORMS
    getOpenForms: builder.query({
      query: () => TENANT_FORMS,
      providesTags: ["TenantForm"],
    }),

    //4. OPEN FORM OF A UNIT
    getUnitForm: builder.query({
      query: (unitId) => TENANT_FORM_BY_UNIT(unitId),
      providesTags: ["TenantForm"],
    }),

    //5. ONE FORM
    getTenantForm: builder.query({
      query: (id) => TENANT_FORM_BY_ID(id),
      providesTags: ["TenantForm"],
    }),

    //6. CREATE LINK
    createTenantForm: builder.mutation({
      query: (body) => ({ url: TENANT_FORMS, method: 'POST', body }),
      invalidatesTags: ["TenantForm"],
    }),

    //7. SEND BACK, EXTEND, CANCEL
    formAction: builder.mutation({
      query: ({ id, action, ...body }) => ({ url: TENANT_FORM_ACTION(id, action), method: 'POST', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //8. FULL NID
    revealFormNid: builder.mutation({
      query: (id) => `${TENANT_FORM_BY_ID(id)}/nid`,
    }),

    //9. DOCUMENT LINKS
    getFormDocumentLinks: builder.mutation({
      query: (id) => `${TENANT_FORM_BY_ID(id)}/documents`,
    }),

    //10. TENANT SIDE — OPEN THE FORM
    getPublicForm: builder.query({
      query: (token) => PUBLIC_FORM(token),
    }),

    //11. TENANT SIDE — UPLOAD
    getPublicFormSignature: builder.mutation({
      query: (token) => ({ url: PUBLIC_FORM_SIGNATURE(token), method: 'POST' }),
    }),

    //12. TENANT SIDE — SUBMIT
    submitPublicForm: builder.mutation({
      query: ({ token, ...body }) => ({ url: PUBLIC_FORM_SUBMIT(token), method: 'POST', body }),
    }),
  }),
});

export const {
  useGetFormSettingsQuery,
  useUpdateFormSettingsMutation,
  useGetOpenFormsQuery,
  useGetUnitFormQuery,
  useGetTenantFormQuery,
  useCreateTenantFormMutation,
  useFormActionMutation,
  useRevealFormNidMutation,
  useGetFormDocumentLinksMutation,
  useGetPublicFormQuery,
  useGetPublicFormSignatureMutation,
  useSubmitPublicFormMutation,
} = tenantFormApi;
