/**
 * Crawl Submission Service
 * Handles submitting URLs to search engines for re-crawling after fixes are implemented
 * Supports: IndexNow (Bing, Yandex), Google Sitemap Ping
 */

export interface CrawlSubmissionResult {
  indexNow: {
    success: boolean;
    message: string;
  };
  googlePing: {
    success: boolean;
    message: string;
  };
  submittedAt: string;
  urls: string[];
}

export interface CrawlSubmission {
  id: string;
  brandName: string;
  brandUrl: string;
  urls: string[];
  sitemapUrl?: string;
  result: CrawlSubmissionResult;
  createdAt: string;
  recheckScheduledAt: string;
}

// Generate a unique IndexNow key for a domain
export function generateIndexNowKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Submit URLs via IndexNow protocol (Bing, Yandex, Seznam, Naver)
export async function submitViaIndexNow(
  host: string,
  urls: string[],
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    // IndexNow accepts up to 10,000 URLs per request
    const urlList = urls.slice(0, 10000);
    
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        host: host,
        key: apiKey,
        keyLocation: `https://${host}/${apiKey}.txt`,
        urlList: urlList
      })
    });

    if (response.ok || response.status === 200 || response.status === 202) {
      return {
        success: true,
        message: `Successfully submitted ${urlList.length} URL(s) to IndexNow (Bing, Yandex)`
      };
    }

    // Handle specific error codes
    const statusMessages: Record<number, string> = {
      400: 'Invalid request format',
      403: 'Key not valid or not matching host',
      422: 'URLs don\'t belong to the host',
      429: 'Too many requests, please try again later'
    };

    return {
      success: false,
      message: statusMessages[response.status] || `IndexNow returned status ${response.status}`
    };
  } catch (error) {
    return {
      success: false,
      message: `IndexNow submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Ping Google with sitemap URL (simple, no auth required)
export async function pingGoogleSitemap(
  sitemapUrl: string
): Promise<{ success: boolean; message: string }> {
  try {
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    
    const response = await fetch(pingUrl, {
      method: 'GET'
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Successfully pinged Google with sitemap URL'
      };
    }

    return {
      success: false,
      message: `Google sitemap ping returned status ${response.status}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Google ping failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Submit URL directly to Bing Webmaster API (requires API key)
export async function submitToBingWebmaster(
  apiKey: string,
  siteUrl: string,
  urls: string[]
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlBatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        siteUrl: siteUrl,
        urlList: urls
      })
    });

    if (response.ok) {
      return {
        success: true,
        message: `Successfully submitted ${urls.length} URL(s) to Bing Webmaster`
      };
    }

    return {
      success: false,
      message: `Bing Webmaster API returned status ${response.status}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Bing submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Main function to trigger re-crawl across all supported platforms
export async function triggerRecrawl(
  siteUrl: string,
  updatedUrls: string[],
  sitemapUrl?: string,
  indexNowKey?: string
): Promise<CrawlSubmissionResult> {
  const host = new URL(siteUrl).host;
  const key = indexNowKey || generateIndexNowKey();
  
  const results: CrawlSubmissionResult = {
    indexNow: { success: false, message: '' },
    googlePing: { success: false, message: '' },
    submittedAt: new Date().toISOString(),
    urls: updatedUrls
  };

  // 1. Submit via IndexNow (Bing, Yandex, others)
  results.indexNow = await submitViaIndexNow(host, updatedUrls, key);

  // 2. Ping Google sitemap if provided
  if (sitemapUrl) {
    results.googlePing = await pingGoogleSitemap(sitemapUrl);
  } else {
    // Try common sitemap locations
    const commonSitemaps = [
      `${siteUrl}/sitemap.xml`,
      `${siteUrl}/sitemap_index.xml`,
      `${siteUrl}/sitemap/sitemap.xml`
    ];
    
    for (const sitemap of commonSitemaps) {
      try {
        const checkResponse = await fetch(sitemap, { method: 'HEAD' });
        if (checkResponse.ok) {
          results.googlePing = await pingGoogleSitemap(sitemap);
          break;
        }
      } catch {
        // Continue to next sitemap URL
      }
    }
    
    if (!results.googlePing.success && !results.googlePing.message) {
      results.googlePing = {
        success: false,
        message: 'No sitemap found. Add a sitemap.xml to enable Google ping.'
      };
    }
  }

  return results;
}

// Generate instructions for setting up IndexNow key file
export function getIndexNowSetupInstructions(host: string, key: string): string {
  return `
## IndexNow Setup Instructions

To enable IndexNow submissions, you need to verify ownership by hosting a key file.

### Step 1: Create the key file

Create a file named \`${key}.txt\` with the following content:
\`\`\`
${key}
\`\`\`

### Step 2: Upload to your site root

Place the file at: \`https://${host}/${key}.txt\`

### Step 3: Verify

The file should be accessible at the URL above. Once verified, IndexNow submissions will work automatically.

### Alternative: Use your existing key

If you already have an IndexNow key set up, you can use that instead. Just provide your existing key when submitting.
`.trim();
}

// Estimate when re-crawl might be complete
export function estimateRecrawlTime(): { minDays: number; maxDays: number; message: string } {
  return {
    minDays: 1,
    maxDays: 7,
    message: 'Search engines typically process IndexNow submissions within 1-7 days. AI models may take additional time to update their training data.'
  };
}

// Store submission in localStorage for tracking
export function saveSubmission(submission: CrawlSubmission): void {
  const submissions = getSubmissions();
  submissions.unshift(submission);
  // Keep only last 50 submissions
  localStorage.setItem('aeo_crawl_submissions', JSON.stringify(submissions.slice(0, 50)));
}

export function getSubmissions(): CrawlSubmission[] {
  try {
    const stored = localStorage.getItem('aeo_crawl_submissions');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getSubmissionById(id: string): CrawlSubmission | null {
  const submissions = getSubmissions();
  return submissions.find(s => s.id === id) || null;
}

// Generate unique ID for submission
export function generateSubmissionId(): string {
  return `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
