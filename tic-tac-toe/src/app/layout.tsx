"use client";

import { TamboProvider } from "@tambo-ai/react";
import "./globals.css";

declare const process: {
  env: {
    NEXT_PUBLIC_TAMBO_API_KEY?: string;
    [key: string]: string | undefined;
  };
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TamboProvider apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}>
          {children}
        </TamboProvider>
      </body>
    </html>
  );
}
