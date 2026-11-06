import { Hind_Siliguri, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/redux/reduxProvider/ReduxProvider";
import { Toaster } from "sonner";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

// বাংলা লেখার জন্য — ইংরেজি Font এ বাংলা অক্ষর নেই
const hind = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_TAGLINE,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${hind.variable}`}>
      <body className="antialiased">
        {/* নিচে, যাতে Notification ঘণ্টা ঢেকে না যায় — মোবাইলে BottomNav এর উপরে */}
        <Toaster richColors position="bottom-right" closeButton mobileOffset={{ bottom: "72px" }} />

        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
