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

  const storeApiUrl = (db: IDBDatabase) => {
    const tx = db.transaction('FILE_DATA', 'readwrite').objectStore('FILE_DATA').put(
      {
        contents: new TextEncoder().encode(process.env.API_URL),
        timestamp: new Date(),
        mode: 33206,
      },
      '/userfs/godot/app_userdata/visualizer/api_url'
    );
    tx.onsuccess = () => select(0);
    tx.onerror = () => select(0);
  }

  useEffect(() => {
    const request = window.indexedDB.open('/userfs');
    request.onupgradeneeded = (event) => {
      const db = request.result;
      db.createObjectStore('FILE_DATA');
      const tx = (event.target as any).transaction;
      tx.oncomplete = () => storeApiUrl(db);
      tx.onerror = () => select(0);
    };
    request.onsuccess = () => {
      const db = request.result;
      storeApiUrl(db);
    }
    request.onerror = () => select(0);
  }, []);

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