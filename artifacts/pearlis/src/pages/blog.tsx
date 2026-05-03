import { useListBlogs } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";

export default function BlogList() {
  const { data, isLoading } = useListBlogs();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="pt-24 pb-24 container mx-auto px-6">
        <BackButton className="mb-6" />
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl mb-4">The Journal</h1>
          <div className="w-16 h-px bg-accent mx-auto mb-6"></div>
          <p className="text-muted-foreground">Stories, inspirations, and the world of Pearlis.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : !data || data.blogs.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-xl font-serif">No journal entries found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {data.blogs.map(blog => (
              <div key={blog.id} className="group cursor-pointer">
                <Link href={`/blog/${blog.id}`}>
                  <div className="aspect-[4/3] overflow-hidden mb-6 bg-muted">
                    <img 
                      src={blog.imageUrl} 
                      alt={blog.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="text-xs uppercase tracking-widest text-accent mb-3">
                    {format(new Date(blog.createdAt), "MMMM d, yyyy")}
                  </div>
                  <h2 className="font-serif text-2xl mb-3 group-hover:text-accent transition-colors">{blog.title}</h2>
                  <p className="text-muted-foreground line-clamp-3">{blog.excerpt}</p>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
