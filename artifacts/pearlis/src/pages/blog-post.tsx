import { useRoute, Link } from "wouter";
import { useGetBlog, useListBlogs } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { format } from "date-fns";
import { Loader2, ArrowLeft, ArrowRight, Clock, User, Tag, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

function estimateReadTime(text: string): number {
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

function RichContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="font-serif text-2xl md:text-3xl text-[#0F0F0F] mt-12 mb-5 leading-snug">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={i} className="font-serif text-3xl md:text-4xl text-[#0F0F0F] mt-12 mb-6 leading-snug">
          {trimmed.slice(2)}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="font-serif text-xl text-[#0F0F0F] mt-8 mb-3 leading-snug">
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-[#D4AF37] pl-6 my-8 py-1">
          <p className="font-serif text-xl md:text-2xl text-[#0F0F0F]/70 italic leading-relaxed">
            {trimmed.slice(2)}
          </p>
        </blockquote>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-5 space-y-2 pl-5">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-[#0F0F0F]/70 text-base leading-relaxed">
              <span className="mt-2 w-1 h-1 rounded-full bg-[#D4AF37] shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\. /.test(trimmed)) {
      const items: string[] = [];
      let num = 1;
      while (i < lines.length && new RegExp(`^${num}\\. `).test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\. /, ""));
        i++; num++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-5 space-y-2 pl-5 list-decimal list-inside">
          {items.map((item, j) => (
            <li key={j} className="text-[#0F0F0F]/70 text-base leading-relaxed">{item}</li>
          ))}
        </ol>
      );
      continue;
    } else if (trimmed.startsWith("---") || trimmed.startsWith("***")) {
      elements.push(<div key={i} className="my-10 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#D4AF37]/20" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/50" />
        <div className="h-px flex-1 bg-[#D4AF37]/20" />
      </div>);
    } else {
      const inlineFormatted = trimmed
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[#0F0F0F]">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
        .replace(/`(.+?)`/g, '<code class="bg-[#FAF8F3] px-1.5 py-0.5 text-sm rounded font-mono text-[#0F0F0F]">$1</code>');

      elements.push(
        <p key={i} className="text-[#0F0F0F]/70 text-base md:text-[17px] leading-[1.9] mb-5"
          dangerouslySetInnerHTML={{ __html: inlineFormatted }} />
      );
    }
    i++;
  }

  return <>{elements}</>;
}

export default function BlogPost() {
  const [, params] = useRoute("/blog/:id");
  const blogId = parseInt(params?.id || "0");
  const { toast } = useToast();

  const { data: blog, isLoading } = useGetBlog(blogId, { query: { enabled: !!blogId } });
  const { data: allBlogs } = useListBlogs();

  const readTime = blog?.content ? estimateReadTime(blog.content) : 1;

  const otherBlogs = (allBlogs?.blogs || []).filter(b => b.id !== blogId).slice(0, 3);

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: blog?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard" });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="font-serif text-2xl text-[#0F0F0F]/50">Post not found</p>
          <Link href="/blog" className="text-[10px] tracking-[0.25em] uppercase text-[#D4AF37] border-b border-[#D4AF37]/40 pb-0.5">
            Back to Journal
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="relative w-full overflow-hidden bg-[#0F0F0F]" style={{ minHeight: "60vh" }}>
        {blog.imageUrl && (
          <img
            src={blog.imageUrl}
            alt={blog.title}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/50 to-transparent" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-36 pb-20">
          <motion.div {...fadeUp()}>
            <Link href="/blog" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 text-[10px] tracking-[0.2em] uppercase font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Journal
            </Link>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6">
              {(Array.isArray(blog.tags) ? blog.tags : []).slice(0, 3).map(tag => (
                <span key={tag} className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.28em] uppercase text-[#D4AF37] font-bold">
                  <Tag className="w-2.5 h-2.5" /> {tag}
                </span>
              ))}
            </div>

            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white leading-[1.15] mb-8">
              {blog.title}
            </h1>

            <div className="flex flex-wrap items-center gap-5 text-white/40 text-xs">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> {blog.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {format(new Date(blog.createdAt), "MMMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {readTime} min read
              </span>
              <button onClick={handleShare} className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors ml-auto">
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Article */}
      <div className="flex-1 bg-white">
        <motion.article
          {...fadeUp(0.1)}
          className="max-w-3xl mx-auto px-6 py-14 md:py-20"
        >
          {blog.excerpt && (
            <p className="font-serif text-xl md:text-2xl text-[#0F0F0F]/60 leading-[1.7] mb-10 pb-10 border-b border-[#D4AF37]/15 italic">
              {blog.excerpt}
            </p>
          )}

          <RichContent content={blog.content} />
        </motion.article>
      </div>

      {/* Tags */}
      {(Array.isArray(blog.tags) ? blog.tags : []).length > 0 && (
        <div className="bg-white border-t border-[#D4AF37]/10">
          <div className="max-w-3xl mx-auto px-6 py-8 flex flex-wrap items-center gap-3">
            <span className="text-[9px] tracking-[0.3em] uppercase text-[#0F0F0F]/35 font-semibold mr-2">Tags</span>
            {(Array.isArray(blog.tags) ? blog.tags : []).map(tag => (
              <span key={tag}
                className="text-[9.5px] tracking-[0.18em] uppercase px-3 py-1.5 border border-[#D4AF37]/25 text-[#0F0F0F]/55 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors cursor-default">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* More Posts */}
      {otherBlogs.length > 0 && (
        <section className="bg-[#FAF8F3] py-16 md:py-20">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <motion.div {...fadeUp()} className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[10px] tracking-[0.35em] uppercase text-[#D4AF37] font-bold mb-2">Continue Reading</p>
                <h2 className="font-serif text-2xl md:text-3xl text-[#0F0F0F]">More from the Journal</h2>
              </div>
              <Link href="/blog" className="hidden md:flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-bold text-[#D4AF37] border-b border-[#D4AF37]/40 pb-0.5 hover:gap-3 transition-all">
                All Posts <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {otherBlogs.map((post, i) => (
                <motion.div key={post.id} {...fadeUp(i * 0.1)} className="group">
                  <Link href={`/blog/${post.id}`}>
                    <div className="aspect-[4/3] overflow-hidden bg-[#E8E2D9] mb-4">
                      <img src={post.imageUrl} alt={post.title} loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(Array.isArray(post.tags) ? post.tags : []).slice(0, 1).map(tag => (
                        <span key={tag} className="text-[8.5px] tracking-[0.2em] uppercase text-[#D4AF37] font-semibold">{tag}</span>
                      ))}
                      <span className="text-[8.5px] tracking-[0.2em] uppercase text-[#0F0F0F]/30">
                        {format(new Date(post.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg text-[#0F0F0F] group-hover:text-[#D4AF37] transition-colors leading-snug mb-2">
                      {post.title}
                    </h3>
                    <p className="text-[#0F0F0F]/45 text-sm leading-relaxed line-clamp-2">{post.excerpt}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back CTA */}
      <div className="bg-[#0F0F0F] py-12">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-[9px] tracking-[0.35em] uppercase text-[#D4AF37] font-bold mb-1">The Pearlis Journal</p>
            <p className="font-serif text-xl text-white">Stories, craft & inspiration</p>
          </div>
          <Link href="/blog"
            className="inline-flex items-center gap-3 text-[10px] tracking-[0.22em] uppercase font-bold text-[#D4AF37] border border-[#D4AF37]/40 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 px-7 py-3 transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> All Posts
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
