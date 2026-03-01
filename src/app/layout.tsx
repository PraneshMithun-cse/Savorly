import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Savourly",
  description: "Premium Fitness Diet Plans",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js" strategy="beforeInteractive" />
        <Script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js" strategy="beforeInteractive" />
        <Script id="firebase-init" strategy="beforeInteractive">
          {`
            const firebaseConfig = {
                apiKey: "AIzaSyAbOyzOi3xqyXNLWrmkL7pqMrxk_opjW1I",
                authDomain: "savorly-d2e63.firebaseapp.com",
                projectId: "savorly-d2e63",
                storageBucket: "savorly-d2e63.firebasestorage.app",
                messagingSenderId: "820941077673",
                appId: "1:820941077673:web:feffe61f09d5970c477db8",
                measurementId: "G-E3YQ1VSL75"
            };
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
          `}
        </Script>
        <Script src="/assets/js/auth-state.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
