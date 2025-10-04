import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface PostMetadata {
  title: string;
  date: Date;
  description: string;
  tags: string[];
  slug: string;
  previewImagePath?: string;
  previewImageAlt?: string;
}

export interface Post {
  filePath: string,
  slug: string,
}

const POSTS_DIR = path.join(process.cwd(), 'src/app/blog/posts');

// List all found posts, for static site purposes
export async function listPosts(): Promise<Post[]> {
  return fs.readdirSync(POSTS_DIR, { withFileTypes: true })
    .filter(filename => filename.name.endsWith('.mdx'))
    .map((filename) => ({
      filePath: path.join(POSTS_DIR, filename.name),
      slug: filename.name.replace(/\.mdx$/, ''),
    }));
}

export function makePostFromSlug(slug: string): Post {
  return {
    filePath: path.join(POSTS_DIR, slug) + '.mdx',
    slug: slug
  };
}

export async function getPostMetadata(post: Post): Promise<PostMetadata> {
  const content = await fs.promises.readFile(post.filePath, 'utf8');
  const { data } = matter(content);
  return {
    title: data.title || 'Untitled',
    date: new Date(data.date || ''),
    description: data.description || '',
    tags: data.tags || [],
    slug: post.slug,
    previewImagePath: data.previewImagePath,
    previewImageAlt: data.previewImageAlt,
  };
}

