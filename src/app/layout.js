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
});

export const metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_TAGLINE,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${bangla.variable}`}>
      <body className="antialiased">
        {/* নিচে, যাতে Notification ঘণ্টা ঢেকে না যায় — মোবাইলে BottomNav এর উপরে */}
        <Toaster richColors position="bottom-right" closeButton mobileOffset={{ bottom: "72px" }} />

        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
