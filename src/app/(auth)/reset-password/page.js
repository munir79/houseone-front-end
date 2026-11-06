"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Skeleton from "@/components/ui/Skeleton";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useResetPasswordMutation, useVerifyOtpMutation } from "@/redux/features/auth/authApi";

const ResetPasswordForm = () => {
  const router = useRouter();
  const email = useSearchParams().get("email") || "";
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setErrors({ otp: "Enter the 6 digit OTP" });
      return;
    }
    setErrors({});

    try {
      const response = await verifyOtp({ email, otp: otp.trim() }).unwrap();
      setResetToken(response.data.resetToken);
    } catch (err) {
      setErrors({ otp: getErrorMessage(err, "Could not verify the OTP.") });
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const response = await resetPassword({ resetToken, newPassword: password }).unwrap();
      toast.success(response.message);
      router.replace("/login");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not reset the password."));
    }
  };

  if (!email) {
    return (
      <p className="text-center text-sm text-muted">
        Email is missing.{" "}
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          Start again
        </Link>
      </p>
    );
  }

  if (!resetToken) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Enter the OTP</h1>
          <p className="mt-1 text-sm wrap-break-word text-muted">
            If <span className="font-medium text-foreground">{email}</span> is registered, we sent a 6 digit code
          </p>
        </div>

        <form onSubmit={handleVerify} noValidate className="flex flex-col gap-4">
          <Input
            id="otp"
            label="OTP"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            error={errors.otp}
          />

          <Button type="submit" size="lg" fullWidth isLoading={isVerifying}>
            Continue
          </Button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Send the OTP again
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <p className="mt-1 text-sm text-muted">Choose a password you have not used before</p>
      </div>

      <form onSubmit={handleReset} noValidate className="flex flex-col gap-4">
        <PasswordInput
          id="password"
          label="New password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <PasswordInput
          id="confirmPassword"
          label="Confirm password"
          placeholder="Type it again"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />

        <Button type="submit" size="lg" fullWidth isLoading={isResetting}>
          Reset Password
        </Button>
      </form>
    </div>
  );
};

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;
