import { Metadata } from 'next';

import NavBar from "@/components/NavBar";

import "@/pages/globals.css";

export const metadata: Metadata = {
  title: 'Asteria',
  description: '',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" sizes="any" />
      </head>
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  )
}
