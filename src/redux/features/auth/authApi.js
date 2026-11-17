'use client';

import { apiSlice } from "@/redux/api/apiSlice";
import {
  FORGOT_PASSWORD,
  GET_MY_PROFILE,
  RESEND_OTP,
  RESET_PASSWORD,
  SIGN_IN,
  SIGN_UP,
  VERIFY_EMAIL,
  VERIFY_OTP,
} from "@/utils/url";

export const authApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    //1. SIGN UP
    signUp: builder.mutation({
      query: (userData) => ({
        url: SIGN_UP,
        method: 'POST',
        body: userData,
      }),
    }),

    //2. VERIFY EMAIL
    verifyEmail: builder.mutation({
      query: (body) => ({
        url: VERIFY_EMAIL,
        method: 'POST',
        body,
      }),
    }),

    //3. RESEND OTP
    resendOtp: builder.mutation({
      query: (body) => ({
        url: RESEND_OTP,
        method: 'POST',
        body,
      }),
    }),

    //4. SIGN -IN
    signIn: builder.mutation({
      query: (Credential) => ({
        url: SIGN_IN,
        method: 'POST',
        body: Credential,
      }),
    }),

    //5. FORGOT PASSWORD
    forgotPassword: builder.mutation({
      query: (body) => ({
        url: FORGOT_PASSWORD,
        method: 'POST',
        body,
      }),
    }),

    //6. VERIFY RESET OTP
    verifyOtp: builder.mutation({
      query: (body) => ({
        url: VERIFY_OTP,
        method: 'POST',
        body,
      }),
    }),

    //7. RESET PASSWORD
    resetPassword: builder.mutation({
      query: (body) => ({
        url: RESET_PASSWORD,
        method: 'POST',
        body,
      }),
    }),

    //8. MY PROFILE
    getMyProfile: builder.query({
      query: () => GET_MY_PROFILE,
      providesTags: ["User"],
    }),
  }),
});

export const {
  useSignUpMutation,
  useVerifyEmailMutation,
  useResendOtpMutation,
  useSignInMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useGetMyProfileQuery,
} = authApi;
