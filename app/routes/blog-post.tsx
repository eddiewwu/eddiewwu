import { Link, data } from "react-router";
import type { Route } from "./+types/blog-post";
import { getPost, formatDate, readingTime, excerpt } from "@/lib/blog";
import { Markdown } from "@/components/shared/markdown";

// Runs at build time only (prerendered, ssr:false).
export function loader({ params }: Route.LoaderArgs) {
  const post = getPost(params.slug);
  if (!post) throw data("Post not found", { status: 404 });
  return { post };
}

export function meta({ data: loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Post not found | Ed's Portfolio" }];
  const { post } = loaderData;
  return [
    { title: `${post.title} | Ed's Portfolio` },
    { name: "description", content: excerpt(post.content) },
    { property: "og:type", content: "article" },
    { property: "og:title", content: post.title },
    { property: "og:description", content: excerpt(post.content) },
    { property: "article:published_time", content: post.date },
  ];
}

export default function BlogPost({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData;
  return (
    <article className="w-full py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link to="/blog" className="text-sm text-primary hover:underline">
          ← All posts
        </Link>

        <header className="mt-6 mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{post.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground tabular-nums">
            {formatDate(post.date)} · {readingTime(post.content)}
          </p>
        </header>

        {post.featuredImage && (
          <img src={post.featuredImage} alt="" className="mb-8 w-full rounded-xl object-cover" />
        )}

        <div className="prose dark:prose-invert prose-neutral max-w-none">
          <Markdown>{post.content}</Markdown>
        </div>

        {post.images && post.images.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {post.images.map((img, i) => (
              <a key={i} href={img.src} target="_blank" rel="noopener noreferrer">
                <img
                  src={img.src}
                  alt={img.alt || ""}
                  className="w-28 h-28 rounded-md object-cover hover:opacity-80 transition-opacity"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
