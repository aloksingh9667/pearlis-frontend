import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, ChevronLeft, ChevronRight, Volume2, VolumeX, Instagram } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";

type Video = {
  id: number; title: string; description?: string;
  videoUrl: string; thumbnailUrl?: string; category?: string;
  isFeatured?: boolean; isPublished?: boolean; createdAt: string;
};

const CATEGORIES = ["All", "Lookbook", "Behind the Scenes", "Product", "Campaign"];

function isYouTube(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}
function getYouTubeId(url: string) {
  const m = url.match(/(?:embed\/|v=|youtu\.be\/)([^?&/]+)/);
  return m?.[1] || "";
}
function isInstagram(url: string) {
  return url.includes("instagram.com");
}
function getInstagramEmbedUrl(url: string) {
  const clean = url.split("?")[0].replace(/\/$/, "");
  return `${clean}/embed/`;
}

function VideoCard({ video, onClick, index }: { video: Video; onClick: () => void; index: number }) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const ytThumb = isYouTube(video.videoUrl)
    ? `https://img.youtube.com/vi/${getYouTubeId(video.videoUrl)}/maxresdefault.jpg`
    : null;
  const thumb = video.thumbnailUrl || ytThumb;
  const isIG = isInstagram(video.videoUrl);
  const isYT = isYouTube(video.videoUrl);

  useEffect(() => {
    if (hovered && videoRef.current && !isYT && !isIG) {
      videoRef.current.play().catch(() => {});
    } else if (!hovered && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [hovered]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.07 }}
      className="group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div className={`relative overflow-hidden bg-[#0F0F0F] ${isIG ? "aspect-[9/16]" : "aspect-video"}`}>
        {/* Preview on hover (uploaded video only) */}
        {!isYT && !isIG && (
          <video
            ref={videoRef}
            src={video.videoUrl}
            muted loop playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hovered ? "opacity-100" : "opacity-0"}`}
          />
        )}

        {/* Thumbnail / background */}
        {thumb ? (
          <img src={thumb} alt={video.title}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${hovered && !isYT && !isIG ? "opacity-0" : "opacity-100"}`} />
        ) : isIG ? (
          /* Instagram branded bg */
          <div className="absolute inset-0 bg-gradient-to-br from-[#405DE6] via-[#C13584] to-[#FD1D1D] opacity-60" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1008] to-[#0F0F0F]" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/8 transition-colors duration-500" />

        {/* Category pill */}
        {video.category && (
          <div className="absolute top-3 left-3">
            <span className="text-[8px] tracking-[0.2em] uppercase font-bold bg-[#D4AF37] text-[#0A0A0A] px-2.5 py-1">
              {video.category}
            </span>
          </div>
        )}

        {/* Instagram badge */}
        {isIG && (
          <div className="absolute top-3 right-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#405DE6] via-[#C13584] to-[#FD1D1D] flex items-center justify-center">
              <Instagram className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        )}

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: hovered ? 1.1 : 1, opacity: hovered ? 1 : 0.8 }}
            transition={{ duration: 0.25 }}
            className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center"
          >
            {isIG
              ? <Instagram className="w-5 h-5 text-white" />
              : <Play className="w-5 h-5 text-white fill-white ml-1" />
            }
          </motion.div>
        </div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-serif text-white text-base md:text-lg leading-tight line-clamp-2">{video.title}</h3>
          {video.description && (
            <p className="text-white/60 text-xs mt-1 line-clamp-1">{video.description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function VideoLightbox({ video, onClose, onPrev, onNext, hasPrev, hasNext }: {
  video: Video; onClose: () => void; onPrev: () => void; onNext: () => void;
  hasPrev: boolean; hasNext: boolean;
}) {
  const [muted, setMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isYT = isYouTube(video.videoUrl);
  const isIG = isInstagram(video.videoUrl);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className={`relative ${isIG ? "w-full max-w-sm" : "w-full max-w-5xl"}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest">
          <X className="w-4 h-4" /> Close
        </button>

        {/* Video */}
        <div className={`relative bg-black ${isIG ? "aspect-[9/16]" : "aspect-video"}`}>
          {isYT ? (
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(video.videoUrl)}?autoplay=1&rel=0`}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : isIG ? (
            <iframe
              src={getInstagramEmbedUrl(video.videoUrl)}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
              scrolling="no"
              frameBorder="0"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                src={video.videoUrl}
                autoPlay controls playsInline
                muted={muted}
                className="absolute inset-0 w-full h-full object-contain"
              />
              <button
                onClick={() => setMuted(m => !m)}
                className="absolute top-3 right-3 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>

        {/* Info + Nav */}
        <div className="flex items-start justify-between mt-5 px-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isIG && (
                <span className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-pink-400 font-bold">
                  <Instagram className="w-3 h-3" /> Instagram
                </span>
              )}
            </div>
            <h2 className="font-serif text-white text-xl md:text-2xl">{video.title}</h2>
            {video.description && <p className="text-white/50 text-sm mt-1">{video.description}</p>}
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-6">
            <button onClick={onPrev} disabled={!hasPrev} className="w-10 h-10 border border-white/20 flex items-center justify-center text-white hover:border-[#D4AF37] disabled:opacity-20 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={onNext} disabled={!hasNext} className="w-10 h-10 border border-white/20 flex items-center justify-center text-white hover:border-[#D4AF37] disabled:opacity-20 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/videos").then(r => r.json()).catch(() => []),
      fetch("/api/settings").then(r => r.json()).catch(() => ({})),
    ]).then(([tableVideos, settings]) => {
      const dbVideos: Video[] = Array.isArray(tableVideos) ? tableVideos : [];
      const settingsVideos: Video[] = ((settings?.videos as any[]) || [])
        .filter((v: any) => v.url)
        .map((v: any, i: number) => {
          const ytId = getYouTubeId(v.url);
          return {
            id: -(i + 1),
            title: v.title || "Video",
            videoUrl: v.url,
            thumbnailUrl: (v.thumbnail && !v.thumbnail.includes("...")) ? v.thumbnail : (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : ""),
            isPublished: true,
            createdAt: new Date().toISOString(),
          };
        });
      const existingUrls = new Set(dbVideos.map(v => v.videoUrl));
      const merged = [...dbVideos, ...settingsVideos.filter(v => !existingUrls.has(v.videoUrl))];
      setVideos(merged);
      setLoading(false);
    });
  }, []);

  const filtered = activeCategory === "All"
    ? videos
    : videos.filter(v => (v.category || "").toLowerCase() === activeCategory.toLowerCase());

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);
  const prevVideo = () => setLightboxIdx(i => (i !== null && i > 0 ? i - 1 : i));
  const nextVideo = () => setLightboxIdx(i => (i !== null && i < filtered.length - 1 ? i + 1 : i));

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-24 pb-3">
        <BackButton />
      </div>

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-[#FAF7F2]">
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=2400"
            alt=""
            className="w-full h-full object-cover opacity-[0.07]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F2]/80 via-transparent to-[#FAF7F2]" />
        </div>
        <div className="relative max-w-[1440px] mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] font-bold mb-4">Pearlis Films</p>
            <h1 className="font-serif text-5xl md:text-7xl text-[#0F0F0F] mb-5">Our Story in Motion</h1>
            <div className="w-16 h-[1px] bg-[#D4AF37] mx-auto mb-6" />
            <p className="text-[#0F0F0F]/50 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              Behind the craft, inside the atelier, and on the runway — watch the world of Pearlis come alive.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <div className="sticky top-[100px] z-30 bg-[#FAF7F2]/95 backdrop-blur-sm border-b border-[#0F0F0F]/10">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex gap-0 overflow-x-auto hide-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-5 py-4 text-[10px] tracking-[0.2em] uppercase font-bold border-b-2 transition-all duration-200 ${
                  activeCategory === cat
                    ? "border-[#D4AF37] text-[#D4AF37]"
                    : "border-transparent text-[#0F0F0F]/35 hover:text-[#0F0F0F]/65"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="flex-1 py-12 md:py-16 bg-[#FAF7F2]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <Play className="w-12 h-12 text-[#0F0F0F]/10 mx-auto mb-4" />
              <p className="font-serif text-[#0F0F0F]/30 text-2xl">No videos yet</p>
              <p className="text-[#0F0F0F]/20 text-sm mt-2">Check back soon for exclusive content</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filtered.map((video, i) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  index={i}
                  onClick={() => openLightbox(i)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && filtered[lightboxIdx] && (
          <VideoLightbox
            video={filtered[lightboxIdx]}
            onClose={closeLightbox}
            onPrev={prevVideo}
            onNext={nextVideo}
            hasPrev={lightboxIdx > 0}
            hasNext={lightboxIdx < filtered.length - 1}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
