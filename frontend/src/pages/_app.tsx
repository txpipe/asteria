import type { ReactElement, ReactNode } from 'react';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import Head from 'next/head';

import NavBar from "@/components/ui/NavBar";
import Footer from '@/components/ui/Footer';

import "./globals.css";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  return (
    <>
      <Head>
        <title>Asteria</title>
      </Head>
      <>
        <NavBar />
        <Component {...pageProps} />
        <Footer />
      </>
    </>
  );
}