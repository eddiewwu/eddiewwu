import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";
import blogPosts from "./app/data/blog.json";

export default {
  ssr: false,
  appDirectory: "app",
  presets: [vercelPreset()],
  prerender: ["/", "/blog", ...blogPosts.map((p) => `/blog/${p.slug}`)],
} satisfies Config;
