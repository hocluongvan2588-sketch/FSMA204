import type { Metadata } from "next"

interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  ogImage?: string
  canonicalUrl?: string
}

export function generateSEO(config: SEOConfig): Metadata {
  const { title, description, keywords, ogImage, canonicalUrl } = config

  return {
    title: `${title} | FoodTrace FSMA 204`,
    description,
    keywords: keywords?.join(", "),
    openGraph: {
      title: `${title} | FoodTrace FSMA 204`,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | FoodTrace FSMA 204`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export const DEFAULT_SEO: SEOConfig = {
  title: "Dashboard",
  description: "Hệ thống quản lý truy xuất nguồn gốc và tuân thủ thực phẩm toàn cầu theo tiêu chuẩn FSMA 204",
  keywords: ["FSMA 204", "Food traceability", "FDA compliance", "Supply chain", "Food safety"],
}
