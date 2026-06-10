import type { Route } from "./+types/home";
import { Home } from "@/pages/Home";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Ed's Portfolio" },
    { name: "description", content: "Ed Wu — software engineer. Portfolio, projects, and blog." },
  ];
}

export default function HomeRoute() {
  return <Home />;
}
