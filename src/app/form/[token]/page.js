"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Lock, X } from "lucide-react";
import PublicFormFlow from "@/components/tenantForm/PublicFormFlow";
import Card from "@/components/ui/Card";
import Logo from "@/components/ui/Logo";
import Skeleton from "@/components/ui/Skeleton";
import { useGetPublicFormQuery } from "@/redux/features/tenantForm/tenantFormApi";

const Shell = ({ children }) => (
  <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-4 py-6">
    <div className="flex justify-center">
      <Logo />
    </div>
    {children}
  </main>
);

const Message = ({ icon: Icon, title, text }) => (
  <Shell>
    <Card className="flex flex-col items-center gap-2 py-10 text-center">
      <Icon className="h-10 w-10 text-muted" strokeWidth={1.5} aria-hidden="true" />
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="text-sm text-muted">{text}</p>
    </Card>
  </Shell>
);

const PublicFormPage = () => {
  const { token } = useParams();
  const [isDone, setIsDone] = useState(false);
  const { data, error, isLoading } = useGetPublicFormQuery(token);

  if (isDone) return <Message icon={CheckCircle2} title="ধন্যবাদ, ফর্ম জমা হয়েছে" text="বাড়িওয়ালা আপনার তথ্য দেখে নেবেন। এখন এই পেজ বন্ধ করতে পারেন।" />;

  if (isLoading) {
    return (
      <Shell>
        <Skeleton className="h-96 w-full rounded-xl" />
      </Shell>
    );
  }

  const form = data?.data;

  if (error || !form) return <Message icon={X} title="লিংকটি সঠিক নয়" text="বাড়িওয়ালার কাছ থেকে সঠিক লিংকটি নিন।" />;
  if (form.isExpired) return <Message icon={Lock} title="লিংকের মেয়াদ শেষ" text="বাড়িওয়ালাকে বলুন, তিনি আবার মেয়াদ বাড়িয়ে দিতে পারবেন।" />;
  if (!form.canFill) return <Message icon={CheckCircle2} title="এই ফর্মটি বন্ধ হয়ে গেছে" text="ফর্মটি আগেই জমা হয়েছে বা বাতিল হয়েছে। কিছু বদলাতে হলে বাড়িওয়ালাকে বলুন।" />;

  return (
    <Shell>
      <PublicFormFlow token={token} form={form} onDone={() => setIsDone(true)} />
    </Shell>
  );
};

export default PublicFormPage;
