import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { extractHeadings } from '@/app/blog/lib/mdx-utils'
import GithubSlugger from 'github-slugger'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import 'highlight.js/styles/github-dark.css'
import TableOfContents from '../components/TableOfContents'
import { remarkDirectiveBlocks } from '@/app/blog/lib/mdx-remark-directive-blocks'
import remarkImageCaptions from '../lib/mdx-remark-image-captions'

const POSTS_DIR = path.join(process.cwd(), 'src/app/blog/posts')

// Generate all found posts, for static site purposes
export async function generateStaticParams() {
  return fs.readdirSync(POSTS_DIR, { withFileTypes: true })
    .filter(filename => filename.name.endsWith('.mdx'))
    .map((filename) => ({ slug: filename.name.slice(0, -4) }))
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`)
  const fileContent = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContent)
  const slugger = new GithubSlugger();
  const headings = extractHeadings(content, slugger)

  return (
    <div className="lg:grid lg:grid-cols-4 lg:gap-8">
      <div className="lg:hidden mb-8">
        <TableOfContents tocEntries={headings} />
      </div>

      <article className="lg:col-span-3">
        <h1 className="text-white">{data.title}</h1>
        <time className="text-gray-500 text-sm">{data.date}</time>

        <div className="mt-8 prose prose-invert max-w-none">
          <MDXRemote source={content} options={{
            mdxOptions: {
              remarkPlugins: [
                remarkGfm,
                remarkDirective,
                remarkDirectiveBlocks,
                remarkImageCaptions,
              ],
              rehypePlugins: [
                [rehypeSlug, { slugger }],
                rehypeHighlight,
              ]
            }
          }} />
        </div>
      </article>
      <TableOfContents className="hidden lg:block lg:col-span-1" tocEntries={headings} />
    </div>
  )
}