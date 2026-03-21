export interface BlogImage {
  src: string;
  alt?: string;
}

export interface BlogPost {
  id: number;
  title: string;
  date: string;
  thumbnail?: string | null;
  featuredImage?: string | null;
  content: string;
  images?: BlogImage[];
}
