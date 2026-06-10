import blogData from "@/data/blog.json";
import type { BlogPost } from "@/types/blog";

const posts = (blogData as BlogPost[]).slice().sort((a, b) => b.date.localeCompare(a.date));

export function getPosts(): BlogPost[] {
  return posts;
}

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function excerpt(content: string, maxLength = 160): string {
  // Strip markdown links down to their text before truncating.
  const plain = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function readingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}
