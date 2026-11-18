"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Home, Store } from "lucide-react";
import { toast } from "sonner";
import Logo from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { homeOf, landingPath, rememberWorld } from "@/lib/navigation";
import { useUpdateProfileMutation } from "@/redux/features/account/accountApi";
import { useGetMyProfileQuery } from "@/redux/features/auth/authApi";

const CHOICES = [
  { value: ["house"], key: "house", icon: Home, title: "বাসা-বাড়ি / ফ্ল্যাট", text: "পুরো বাড়ি, বা অন্যের বিল্ডিংয়ে আমার ফ্ল্যাট ও দোকান" },
  { value: ["market"], key: "market", icon: Store, title: "মার্কেট / শপিং কমপ্লেক্স", text: "অনেক দোকান — সালামি, সিকিউরিটি, সার্ভিস চার্জ" },
  { value: ["house", "market"], key: "both", icon: Building2, title: "দুটোই", text: "বাড়ি আর মার্কেট — উপরের profile menu থেকে এক চাপে বদল" },
];

// প্রথমবার — কী ভাড়া দেন; শুধু কী দেখাবে তা ঠিক করে, পরে Settings থেকে বদলানো যায়
const WelcomePage = () => {
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const { data } = useGetMyProfileQuery();
  const [updateProfile] = useUpdateProfileMutation();
  const user = data?.data;
  const alreadyChosen = (user?.assetTypes ?? []).length > 0;

  // আগে বাছা হয়ে গেছে — এই পাতার দরকার নেই
  useEffect(() => {
    if (alreadyChosen && !busy) router.replace(landingPath());
  }, [alreadyChosen, busy, router]);

  const choose = async ({ key, value }) => {
    setBusy(key);
    try {
      await updateProfile({ assetTypes: value }).unwrap();
      const world = key === "market" ? "market" : "house";
      rememberWorld(world);
      // মার্কেট — প্রথম কাজ মার্কেট যোগ করা
      router.replace(key === "market" ? "/markets" : homeOf(world));
    } catch (err) {
      setBusy(null);
      toast.error(getErrorMessage(err, "হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <Logo />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">HouseOne এ স্বাগতম{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!</h1>
          <p className="text-base text-muted">আপনি কী ভাড়া দেন? সেই অনুযায়ী আপনার পাতা সাজিয়ে দিচ্ছি।</p>
        </div>
        <div data-welcome-choices className="grid w-full gap-3 sm:grid-cols-3">
          {CHOICES.map((choice) => {
            const { key, icon: Icon, title, text } = choice;
            return (
              <button
                key={key}
                type="button"
                data-welcome={key}
                disabled={!!busy}
                onClick={() => choose(choice)}
                className={cn(
                  "flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-5 text-center shadow-card transition-colors hover:border-primary hover:bg-primary-soft disabled:opacity-60",
                  busy === key && "border-primary bg-primary-soft"
                )}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="text-base font-bold">{title}</span>
                <span className="text-sm text-muted">{text}</span>
              </button>
            );
          })}
        </div>
        <p className="text-sm text-muted">পরে মত বদলালে Settings থেকে বদলাতে পারবেন।</p>
      </div>
    </main>
  );
};

export default WelcomePage;
