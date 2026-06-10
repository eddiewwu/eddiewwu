import { getPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/seo";

// Resource route, emitted as a static file at build time via the prerender list.
export function loader() {
  const staticPaths = ["/", "/blog"];
  const postPaths = getPosts().map((p) => `/blog/${p.slug}`);

  const urls = [...staticPaths, ...postPaths]
    .map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
