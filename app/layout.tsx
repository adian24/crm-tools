import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={jakarta.variable}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}