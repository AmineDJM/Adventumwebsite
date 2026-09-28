import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { getPublishedErpPosts } from "@/lib/erp-posts";

/**
 * Blog reader with two merged sources:
 *   1. Markdown files in content/blog — editorial, version-controlled.
 *   2. Records pushed by the ERP (lib/erp-posts).
 *
 * A committed file always wins over an ERP record sharing its slug, so the
 * repository stays the final authority on published content.
 */

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type PostSource = "file" | "erp";

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
  source: PostSource;
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

/** Render Markdown to HTML, collecting h2 anchors for the sidebar. */
function renderMarkdown(content: string): {
  html: string;
  toc: { id: string; text: string }[];
  readingTime: number;
} {
  const words = content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(words / 200));

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

  return { html, toc, readingTime };
}

function readFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
}

function parseFile(file: string): Post {
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const { html, toc, readingTime } = renderMarkdown(content);

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
    source: "file",
    html,
    toc,
  };
}

/** All published posts from both sources, newest first. */
export function getAllPosts(): Post[] {
  const filePosts = readFiles().map(parseFile);
  const fileSlugs = new Set(filePosts.map((p) => p.slug));

  const erpPosts: Post[] = getPublishedErpPosts()
    .filter((p) => !fileSlugs.has(p.slug)) // committed files win
    .map((p) => {
      const { html, toc, readingTime } = renderMarkdown(p.body);
      return {
        slug: p.slug,
        title: p.title,
        description: p.description,
        date: p.date,
        updated: p.updated,
        author: p.author,
        category: p.category,
        tags: p.tags,
        featured: p.featured,
        readingTime,
        source: "erp" as const,
        html,
        toc,
      };
    });

  return [...filePosts, ...erpPosts].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date)
  );
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
    .sort(
      (a, b) =>
        b.score - a.score || +new Date(b.post.date) - +new Date(a.post.date)
    )
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
