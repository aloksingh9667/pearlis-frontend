import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
  title: string;
  image: string;
  slug: string;
  index?: number;
}

export function CategoryCard({ title, image, slug, index = 0 }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative overflow-hidden aspect-[4/5] cursor-pointer"
    >
      <Link href={`/category/${slug}`}>
        <div className="w-full h-full relative">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col items-center text-center">
            <h3 className="text-white font-serif text-3xl mb-4 tracking-wide">{title}</h3>
            <div className="flex items-center gap-2 text-white/90 text-sm tracking-widest uppercase font-medium overflow-hidden">
              <span className="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                Explore
              </span>
              <ArrowRight className="w-4 h-4 transform -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 delay-75" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
