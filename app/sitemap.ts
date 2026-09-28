import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { getPublishedJobs } from "@/lib/jobs";
import { SITE_URL } from "@/lib/site";

// Job postings change at runtime, so the sitemap is generated per request
// rather than frozen at build time.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const jobs = getPublishedJobs();

  const newestPost = posts[0]?.updated ?? posts[0]?.date;

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: newestPost ? new Date(newestPost) : new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/carrieres`,
      lastModified: jobs[0] ? new Date(jobs[0].updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updated ?? post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...jobs.map((job) => ({
      url: `${SITE_URL}/carrieres/${job.slug}`,
      lastModified: new Date(job.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
