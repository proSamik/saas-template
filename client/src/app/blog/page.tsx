import React from 'react';
import BlogPageClient from './BlogPageClient';

/**
 * Metadata for the blog page
 */
export const metadata = {
  title: 'Blog | Our Latest Articles and Insights',
  description: 'Read our latest articles, tutorials, and insights about software development, DevOps, and more.',
  openGraph: {
    title: 'Blog | Our Latest Articles and Insights',
    description: 'Read our latest articles, tutorials, and insights about software development, DevOps, and more.',
    type: 'website',
  },
};

/**
 * Server component for the blog page
 * This component could fetch blog posts from a CMS or database in a real implementation
 */
export default function BlogPage() {
  return <BlogPageClient />;
} 