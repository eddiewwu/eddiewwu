import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("blog", "routes/blog.tsx"),
  route("collaborate", "routes/collaborate.tsx"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
