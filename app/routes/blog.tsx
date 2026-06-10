import type { Route } from "./+types/blog";
import { Blog } from "@/pages/Blog";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Blog | Ed's Portfolio" },
    { name: "description", content: "Writing on software engineering by Ed Wu." },
  ];
}

export default function BlogRoute() {
  return <Blog />;
}
