"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import { setToken } from "@/lib/authStorage";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useResendOtpMutation, useVerifyEmailMutation } from "@/redux/features/auth/authApi";

const RESEND_SECONDS = 60;

const VerifyEmailForm = () => {
  const router = useRouter();
  const email = useSearchParams().get("email") || "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setError("Enter the 6 digit OTP");
      return;
    }
    setError("");

    try {
      const response = await verifyEmail({ email, otp: otp.trim() }).unwrap();
      setToken(response.data.token);
      toast.success("Email verified. Welcome to HouseOne!");
      router.replace("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Could not verify the OTP."));
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp({ email }).unwrap();
      toast.success("A new OTP has been sent.");
      setSecondsLeft(RESEND_SECONDS);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not send the OTP."));
    }
  };

  if (!email) {
    return (
      <p className="text-center text-sm text-muted">
        Email is missing.{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Go back to sign up
        </Link>
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="mt-1 text-sm wrap-break-word text-muted">
          We sent a 6 digit code to <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          id="otp"
          label="OTP"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          error={error}
        />

        <Button type="submit" size="lg" fullWidth isLoading={isLoading}>
          Verify Email
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Button variant="ghost" disabled={secondsLeft > 0} isLoading={isResending} onClick={handleResend}>
          {secondsLeft > 0 ? `Resend OTP in ${secondsLeft}s` : "Resend OTP"}
        </Button>
      </div>
    </div>
  );
};

const VerifyEmailPage = () => {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <VerifyEmailForm />
    </Suspense>
  );
};

export default VerifyEmailPage;
