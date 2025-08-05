import { Metadata } from 'next';

import NavBar from "@/components/ui/NavBar";
import Footer from '@/components/ui/Footer';

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
        <Footer />
      </body>
    </html>
  )
}
