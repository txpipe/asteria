import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import "../styles/global.css";

const description = "A Cardano bot challenge to showcase the capabilities of the eUTxO model";

export const metadata = {
  metadataBase: new URL("https://asteria.txpipe.io"),
  title: {
    default: "Asteria",
    template: "%s – Asteria",
  },
  description,
  alternates: {
    canonical: "https://asteria.txpipe.io",
  },
  openGraph: {
    url: "https://asteria.txpipe.io",
    siteName: "Asteria",
    title: "Asteria",
    description,
    images: [
      {
        url: "https://asteria.txpipe.io/logo-full.png",
        width: 496,
        height: 496,
        alt: "Asteria",
        type: "image/png",
      },
    ],
  },
};

const navbar = (
  <Navbar
    logo={<h1 className="font-bold text-4xl md:text-4xl lg:text-5xl">Asteria</h1>}
    projectLink="https://github.com/txpipe/asteria"
    chatLink="https://discord.gg/Vc3x8N9nz2"
  />
);

const footer = <Footer>Asteria - TxPipe</Footer>;

export default async function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/txpipe/asteria/tree/main/docs"
          nextThemes={{ defaultTheme: "dark" }}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
