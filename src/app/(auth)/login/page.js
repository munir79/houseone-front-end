"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import { setToken } from "@/lib/authStorage";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useSignInMutation } from "@/redux/features/auth/authApi";
import { landingPath } from "@/lib/navigation";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const [signIn, { isLoading }] = useSignInMutation();

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await signIn({ email, password }).unwrap();
      setToken(response.data.token);
      toast.success("Login successful!");
      router.replace(landingPath());
    } catch (err) {
      if (err?.data?.code === "EMAIL_NOT_VERIFIED") {
        toast.info("We sent an OTP to your email. Please verify it first.");
        router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
        return;
      }
      toast.error(getErrorMessage(err, "Login failed. Please try again."));
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to your HouseOne account</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors(({ email: removed, ...rest }) => rest);
          }}
          error={errors.email}
        />
        <PasswordInput
          id="password"
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors(({ password: removed, ...rest }) => rest);
          }}
          error={errors.password}
        />

        <Link href="/forgot-password" className="self-end text-sm font-medium text-primary hover:underline">
          Forgot your password?
        </Link>

        <Button type="submit" size="lg" fullWidth isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
