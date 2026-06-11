import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

export default {
  ssr: true,
  appDirectory: "app",
  presets: [vercelPreset()],
} satisfies Config;
