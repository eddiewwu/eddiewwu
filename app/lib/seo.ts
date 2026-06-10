export const SITE_URL = "https://eddiewwu.vercel.app";
export const SITE_NAME = "Ed's Portfolio";

interface PageMetaOptions {
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article";
}

/** Standard meta set: title/description, Open Graph, Twitter card, canonical. */
export function pageMeta({ title, description, path, ogType = "website" }: PageMetaOptions) {
  const url = `${SITE_URL}${path}`;
  return [
    { title },
    { name: "description", content: description },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:type", content: ogType },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { tagName: "link", rel: "canonical", href: url },
  ];
}

export const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Ed Wu",
  url: SITE_URL,
  jobTitle: "Software Engineer",
  worksFor: { "@type": "Organization", name: "State Farm" },
  sameAs: ["https://github.com/eddiewwu", "https://linkedin.com/in/eddiewwu"],
};
