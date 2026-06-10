export interface Project {
  title: string;
  description: string;
  technologies: string[];
  github: string;
  liveDemo: string;
}

export const projects: Project[] = [
  {
    title: "Online Collaborative Code Editor",
    description:
      "Built a real-time collaborative code editor using Yjs CRDT for conflict-free data synchronization, Monaco Editor for a rich coding experience, and Websockets for low-latency communication, and OAuth 2.0 for secure user authentication.",
    technologies: ["Typescript", "React", "Websockets", "Tailwind CSS", "Yjs", "CRDT", "Express", "Node JS"],
    github: "https://github.com/eddiewwu/eddiewwu",
    liveDemo: "https://eddiewwu.vercel.app/collaborate",
  },
  {
    title: "Personal Portfolio Website",
    description:
      "Wanted to learn more about Bun + Shadcn + Tailwind CSS, so I built my personal portfolio website from scratch using these technologies.",
    technologies: ["Typescript", "React", "Bun", "Vite", "Shadcn", "Tailwind CSS", "OAuth2.0"],
    github: "https://github.com/eddiewwu/eddiewwu",
    liveDemo: "https://eddiewwu.vercel.app/",
  },
];
