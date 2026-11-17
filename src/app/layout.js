import { Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import ReduxProvider from "@/redux/reduxProvider/ReduxProvider";
import { Toaster } from "sonner";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

// বাংলা লেখার জন্য — ইংরেজি Font এ বাংলা অক্ষর নেই। সংখ্যা স্পষ্ট, আর ফাইলটা নিজেদের কাছেই থাকে
const bangla = localFont({
  src: "./fonts/NotoSansBengali-Variable.woff2",
  variable: "--font-bangla",
  weight: "100 900",
  display: "swap",
  // একই মাপে বাংলা ইংরেজির চেয়ে ছোট দেখায়
  declarations: [{ prop: "size-adjust", value: "108%" }],
});

export const metadata = {
  // শেয়ার করা link এর ছবি ও ঠিকানা পুরো URL এ — Live এ NEXT_PUBLIC_SITE_URL দিন
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_TAGLINE,
};
// new change

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${bangla.variable}`}>
      {/* Browser Extension (যেমন ColorZilla) body তে নিজের Attribute বসায় — শুধু body র Attribute এর অমিল উপেক্ষা, ভেতরের কিছু নয় */}
      <body className="antialiased" suppressHydrationWarning>
        {/* নিচে, যাতে Notification ঘণ্টা ঢেকে না যায় — মোবাইলে BottomNav এর উপরে */}
        <Toaster richColors position="bottom-right" closeButton mobileOffset={{ bottom: "72px" }} />

        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
