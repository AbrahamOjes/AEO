/**
 * Brand Profile Service
 * Manages hosted brand profile pages with structured data for AI visibility
 */

export interface BrandProfile {
  id: string;
  slug: string;
  
  // Core info
  name: string;
  tagline?: string;
  description: string;
  websiteUrl: string;
  logoUrl?: string;
  
  // Structured data
  foundingYear?: string;
  headquarters?: string;
  areasServed: string[];
  categories: string[];
  
  // Social links
  twitterUrl?: string;
  linkedinUrl?: string;
  
  // Target queries from AEO analysis
  targetQueries: {
    question: string;
    answer: string;
  }[];
  
  // Key features/differentiators
  features: {
    name: string;
    description: string;
  }[];
  
  // Use cases
  useCases: string[];
  
  // Target audience
  targetAudience: string;
  
  // Generated schemas
  organizationSchema: object;
  faqSchema: object;
  
  // Meta
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Generate a URL-friendly slug from brand name
export function generateSlug(brandName: string): string {
  return brandName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

// Generate Organization schema for the brand
export function generateOrganizationSchema(profile: BrandProfile): object {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": profile.name,
    "url": profile.websiteUrl,
    "description": profile.description,
  };

  if (profile.tagline) {
    schema.slogan = profile.tagline;
  }

  if (profile.foundingYear) {
    schema.foundingDate = profile.foundingYear;
  }

  if (profile.headquarters) {
    schema.address = {
      "@type": "PostalAddress",
      "addressLocality": profile.headquarters
    };
  }

  if (profile.areasServed.length > 0) {
    schema.areaServed = profile.areasServed;
  }

  if (profile.categories.length > 0) {
    schema.knowsAbout = profile.categories;
  }

  const sameAs: string[] = [];
  if (profile.twitterUrl) sameAs.push(profile.twitterUrl);
  if (profile.linkedinUrl) sameAs.push(profile.linkedinUrl);
  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  return schema;
}

// Generate FAQPage schema from target queries
export function generateFaqSchema(profile: BrandProfile): object {
  if (profile.targetQueries.length === 0) {
    return {};
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": profile.targetQueries.map(q => ({
      "@type": "Question",
      "name": q.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.answer
      }
    }))
  };
}

// Generate full HTML page for the brand profile
export function generateBrandProfileHTML(profile: BrandProfile): string {
  const orgSchema = generateOrganizationSchema(profile);
  const faqSchema = generateFaqSchema(profile);
  
  const hasSchema = Object.keys(faqSchema).length > 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${profile.name} - Brand Profile | AEO Directory</title>
  <meta name="description" content="${profile.description.substring(0, 160)}">
  <meta name="robots" content="index, follow">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${profile.name} - Brand Profile">
  <meta property="og:description" content="${profile.description.substring(0, 160)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://aeo.tool/brands/${profile.slug}">
  ${profile.logoUrl ? `<meta property="og:image" content="${profile.logoUrl}">` : ''}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${profile.name}">
  <meta name="twitter:description" content="${profile.description.substring(0, 160)}">
  
  <!-- Canonical -->
  <link rel="canonical" href="https://aeo.tool/brands/${profile.slug}">
  
  <!-- Organization Schema -->
  <script type="application/ld+json">
${JSON.stringify(orgSchema, null, 2)}
  </script>
  
  ${hasSchema ? `<!-- FAQ Schema -->
  <script type="application/ld+json">
${JSON.stringify(faqSchema, null, 2)}
  </script>` : ''}
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; background: #f9fafb; }
    .container { max-width: 800px; margin: 0 auto; padding: 2rem; }
    header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 3rem 0; margin-bottom: 2rem; }
    header .container { display: flex; align-items: center; gap: 1.5rem; }
    .logo { width: 80px; height: 80px; background: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; color: #4f46e5; }
    h1 { font-size: 2.5rem; font-weight: 800; }
    .tagline { opacity: 0.9; font-size: 1.1rem; margin-top: 0.5rem; }
    section { background: white; border-radius: 16px; padding: 2rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h2 { font-size: 1.25rem; font-weight: 700; color: #4f46e5; margin-bottom: 1rem; }
    p { color: #4b5563; margin-bottom: 1rem; }
    ul { list-style: none; }
    li { padding: 0.5rem 0; padding-left: 1.5rem; position: relative; }
    li::before { content: "→"; position: absolute; left: 0; color: #4f46e5; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
    .feature { background: #f3f4f6; padding: 1rem; border-radius: 8px; }
    .feature h3 { font-size: 1rem; font-weight: 600; color: #1f2937; margin-bottom: 0.5rem; }
    .feature p { font-size: 0.875rem; margin: 0; }
    .faq-item { border-bottom: 1px solid #e5e7eb; padding: 1rem 0; }
    .faq-item:last-child { border-bottom: none; }
    .faq-item h3 { font-size: 1rem; font-weight: 600; color: #1f2937; margin-bottom: 0.5rem; }
    .faq-item p { font-size: 0.875rem; margin: 0; }
    .links { display: flex; gap: 1rem; flex-wrap: wrap; }
    .links a { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; transition: background 0.2s; }
    .links a:hover { background: #4338ca; }
    .links a.secondary { background: #f3f4f6; color: #4b5563; }
    .links a.secondary:hover { background: #e5e7eb; }
    footer { text-align: center; padding: 2rem; color: #9ca3af; font-size: 0.875rem; }
    footer a { color: #4f46e5; text-decoration: none; }
    .meta { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem; }
    .meta-item { background: #f3f4f6; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; color: #6b7280; }
  </style>
</head>
<body>
  <header>
    <div class="container">
      ${profile.logoUrl 
        ? `<img src="${profile.logoUrl}" alt="${profile.name} logo" class="logo" style="object-fit: contain;">`
        : `<div class="logo">${profile.name.charAt(0).toUpperCase()}</div>`
      }
      <div>
        <h1>${profile.name}</h1>
        ${profile.tagline ? `<p class="tagline">${profile.tagline}</p>` : ''}
      </div>
    </div>
  </header>
  
  <main class="container">
    <section id="about">
      <h2>About ${profile.name}</h2>
      <p>${profile.description}</p>
      ${profile.areasServed.length > 0 || profile.foundingYear || profile.headquarters ? `
      <div class="meta">
        ${profile.foundingYear ? `<span class="meta-item">Founded ${profile.foundingYear}</span>` : ''}
        ${profile.headquarters ? `<span class="meta-item">📍 ${profile.headquarters}</span>` : ''}
        ${profile.areasServed.map(area => `<span class="meta-item">${area}</span>`).join('')}
      </div>
      ` : ''}
    </section>
    
    ${profile.features.length > 0 ? `
    <section id="features">
      <h2>Key Features</h2>
      <div class="features">
        ${profile.features.map(f => `
        <div class="feature">
          <h3>${f.name}</h3>
          <p>${f.description}</p>
        </div>
        `).join('')}
      </div>
    </section>
    ` : ''}
    
    ${profile.useCases.length > 0 ? `
    <section id="use-cases">
      <h2>Primary Use Cases</h2>
      <ul>
        ${profile.useCases.map(uc => `<li>${uc}</li>`).join('')}
      </ul>
    </section>
    ` : ''}
    
    ${profile.targetAudience ? `
    <section id="audience">
      <h2>Who It's For</h2>
      <p>${profile.targetAudience}</p>
    </section>
    ` : ''}
    
    ${profile.targetQueries.length > 0 ? `
    <section id="faq">
      <h2>Frequently Asked Questions</h2>
      ${profile.targetQueries.map(q => `
      <div class="faq-item">
        <h3>${q.question}</h3>
        <p>${q.answer}</p>
      </div>
      `).join('')}
    </section>
    ` : ''}
    
    <section id="links">
      <h2>Official Links</h2>
      <div class="links">
        <a href="${profile.websiteUrl}" target="_blank" rel="noopener">Visit Website</a>
        ${profile.twitterUrl ? `<a href="${profile.twitterUrl}" target="_blank" rel="noopener" class="secondary">Twitter</a>` : ''}
        ${profile.linkedinUrl ? `<a href="${profile.linkedinUrl}" target="_blank" rel="noopener" class="secondary">LinkedIn</a>` : ''}
      </div>
    </section>
  </main>
  
  <footer>
    <p>This is an official brand profile page. <a href="${profile.websiteUrl}">Visit ${profile.name}</a></p>
    <p style="margin-top: 0.5rem;">Powered by <a href="/">AEO Tool</a> — AI Answer Visibility Checker</p>
  </footer>
</body>
</html>`;
}

// Create a new brand profile from AEO report data
export function createProfileFromReport(
  brandName: string,
  brandUrl: string,
  description: string,
  queries: { question: string; answer: string }[],
  options?: {
    tagline?: string;
    categories?: string[];
    features?: { name: string; description: string }[];
    useCases?: string[];
    targetAudience?: string;
    foundingYear?: string;
    headquarters?: string;
    areasServed?: string[];
    twitterUrl?: string;
    linkedinUrl?: string;
    logoUrl?: string;
  }
): BrandProfile {
  const now = new Date().toISOString();
  const slug = generateSlug(brandName);
  
  const profile: BrandProfile = {
    id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    slug,
    name: brandName,
    tagline: options?.tagline,
    description,
    websiteUrl: brandUrl.startsWith('http') ? brandUrl : `https://${brandUrl}`,
    logoUrl: options?.logoUrl,
    foundingYear: options?.foundingYear,
    headquarters: options?.headquarters,
    areasServed: options?.areasServed || [],
    categories: options?.categories || [],
    twitterUrl: options?.twitterUrl,
    linkedinUrl: options?.linkedinUrl,
    targetQueries: queries,
    features: options?.features || [],
    useCases: options?.useCases || [],
    targetAudience: options?.targetAudience || '',
    organizationSchema: {},
    faqSchema: {},
    isPublished: false,
    createdAt: now,
    updatedAt: now,
  };

  // Generate schemas
  profile.organizationSchema = generateOrganizationSchema(profile);
  profile.faqSchema = generateFaqSchema(profile);

  return profile;
}

// Store profile in localStorage
export function saveProfile(profile: BrandProfile): void {
  const profiles = getProfiles();
  const existingIndex = profiles.findIndex(p => p.id === profile.id);
  
  if (existingIndex >= 0) {
    profiles[existingIndex] = { ...profile, updatedAt: new Date().toISOString() };
  } else {
    profiles.push(profile);
  }
  
  localStorage.setItem('aeo_brand_profiles', JSON.stringify(profiles));
}

export function getProfiles(): BrandProfile[] {
  try {
    const stored = localStorage.getItem('aeo_brand_profiles');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getProfileById(id: string): BrandProfile | null {
  const profiles = getProfiles();
  return profiles.find(p => p.id === id) || null;
}

export function getProfileBySlug(slug: string): BrandProfile | null {
  const profiles = getProfiles();
  return profiles.find(p => p.slug === slug) || null;
}

export function deleteProfile(id: string): void {
  const profiles = getProfiles().filter(p => p.id !== id);
  localStorage.setItem('aeo_brand_profiles', JSON.stringify(profiles));
}

// Publish profile (mark as public)
export function publishProfile(id: string): BrandProfile | null {
  const profile = getProfileById(id);
  if (!profile) return null;
  
  profile.isPublished = true;
  profile.publishedAt = new Date().toISOString();
  saveProfile(profile);
  
  return profile;
}

// Generate downloadable HTML file
export function downloadProfileHTML(profile: BrandProfile): void {
  const html = generateBrandProfileHTML(profile);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${profile.slug}-brand-profile.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// Export profile data as JSON
export function exportProfileJSON(profile: BrandProfile): string {
  return JSON.stringify(profile, null, 2);
}
