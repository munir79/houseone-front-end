'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import { EXPENSES, EXPENSE_BY_ID, EXPENSE_RECURRING, EXPENSE_RECURRING_BY_ID } from "@/utils/url";

// খরচ বদলালে Dashboard এর লাভও বদলায়
const CHANGED_TAGS = ["Expense"];

export const expenseApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. EXPENSES OF A MONTH — সারাংশ ও লাভসহ
    getExpenses: builder.query({
      query: (params) => ({ url: EXPENSES, params }),
      providesTags: ["Expense", "Bill"],
    }),

    //2. ADD
    createExpense: builder.mutation({
      query: (body) => ({ url: EXPENSES, method: 'POST', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //3. EDIT
    updateExpense: builder.mutation({
      query: ({ id, ...body }) => ({ url: EXPENSE_BY_ID(id), method: 'PATCH', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //4. MONTHLY DRAFT PAID
    payExpense: builder.mutation({
      query: ({ id, ...body }) => ({ url: `${EXPENSE_BY_ID(id)}/pay`, method: 'POST', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //5. DELETE
    deleteExpense: builder.mutation({
      query: (id) => ({ url: EXPENSE_BY_ID(id), method: 'DELETE' }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //6. MONTHLY EXPENSES
    getRecurringExpenses: builder.query({
      query: () => EXPENSE_RECURRING,
      providesTags: ["Expense"],
    }),

    //7. ADD MONTHLY
    createRecurringExpense: builder.mutation({
      query: (body) => ({ url: EXPENSE_RECURRING, method: 'POST', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //8. EDIT MONTHLY
    updateRecurringExpense: builder.mutation({
      query: ({ id, ...body }) => ({ url: EXPENSE_RECURRING_BY_ID(id), method: 'PATCH', body }),
      invalidatesTags: CHANGED_TAGS,
    }),

    //9. STOP MONTHLY
    stopRecurringExpense: builder.mutation({
      query: (id) => ({ url: EXPENSE_RECURRING_BY_ID(id), method: 'DELETE' }),
      invalidatesTags: CHANGED_TAGS,
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useLazyGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  usePayExpenseMutation,
  useDeleteExpenseMutation,
  useGetRecurringExpensesQuery,
  useCreateRecurringExpenseMutation,
  useUpdateRecurringExpenseMutation,
  useStopRecurringExpenseMutation,
} = expenseApi;
