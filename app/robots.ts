import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://ptsc.gov.bd';

  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/about',
        '/contact',
        '/notices',
        '/gallery',
        '/downloads',
        '/results',
        '/verify',
        '/learning-library',
      ],
      disallow: [
        '/admin/',
        '/dashboard/',
        '/api/',
        '/accounts/',
        '/academic/',
        '/faculty/',
        '/communication/',
        '/print/',
        '/examination/tabulation',
        '/routine/master',
        '/students/id-cards',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
