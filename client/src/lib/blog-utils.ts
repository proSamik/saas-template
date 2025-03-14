import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
import { BlogPost } from '@/app/blog/BlogList';

const postsDirectory = path.join(process.cwd(), 'public/blog/posts');

/**
 * Get all blog posts metadata from markdown files
 */
export function getAllPosts(): BlogPost[] {
  // Get all markdown files in the posts directory
  const fileNames = fs.readdirSync(postsDirectory);
  
  const allPostsData = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
      // Remove ".md" from file name to get slug
      const slug = fileName.replace(/\.md$/, '');
      
      // Read markdown file as string
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      
      // Parse markdown frontmatter
      const { data, content } = matter(fileContents);
      
      // Calculate read time (average reading speed: 200 words per minute)
      const wordCount = content.split(/\s+/).length;
      const readTime = Math.ceil(wordCount / 200);
      
      // Format as BlogPost type
      return {
        id: slug,
        slug,
        title: data.title,
        description: data.description || '',
        date: data.date ? new Date(data.date).toISOString() : undefined,
        readTime,
        tags: data.tags || [],
        // We don't include content here to keep the list lighter
      };
    })
    // Sort posts by date
    .sort((a, b) => {
      if (a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return 0;
    });
    
  return allPostsData;
}

/**
 * Get a single blog post by slug
 */
export async function getPostBySlug(slug: string) {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    
    // Parse markdown frontmatter and content
    const { data, content } = matter(fileContents);
    
    // Convert markdown to HTML with GitHub-flavored markdown support
    const processedContent = await remark()
      .use(remarkGfm) // GitHub-flavored markdown
      .use(remarkHtml, { sanitize: false }) // Allow HTML in markdown
      .process(content);
    
    const contentHtml = processedContent.toString();
    
    // Calculate read time
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);
    
    // Return blog post with content
    return {
      id: slug,
      slug,
      title: data.title,
      description: data.description || '',
      date: data.date ? new Date(data.date).toISOString() : undefined,
      readTime,
      tags: data.tags || [],
      content: contentHtml
    };
  } catch (error) {
    console.error(`Error loading post ${slug}:`, error);
    return null;
  }
}

/**
 * Get all available blog post slugs
 */
export function getAllPostSlugs() {
  const fileNames = fs.readdirSync(postsDirectory);
  
  return fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => ({
      slug: fileName.replace(/\.md$/, '')
    }));
} 