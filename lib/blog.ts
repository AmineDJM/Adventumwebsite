import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

/**
 * File-based blog. Articles live as Markdown + front matter under
 * content/blog, so they are version-controlled, statically rendered and
 * instantly indexable — the arrangement search engines reward most.
 */

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  /** ISO date */
  date: string;
  updated?: string;
  author: string;
  category: string;
  tags: string[];
  /** minutes, derived from the body */
  readingTime: number;
  featured?: boolean;
};

export type Post = PostMeta & {
  /** rendered HTML body */
  html: string;
  /** h2 anchors for the table of contents */
  toc: { id: string; text: string }[];
};

/** Stable, accent-aware slug for heading anchors. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function readFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
}

function parse(file: string): Post {
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
  const { data, content } = matter(raw);

  const words = content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(words / 200));

  // Collect h2s for the table of contents and give them ids to link to.
  const toc: { id: string; text: string }[] = [];
  const renderer = new marked.Renderer();
  renderer.heading = ({ text, depth }) => {
    const plain = text.replace(/<[^>]+>/g, "");
    const id = slugify(plain);
    if (depth === 2) toc.push({ id, text: plain });
    return `<h${depth} id="${id}">${text}</h${depth}>\n`;
  };

  const html = marked.parse(content, {
    renderer,
    async: false,
    gfm: true,
  }) as string;

  return {
    slug: data.slug ?? file.replace(/\.md$/, ""),
    title: data.title ?? "Sans titre",
    description: data.description ?? "",
    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    updated: data.updated ? new Date(data.updated).toISOString() : undefined,
    author: data.author ?? "Adventum Pharma",
    category: data.category ?? "Secteur",
    tags: Array.isArray(data.tags) ? data.tags : [],
    featured: Boolean(data.featured),
    readingTime,
    html,
    toc,
  };
}

/** All posts, newest first. */
export function getAllPosts(): Post[] {
  return readFiles()
    .map(parse)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export function getPostSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

export function getPost(slug: string): Post | null {
  return getAllPosts().find((p) => p.slug === slug) ?? null;
}

/** Posts sharing the most tags with the given one, newest first. */
export function getRelatedPosts(slug: string, limit = 3): Post[] {
  const all = getAllPosts();
  const current = all.find((p) => p.slug === slug);
  if (!current) return [];
  return all
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      post: p,
      score: p.tags.filter((tag) => current.tags.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score || +new Date(b.post.date) - +new Date(a.post.date))
    .slice(0, limit)
    .map((x) => x.post);
}

/** Human-readable French date for display. */
export function formatDate(iso: string, locale = "fr-FR"): string {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
