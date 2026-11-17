// src/redux/api/apiSlice.js

import { clearAuth, getToken } from "@/lib/authStorage";
import { baseUriBackend } from "@/utils/url";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: baseUriBackend,

  // set header
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Token এর মেয়াদ শেষ হলে Login Page এ পাঠানো
const baseQueryWithAuth = async (args, api, extraOptions) => {
  const token = getToken();
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && token) {
    clearAuth();
    window.location.replace("/login");
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["User", "Notification", "Property", "ServiceContact", "Unit", "Tenancy", "TenantForm", "Bill", "Issue", "Payment", "Expense", "Sharing", "Listing", "Access"],
  endpoints: () => ({}),
});
