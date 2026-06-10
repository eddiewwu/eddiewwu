import { Link } from "react-router";
import type { Route } from "./+types/blog";
import { getPosts, excerpt, formatDate, readingTime } from "@/lib/blog";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Blog | Ed's Portfolio" },
    { name: "description", content: "Writing on software engineering by Ed Wu." },
  ];
}

export default function BlogIndex() {
  const posts = getPosts();
  return (
    <section className="w-full py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Writing</p>
        <h1 className="text-3xl font-semibold tracking-tight mb-10">Blog</h1>

        <div className="space-y-10">
          {posts.map((post) => (
            <article key={post.slug}>
              <Link to={`/blog/${post.slug}`} className="group block">
                <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
              </Link>
              <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                {formatDate(post.date)} · {readingTime(post.content)}
              </p>
              <p className="mt-2 text-muted-foreground">{excerpt(post.content)}</p>
              <Link
                to={`/blog/${post.slug}`}
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                Read post →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
