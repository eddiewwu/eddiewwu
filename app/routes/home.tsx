import type { Route } from "./+types/home";
import { Home } from "@/pages/Home";
import { pageMeta, personJsonLd } from "@/lib/seo";

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({
      title: "Ed Wu | Software Engineer",
      description:
        "Ed Wu — software engineer building modern web applications. Portfolio, work experience, projects, and blog.",
      path: "/",
    }),
    { "script:ld+json": personJsonLd },
  ];
}

export default function HomeRoute() {
  return <Home />;
}
