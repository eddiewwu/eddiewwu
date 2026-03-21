import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileText } from "lucide-react";
import blogData from "@/data/blog.json";
import type { BlogPost } from "@/types/blog";

const posts = blogData as BlogPost[];

function parseMarkdownLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function Blog() {
  return (
    <section className="w-full py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileText size={32} />
            Blog
          </h2>
        </div>

        <div className="space-y-4">
          {posts.map((post, index) => (
            <Card key={index} className="transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-4">
                  {post.thumbnail && (
                    <img 
                      src={post.thumbnail} 
                      alt="" 
                      className="w-12 h-12 rounded-md object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-semibold text-foreground">{post.title}</h3>
                      <p className="text-sm text-muted-foreground shrink-0">{formatDate(post.date)}</p>
                    </div>
                  </div>
                  {post.featuredImage && (
                    <img 
                      src={post.featuredImage} 
                      alt="" 
                      className="w-48 h-32 rounded-md object-cover shrink-0 hidden sm:block"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <p 
                    className="text-sm text-muted-foreground whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownLinks(post.content) }}
                  />
                </div>
                {post.images && post.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {post.images.map((img, i) => (
                      <a key={i} href={img.src} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={img.src} 
                          alt={img.alt || ''} 
                          className="w-24 h-24 rounded-md object-cover hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Blog;
