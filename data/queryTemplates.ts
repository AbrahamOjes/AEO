// Industry-specific query templates for AEO analysis

export interface QueryTemplate {
  id: string;
  name: string;
  industry: string;
  queries: string[];
  description: string;
}

export const INDUSTRIES = [
  'SaaS / Software',
  'E-commerce / Retail',
  'Finance / Fintech',
  'Healthcare',
  'Travel / Hospitality',
  'Real Estate',
  'Education / EdTech',
  'Marketing / Agency',
  'Food & Beverage',
  'Automotive',
  'Custom'
] as const;

export type Industry = typeof INDUSTRIES[number];

export const QUERY_TEMPLATES: QueryTemplate[] = [
  // SaaS / Software
  {
    id: 'saas-crm',
    name: 'CRM Software',
    industry: 'SaaS / Software',
    description: 'Queries for CRM and sales software brands',
    queries: [
      'What is the best CRM software for small businesses?',
      'Which CRM has the best automation features?',
      'What are the top alternatives to Salesforce?',
      'Best CRM for remote sales teams in 2025',
      'Which CRM integrates best with email marketing?',
      'Most affordable CRM with good features',
      'Best CRM for startups and growing companies',
      'Which CRM has the best mobile app?',
      'Top rated CRM software by user reviews',
      'Best CRM for B2B sales pipeline management'
    ]
  },
  {
    id: 'saas-project',
    name: 'Project Management',
    industry: 'SaaS / Software',
    description: 'Queries for project management tools',
    queries: [
      'What is the best project management software?',
      'Best alternative to Asana for teams',
      'Which project management tool has the best Gantt charts?',
      'Top project management apps for agile teams',
      'Best free project management software',
      'Which tool is better: Monday.com or ClickUp?',
      'Best project management for software development',
      'Top collaboration tools for remote teams',
      'Best project tracking software for agencies',
      'Which project management tool integrates with Slack?'
    ]
  },
  {
    id: 'saas-marketing',
    name: 'Marketing Software',
    industry: 'SaaS / Software',
    description: 'Queries for marketing automation and tools',
    queries: [
      'What is the best email marketing platform?',
      'Top marketing automation tools for small business',
      'Best alternative to HubSpot for marketing',
      'Which email tool has the best deliverability?',
      'Best social media management platform',
      'Top SEO tools for content marketers',
      'Best landing page builder for conversions',
      'Which marketing platform has the best analytics?',
      'Best all-in-one marketing software',
      'Top tools for marketing agencies'
    ]
  },
  
  // E-commerce / Retail
  {
    id: 'ecom-platform',
    name: 'E-commerce Platforms',
    industry: 'E-commerce / Retail',
    description: 'Queries for online store platforms',
    queries: [
      'What is the best e-commerce platform to start an online store?',
      'Shopify vs WooCommerce: which is better?',
      'Best e-commerce platform for dropshipping',
      'Top alternatives to Shopify for small businesses',
      'Best platform for selling digital products',
      'Which e-commerce platform has the lowest fees?',
      'Best e-commerce solution for B2B sales',
      'Top headless commerce platforms',
      'Best e-commerce platform for SEO',
      'Which platform is best for multi-channel selling?'
    ]
  },
  {
    id: 'ecom-products',
    name: 'Product Discovery',
    industry: 'E-commerce / Retail',
    description: 'Generic product recommendation queries',
    queries: [
      'What are the best [PRODUCT_CATEGORY] to buy in 2025?',
      'Top rated [PRODUCT_CATEGORY] under $100',
      'Best [PRODUCT_CATEGORY] for beginners',
      'Which [PRODUCT_CATEGORY] brand has the best quality?',
      'Most popular [PRODUCT_CATEGORY] on the market',
      'Best value [PRODUCT_CATEGORY] for the money',
      'Top [PRODUCT_CATEGORY] recommended by experts',
      'Best [PRODUCT_CATEGORY] for professionals',
      'Which [PRODUCT_CATEGORY] has the best reviews?',
      'Most innovative [PRODUCT_CATEGORY] brands'
    ]
  },
  
  // Finance / Fintech
  {
    id: 'fintech-banking',
    name: 'Digital Banking',
    industry: 'Finance / Fintech',
    description: 'Queries for neobanks and digital banking',
    queries: [
      'What is the best online bank account?',
      'Top digital banks with no fees',
      'Best neobank for freelancers',
      'Which online bank has the best interest rates?',
      'Best banking app for managing money',
      'Top alternatives to traditional banks',
      'Best bank account for small business',
      'Which digital bank has the best customer service?',
      'Best bank for international transfers',
      'Top mobile banking apps in 2025'
    ]
  },
  {
    id: 'fintech-invest',
    name: 'Investment Platforms',
    industry: 'Finance / Fintech',
    description: 'Queries for investment and trading apps',
    queries: [
      'What is the best investment app for beginners?',
      'Top stock trading platforms with low fees',
      'Best robo-advisor for retirement savings',
      'Which investment app has the best research tools?',
      'Best platform for ETF investing',
      'Top alternatives to Robinhood',
      'Best app for cryptocurrency investing',
      'Which brokerage has the best mobile app?',
      'Best investment platform for passive income',
      'Top rated wealth management apps'
    ]
  },
  
  // Healthcare
  {
    id: 'health-telehealth',
    name: 'Telehealth Services',
    industry: 'Healthcare',
    description: 'Queries for telemedicine and health apps',
    queries: [
      'What is the best telehealth service?',
      'Top online doctor consultation platforms',
      'Best mental health apps for anxiety',
      'Which telemedicine app accepts insurance?',
      'Best app for online therapy sessions',
      'Top health monitoring apps',
      'Best telehealth for prescription refills',
      'Which virtual care platform is most affordable?',
      'Best app for tracking health symptoms',
      'Top rated wellness and health apps'
    ]
  },
  
  // Travel / Hospitality
  {
    id: 'travel-booking',
    name: 'Travel Booking',
    industry: 'Travel / Hospitality',
    description: 'Queries for travel and booking platforms',
    queries: [
      'What is the best website to book flights?',
      'Top hotel booking sites with best prices',
      'Best travel app for finding deals',
      'Which booking platform has the best rewards?',
      'Best site for last-minute travel deals',
      'Top alternatives to Booking.com',
      'Best app for planning road trips',
      'Which travel site has the best customer service?',
      'Best platform for vacation rentals',
      'Top travel apps for international trips'
    ]
  },
  
  // Real Estate
  {
    id: 'realestate-search',
    name: 'Property Search',
    industry: 'Real Estate',
    description: 'Queries for real estate platforms',
    queries: [
      'What is the best website to find homes for sale?',
      'Top real estate apps for house hunting',
      'Best platform for rental apartments',
      'Which real estate site has the most listings?',
      'Best app for estimating home values',
      'Top alternatives to Zillow',
      'Best platform for commercial real estate',
      'Which real estate app has the best filters?',
      'Best site for foreclosure listings',
      'Top real estate investment platforms'
    ]
  },
  
  // Education / EdTech
  {
    id: 'edtech-learning',
    name: 'Online Learning',
    industry: 'Education / EdTech',
    description: 'Queries for e-learning platforms',
    queries: [
      'What is the best online learning platform?',
      'Top sites for learning programming',
      'Best online courses for career change',
      'Which e-learning platform has the best certificates?',
      'Best app for learning new languages',
      'Top alternatives to Coursera',
      'Best platform for professional development',
      'Which online course platform is most affordable?',
      'Best site for learning data science',
      'Top rated educational apps for adults'
    ]
  },
  
  // Marketing / Agency
  {
    id: 'agency-services',
    name: 'Marketing Services',
    industry: 'Marketing / Agency',
    description: 'Queries for marketing agencies and services',
    queries: [
      'What is the best digital marketing agency?',
      'Top SEO agencies for small business',
      'Best social media marketing companies',
      'Which marketing agency specializes in startups?',
      'Best PPC management agencies',
      'Top content marketing agencies',
      'Best branding agencies for tech companies',
      'Which agency has the best case studies?',
      'Best influencer marketing platforms',
      'Top B2B marketing agencies'
    ]
  },
  
  // Food & Beverage
  {
    id: 'food-delivery',
    name: 'Food Delivery',
    industry: 'Food & Beverage',
    description: 'Queries for food delivery and meal services',
    queries: [
      'What is the best food delivery app?',
      'Top meal kit delivery services',
      'Best grocery delivery apps',
      'Which food delivery has the lowest fees?',
      'Best healthy meal delivery service',
      'Top alternatives to DoorDash',
      'Best meal prep delivery for weight loss',
      'Which food delivery app has the best selection?',
      'Best subscription meal service for families',
      'Top rated restaurant delivery apps'
    ]
  },
  
  // Automotive
  {
    id: 'auto-buying',
    name: 'Car Buying',
    industry: 'Automotive',
    description: 'Queries for car buying and automotive',
    queries: [
      'What is the best website to buy a used car?',
      'Top electric vehicles to buy in 2025',
      'Best car buying apps',
      'Which car brand is most reliable?',
      'Best SUVs for families',
      'Top alternatives to CarMax',
      'Best hybrid cars for fuel efficiency',
      'Which car has the best safety ratings?',
      'Best luxury cars under $50,000',
      'Top rated car comparison websites'
    ]
  }
];

export const getTemplatesByIndustry = (industry: Industry): QueryTemplate[] => {
  if (industry === 'Custom') return [];
  return QUERY_TEMPLATES.filter(t => t.industry === industry);
};

export const getTemplateById = (id: string): QueryTemplate | undefined => {
  return QUERY_TEMPLATES.find(t => t.id === id);
};

export const generateCustomQueries = (brandName: string, productCategory: string): string[] => {
  return [
    `What is the best ${productCategory}?`,
    `Top ${productCategory} brands to consider`,
    `Is ${brandName} a good ${productCategory}?`,
    `${brandName} vs competitors: which is better?`,
    `Best alternatives to ${brandName}`,
    `What do experts say about ${brandName}?`,
    `${brandName} reviews and ratings`,
    `Is ${brandName} worth the price?`,
    `Best ${productCategory} for beginners`,
    `Top rated ${productCategory} in 2025`
  ];
};
