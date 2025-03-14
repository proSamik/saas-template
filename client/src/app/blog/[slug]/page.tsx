import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

/**
 * In a real application, this would fetch from a CMS or database
 * This is a placeholder for demonstration purposes
 */
const getBlogPostBySlug = (slug: string) => {
  // Sample blog posts - in a real app, this would come from a database or CMS
  const posts = [
    {
      id: '1',
      title: 'Getting Started with Next.js App Router',
      slug: 'getting-started-with-nextjs-app-router',
      content: `
        <p>Next.js has revolutionized the way we build React applications with its hybrid static and server rendering capabilities. The App Router introduced in Next.js 13 brings a new paradigm to routing and rendering in Next.js applications.</p>
        
        <h2>Understanding the App Router</h2>
        <p>The App Router uses a file-system based router built on top of Server Components. It supports layouts, nested routing, loading states, error handling, and more.</p>
        
        <h2>Key Features</h2>
        <ul>
          <li><strong>Server Components</strong>: Components that render on the server, reducing client-side JavaScript.</li>
          <li><strong>Nested Layouts</strong>: Create UI that is shared across routes with nested layouts.</li>
          <li><strong>Loading States</strong>: Create loading UI for specific route segments.</li>
          <li><strong>Error Handling</strong>: Capture errors at the route level.</li>
        </ul>
        
        <h2>Getting Started</h2>
        <p>To create a new Next.js project with the App Router, use the following command:</p>
        <pre><code>npx create-next-app@latest my-app --use-npm</code></pre>
        
        <p>This will set up a new Next.js project with the App Router configuration already in place.</p>
        
        <h2>Building Your First Route</h2>
        <p>In the App Router, routes are defined by folders within the app directory, and the route's UI is defined by a page.js file within that folder.</p>
        
        <p>For example, to create a route for /dashboard, you would create the following structure:</p>
        <pre><code>app/
 └── dashboard/
     └── page.js</code></pre>
        
        <p>And the page.js file could contain a simple React component:</p>
        <pre><code>export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard!</p>
    </div>
  )
}</code></pre>
        
        <h2>Conclusion</h2>
        <p>The App Router in Next.js 13+ provides a powerful and flexible way to build modern web applications. With server components, layouts, and other features, it enables developers to create performant and maintainable applications with ease.</p>
      `,
      date: '2023-11-15',
      readTime: 8,
      tags: ['Next.js', 'React', 'Web Development']
    },
    {
      id: '2',
      title: 'Building a SaaS Application with React and Node.js',
      slug: 'building-saas-react-nodejs',
      content: `
        <p>Building a Software as a Service (SaaS) application requires careful planning and architecture. This guide explores how to combine React for the frontend and Node.js for the backend to create a scalable SaaS product.</p>
        
        <h2>Planning Your SaaS Architecture</h2>
        <p>Before diving into coding, it's crucial to plan your application architecture. Consider:</p>
        <ul>
          <li>User authentication and authorization</li>
          <li>Multi-tenancy approach</li>
          <li>Billing and subscription management</li>
          <li>API design and data flow</li>
        </ul>
        
        <p>A typical SaaS architecture might look like this:</p>
        <pre><code>Client (React) ↔ API Gateway ↔ Microservices (Node.js) ↔ Database</code></pre>
        
        <h2>Setting Up the Frontend with React</h2>
        <p>For the frontend, create a new React application:</p>
        <pre><code>npx create-react-app saas-frontend
cd saas-frontend
npm install axios react-router-dom styled-components</code></pre>
        
        <p>Structure your application with reusable components and proper state management.</p>
        
        <h2>Building the Backend with Node.js</h2>
        <p>For the backend, create a Node.js application with Express:</p>
        <pre><code>mkdir saas-backend
cd saas-backend
npm init -y
npm install express mongoose jsonwebtoken bcrypt dotenv cors</code></pre>
        
        <p>Implement API endpoints for user management, authentication, and your core business logic.</p>
        
        <h2>Implementing Authentication</h2>
        <p>Use JWT (JSON Web Tokens) for authentication:</p>
        <pre><code>const jwt = require('jsonwebtoken');

// Generate token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};</code></pre>
        
        <h2>Database Design for Multi-tenancy</h2>
        <p>There are several approaches to multi-tenancy in SaaS applications:</p>
        <ol>
          <li>Separate database per tenant</li>
          <li>Shared database with separate schemas</li>
          <li>Shared database and shared schema with tenant identifier</li>
        </ol>
        
        <p>For most SaaS applications, the third approach provides a good balance of isolation and resource efficiency.</p>
        
        <h2>Conclusion</h2>
        <p>Building a SaaS application with React and Node.js provides flexibility and scalability. By following best practices in architecture, authentication, and multi-tenancy, you can create a robust SaaS product that meets your customers' needs.</p>
      `,
      date: '2023-10-22',
      readTime: 12,
      tags: ['SaaS', 'React', 'Node.js', 'Architecture']
    },
    {
      id: '3',
      title: 'Implementing Authentication with NextAuth.js',
      slug: 'implementing-authentication-nextauth',
      content: '<p>Sample content for NextAuth.js authentication article...</p>',
      date: '2023-09-17',
      readTime: 6,
      tags: ['Authentication', 'Next.js', 'Security']
    },
    {
      id: '4',
      title: 'Responsive Design Patterns for Modern Web Applications',
      slug: 'responsive-design-patterns',
      content: '<p>Sample content for responsive design patterns article...</p>',
      date: '2023-08-29',
      readTime: 9,
      tags: ['CSS', 'UI/UX', 'Responsive Design']
    },
    {
      id: '5',
      title: 'State Management in React: Context API vs. Redux',
      slug: 'react-state-management-context-vs-redux',
      content: '<p>Sample content for state management article...</p>',
      date: '2023-07-14',
      readTime: 10,
      tags: ['React', 'State Management', 'Redux']
    },
    {
      id: '6',
      title: 'Optimizing API Performance in Node.js Applications',
      slug: 'optimizing-api-performance-nodejs',
      content: '<p>Sample content for API performance article...</p>',
      date: '2023-06-02',
      readTime: 11,
      tags: ['Node.js', 'Performance', 'API Design']
    }
  ];
  
  return posts.find(post => post.slug === slug);
};

/**
 * Generate metadata for the blog post page
 */
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getBlogPostBySlug(params.slug);
  
  if (!post) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.'
    };
  }
  
  return {
    title: `${post.title} | Blog`,
    description: post.content.substring(0, 160).replace(/<[^>]*>/g, ''),
    openGraph: {
      title: post.title,
      description: post.content.substring(0, 160).replace(/<[^>]*>/g, ''),
      type: 'article',
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}

/**
 * Generate static params for all blog posts
 * This enables static generation of all blog post pages at build time
 */
export async function generateStaticParams() {
  // In a real app, you would fetch all blog post slugs from your CMS or database
  const posts = [
    { slug: 'getting-started-with-nextjs-app-router' },
    { slug: 'building-saas-react-nodejs' },
    { slug: 'implementing-authentication-nextauth' },
    { slug: 'responsive-design-patterns' },
    { slug: 'react-state-management-context-vs-redux' },
    { slug: 'optimizing-api-performance-nodejs' },
  ];
  
  return posts;
}

/**
 * Blog post page component
 */
export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPostBySlug(params.slug);
  
  if (!post) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-16 pb-24">
      <div className="container mx-auto px-4">
        <Link 
          href="/blog"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
          Back to all articles
        </Link>
        
        <article className="bg-white dark:bg-gray-900 shadow-lg rounded-lg p-8 md:p-12 max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
              {post.date && (
                <time className="mr-6" dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              )}
              
              {post.readTime && (
                <span className="flex items-center">
                  <span className="mr-1">📚</span>
                  {post.readTime} min read
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {post.tags?.map((tag) => (
                <span 
                  key={tag}
                  className="px-3 py-1 text-sm rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>
          
          <div 
            className="prose prose-blue dark:prose-invert prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </div>
    </div>
  );
} 