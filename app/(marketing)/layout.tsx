import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

export const metadata: Metadata = {
  metadataBase: new URL("https://blackmass.co.uk"),
  title: {
    default: "Blackmass Enterprises — Building Infrastructure. Creating Value.",
    template: "Blackmass Enterprises — %s",
  },
  description:
    "Blackmass Enterprises Ltd is a British-Zimbabwean holding company operating across fintech, digital assets, AI, music IP protection, and live entertainment. Home of ZimX Finance, ZiGX, ZiRA, Project TG, and LoveMusicLive.",
  keywords: [
    "Blackmass Enterprises",
    "Blackmass",
    "ZimX Finance",
    "ZiGX",
    "ZiRA",
    "Project TG",
    "LoveMusicLive",
    "Emperor Roy",
    "British-Zimbabwean",
    "holding company",
    "fintech",
    "digital assets",
    "AI",
  ],
  authors: [{ name: "Blackmass Enterprises Ltd" }],
  creator: "Blackmass Enterprises Ltd",
  publisher: "Blackmass Enterprises Ltd",
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://blackmass.co.uk",
    siteName: "Blackmass Enterprises",
    title: "Blackmass Enterprises — Building Infrastructure. Creating Value.",
    description:
      "A British-Zimbabwean holding company operating across fintech, digital assets, AI, music IP protection, and live entertainment.",
    images: [
      {
        url: "/images/blackmass.png",
        width: 1200,
        height: 630,
        alt: "Blackmass Enterprises",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blackmass Enterprises — Building Infrastructure. Creating Value.",
    description:
      "A British-Zimbabwean holding company operating across fintech, digital assets, AI, music IP protection, and live entertainment.",
    images: ["/images/blackmass.png"],
    creator: "@Roy_BME",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Blackmass Enterprises Ltd",
  url: "https://blackmass.co.uk",
  logo: "https://blackmass.co.uk/images/blackmass.png",
  description:
    "A British-Zimbabwean holding company operating across fintech, digital assets, AI, music IP protection, and live entertainment.",
  foundingDate: "2024",
  founder: {
    "@type": "Person",
    name: "Emperor Roy",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Milton Keynes",
    addressCountry: "GB",
  },
  identifier: "16124799",
  email: "hello@zimx.finance",
  sameAs: [
    "https://twitter.com/Roy_BME",
    "https://instagram.com/Roy_BME",
  ],
  subOrganization: [
    { "@type": "Organization", name: "ZimX Finance", url: "https://zimx.finance" },
    { "@type": "Organization", name: "ZiRA", url: "https://askzira.ai" },
    { "@type": "Organization", name: "ZiGX", url: "https://zigx.io" },
    { "@type": "Organization", name: "Project TG" },
    { "@type": "Organization", name: "LoveMusicLive" },
  ],
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = headers().get("x-nonce") ?? undefined;
  // Escape `</script>` (and any raw `<`) so a malicious value leaking into
  // organizationSchema cannot close our tag and start an attacker script.
  const ldJson = JSON.stringify(organizationSchema).replace(/</g, "\\u003c");

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: ldJson }}
      />
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
