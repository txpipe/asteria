import { useEffect } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import type { ReactElement, ReactNode } from 'react';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';

import NavBar from "@/components/NavBar";
import { useChallengeStore } from '@/stores/challenge';

import "./globals.css";
 
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}
 
type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

const client = new ApolloClient({
  uri: `${process.env.API_URL}/graphql`,
  cache: new InMemoryCache(),
});
 
export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const { select, selected } = useChallengeStore();

  useEffect(() => select(0), []);

  return (
    <ApolloProvider client={client}>
      { selected !== null && (
        <>
          <NavBar />
          <Component {...pageProps} />
        </>
      )}
    </ApolloProvider>
  );
}