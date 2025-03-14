'use client'

import React from 'react';
import BlogList, { BlogPost } from './BlogList';

/**
 * Sample blog posts for demonstration
 */
const sampleBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Getting Started with Next.js App Router',
    slug: 'getting-started-with-nextjs-app-router',
    description: 'Learn how to build modern web applications with Next.js 13+ App Router and best practices for performance optimization.',
    date: '2023-11-15',
    readTime: 8,
    tags: ['Next.js', 'React', 'Web Development']
  },
  {
    id: '2',
    title: 'Building a SaaS Application with React and Node.js',
    slug: 'building-saas-react-nodejs',
    description: 'A comprehensive guide to architecting and implementing a SaaS product using React for the frontend and Node.js for the backend.',
    date: '2023-10-22',
    readTime: 12,
    tags: ['SaaS', 'React', 'Node.js', 'Architecture']
  },
  {
    id: '3',
    title: 'Implementing Authentication with NextAuth.js',
    slug: 'implementing-authentication-nextauth',
    description: 'Step-by-step tutorial on how to add secure authentication to your Next.js application using NextAuth.js.',
    date: '2023-09-17',
    readTime: 6,
    tags: ['Authentication', 'Next.js', 'Security']
  },
  {
    id: '4',
    title: 'Responsive Design Patterns for Modern Web Applications',
    slug: 'responsive-design-patterns',
    description: 'Explore effective responsive design patterns and techniques to ensure your web applications look great on all devices.',
    date: '2023-08-29',
    readTime: 9,
    tags: ['CSS', 'UI/UX', 'Responsive Design']
  },
  {
    id: '5',
    title: 'State Management in React: Context API vs. Redux',
    slug: 'react-state-management-context-vs-redux',
    description: 'A comparative analysis of different state management approaches in React applications with practical examples.',
    date: '2023-07-14',
    readTime: 10,
    tags: ['React', 'State Management', 'Redux']
  },
  {
    id: '6',
    title: 'Optimizing API Performance in Node.js Applications',
    slug: 'optimizing-api-performance-nodejs',
    description: 'Learn techniques and best practices to improve the performance and scalability of your Node.js API services.',
    date: '2023-06-02',
    readTime: 11,
    tags: ['Node.js', 'Performance', 'API Design']
  }
];

/**
 * BlogPageClient component renders the blog list with sample posts
 */
const BlogPageClient: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-16 pb-24">
      <div className="container mx-auto px-4">
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">Our Blog</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Insights, tutorials, and updates from our team to help you build better software
          </p>
        </header>
        
        <BlogList posts={sampleBlogPosts} />
      </div>
    </div>
  );
};

export default BlogPageClient; 