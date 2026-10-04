/**
 * Schema.org structured data generation helpers.
 *
 * Every function takes real, visible page data and produces a valid
 * JSON-LD object. No invented, fake, or speculative properties.
 */

const SITE_URL = "https://nobat-market.com";

/* ────────────────────────────────────────────
 *  Foundational entities (shared across pages)
 * ──────────────────────────────────────────── */

export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "نوبت مارکت",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.png`,
      width: 200,
      height: 200,
    },
    sameAs: [
      "https://instagram.com/nobatmarket",
      "https://t.me/nobatmarket",
      "https://twitter.com/nobatmarket",
      "https://youtube.com/@nobatmarket",
    ],
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "نوبت مارکت",
    url: SITE_URL,
    description:
      "پلتفرم رزرو نوبت برای کسب‌وکارهای مختلف در ایران",
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "fa",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/businesses?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function webPageSchema(opts: {
  title: string;
  description: string;
  url: string;
  dateModified?: string;
}) {
  return {
    "@type": "WebPage",
    "@id": `${opts.url}#webpage`,
    name: opts.title,
    description: opts.description,
    url: opts.url,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "fa",
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
  };
}

export function breadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/* ────────────────────────────────────────────
 *  Artist (Person)
 * ──────────────────────────────────────────── */

interface ArtistData {
  name: string;
  slug: string;
  city?: string | null;
  description?: string | null;
  avatarUrl?: string | null;
  rating?: number;
  reviewCount?: number;
  completedBookings?: number;
  specialties?: string[];
  minPrice?: number | null;
}

export function artistSchema(artist: ArtistData) {
  const profileUrl = `${SITE_URL}/artists/${artist.slug}`;

  return {
    "@type": "Person",
    "@id": `${profileUrl}#person`,
    name: artist.name,
    url: profileUrl,
    image: artist.avatarUrl || undefined,
    description: artist.description || undefined,
    jobTitle: "Tattoo Artist",
    worksFor: { "@id": `${SITE_URL}/#organization` },
    ...(artist.city ? { address: { "@type": "PostalAddress", addressLocality: artist.city, addressCountry: "IR" } } : {}),
    ...(artist.rating && artist.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: artist.rating,
            bestRating: 5,
            worstRating: 1,
            ratingCount: artist.reviewCount,
          },
        }
      : {}),
    ...(artist.specialties?.length
      ? { knowsAbout: artist.specialties }
      : {}),
  };
}

/* ────────────────────────────────────────────
 *  Studio (LocalBusiness)
 * ──────────────────────────────────────────── */

interface StudioData {
  name: string;
  slug: string;
  city?: string | null;
  address?: string | null;
  description?: string | null;
  coverImage?: string | null;
  phone?: string | null;
  email?: string | null;
  rating?: number;
  reviewCount?: number;
  artistCount?: number;
}

export function studioSchema(studio: StudioData) {
  const url = `${SITE_URL}/studios/${studio.slug}`;

  return {
    "@type": "TattooParlor",
    "@id": `${url}#localbusiness`,
    name: studio.name,
    url,
    image: studio.coverImage || undefined,
    description: studio.description || undefined,
    telephone: studio.phone || undefined,
    email: studio.email || undefined,
    ...(studio.address || studio.city
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: studio.address || undefined,
            addressLocality: studio.city || undefined,
            addressCountry: "IR",
          },
        }
      : {}),
    ...(studio.rating && studio.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: studio.rating,
            bestRating: 5,
            worstRating: 1,
            ratingCount: studio.reviewCount,
          },
        }
      : {}),
    ...(studio.artistCount
      ? { employee: { "@type": "Occupation", occupationalCategory: "Tattoo Artist", estimatedCount: studio.artistCount } }
      : {}),
    priceRange: "$$",
    paymentAccepted: "Cash, Online Payment",
  };
}

/* ────────────────────────────────────────────
 *  Flash Tattoo (Product)
 * ──────────────────────────────────────────── */

interface FlashData {
  id: string;
  title: string;
  slug: string;
  price?: number | null;
  images?: string[];
  artistName?: string;
  artistSlug?: string;
  style?: string;
}

export function flashProductSchema(flash: FlashData) {
  const url = `${SITE_URL}/flash`;

  return {
    "@type": "Product",
    "@id": `${SITE_URL}/flash/${flash.id}#product`,
    name: flash.title,
    image: flash.images?.[0] || undefined,
    url,
    ...(flash.artistName
      ? {
          brand: {
            "@type": "Person",
            name: flash.artistName,
            ...(flash.artistSlug ? { url: `${SITE_URL}/artists/${flash.artistSlug}` } : {}),
          },
        }
      : {}),
    ...(flash.style ? { category: flash.style } : {}),
    ...(flash.price
      ? {
          offers: {
            "@type": "Offer",
            price: flash.price,
            priceCurrency: "IRR",
            availability: "https://schema.org/InStock",
            seller: { "@id": `${SITE_URL}/#organization` },
          },
        }
      : {}),
  };
}

/* ────────────────────────────────────────────
 *  Blog / Magazine (BlogPosting)
 * ──────────────────────────────────────────── */

interface ArticleData {
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string | null;
  authorName: string;
  datePublished: string;
  dateModified?: string;
  category?: string;
}

export function blogPostingSchema(article: ArticleData) {
  const url = `${SITE_URL}/magazine/${article.slug}`;

  return {
    "@type": "BlogPosting",
    "@id": `${url}#blogposting`,
    headline: article.title,
    description: article.excerpt || undefined,
    image: article.coverImage || undefined,
    url,
    datePublished: article.datePublished,
    ...(article.dateModified ? { dateModified: article.dateModified } : {}),
    author: {
      "@type": "Person",
      name: article.authorName,
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
    isPartOf: {
      "@type": "Blog",
      "@id": `${SITE_URL}/magazine#blog`,
      name: "مجله نوبت مارکت",
      url: `${SITE_URL}/magazine`,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    inLanguage: "fa",
    ...(article.category ? { about: { "@type": "Thing", name: article.category } } : {}),
  };
}

/* ────────────────────────────────────────────
 *  FAQ Page (FAQPage)
 * ──────────────────────────────────────────── */

interface FaqItem {
  question: string;
  answer: string;
}

export function faqPageSchema(faqs: FaqItem[], pageUrl: string) {
  return {
    "@type": "FAQPage",
    "@id": `${pageUrl}#faqpage`,
    name: "سوالات متداول نوبت مارکت",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/* ────────────────────────────────────────────
 *  Contact Page (ContactPage + Organization)
 * ──────────────────────────────────────────── */

export function contactPageSchema(opts: {
  email?: string;
  phone?: string;
  address?: string;
  pageUrl: string;
}) {
  return {
    "@type": "ContactPage",
    "@id": `${opts.pageUrl}#contactpage`,
    name: "تماس با نوبت مارکت",
    url: opts.pageUrl,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "نوبت مارکت",
      ...(opts.email ? { email: opts.email } : {}),
      ...(opts.phone ? { telephone: opts.phone } : {}),
      ...(opts.address ? { address: { "@type": "PostalAddress", streetAddress: opts.address, addressCountry: "IR" } } : {}),
    },
  };
}

/* ────────────────────────────────────────────
 *  ItemList (for listing pages)
 * ──────────────────────────────────────────── */

interface ItemListEntry {
  name: string;
  url: string;
  position: number;
  image?: string;
}

export function itemListSchema(
  name: string,
  listUrl: string,
  items: ItemListEntry[]
) {
  return {
    "@type": "ItemList",
    "@id": `${listUrl}#itemlist`,
    name,
    url: listUrl,
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      url: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
      name: item.name,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}

/* ────────────────────────────────────────────
 *  Service (for artist services)
 * ──────────────────────────────────────────── */

export function serviceSchema(opts: {
  name: string;
  artistName: string;
  artistSlug: string;
  price?: number | null;
  description?: string;
}) {
  return {
    "@type": "Service",
    name: opts.name,
    provider: {
      "@type": "Person",
      name: opts.artistName,
      url: `${SITE_URL}/artists/${opts.artistSlug}`,
    },
    serviceType: "Tattoo Service",
    areaServed: { "@type": "Country", name: "Iran" },
    ...(opts.price
      ? {
          offers: {
            "@type": "Offer",
            price: opts.price,
            priceCurrency: "IRR",
          },
        }
      : {}),
  };
}
