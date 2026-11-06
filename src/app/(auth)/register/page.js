"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useSignUpMutation } from "@/redux/features/auth/authApi";

const emptyForm = { name: "", email: "", phone: "", password: "", confirmPassword: "" };

const RegisterPage = () => {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const [signUp, { isLoading }] = useSignUpMutation();

  // লেখা শুরু করলেই সেই ঘরের Error চলে যায়
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors(({ [field]: removed, ...rest }) => rest);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.phone.trim()) newErrors.phone = "Mobile number is required";
    if (form.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const { name, email, phone, password } = form;
      await signUp({ name, email, phone, password }).unwrap();
      toast.success("Account created. Check your email for the OTP.");
      router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Sign up failed. Please try again."));
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted">Your first month is free with all features</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          id="name"
          label="Full name"
          placeholder="Your name"
          autoComplete="name"
          value={form.name}
          onChange={handleChange("name")}
          error={errors.name}
        />
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={handleChange("email")}
          error={errors.email}
        />
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          label="Mobile number"
          placeholder="01XXXXXXXXX"
          autoComplete="tel"
          value={form.phone}
          onChange={handleChange("phone")}
          error={errors.phone}
        />
        <PasswordInput
          id="password"
          label="Password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange("password")}
          error={errors.password}
        />
        <PasswordInput
          id="confirmPassword"
          label="Confirm password"
          placeholder="Type it again"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          error={errors.confirmPassword}
        />

        <Button type="submit" size="lg" fullWidth isLoading={isLoading} className="mt-2">
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
