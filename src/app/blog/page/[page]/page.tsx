import Link from 'next/link';
import Image from 'next/image';
import { PostMetadata, getPostMetadata, listPosts } from "@/app/blog/lib/post"
import { paginateData } from "@/app/blog/lib/pagination"
import NotFound from '@/app/not-found';
import Pagination from '@/app/blog/components/Pagination'
import { Metadata } from 'next';

const POSTS_PER_PAGE = 10;

export async function generateStaticParams() {
  const posts = await listPosts();
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const pages = []
  for (let i = 1; i <= totalPages; ++i) {
    pages.push({ page: String(i) });
  }
  return pages;
}

function postEntryComponent(post: PostMetadata) {
  const tags = post.tags.map((tag) => (
    <span key={tag} className="px-3 py-1 bg-gray-900 text-gray-200 text-sm rounded-full">
      {tag}
    </span>
  ));

  const hasImage: boolean = !!post.previewImagePath;

  return (
    <article key={post.slug} className="border-b border-gray-800 pb-8">
      <Link href={`/blog/${post.slug}`} className="group block">
        <div className={`grid ${hasImage ? "grid-cols-4" : "grid-cols-1"}`}>
          <div className={hasImage ? "col-span-3" : "col-span-1"}>
            <h2 className="text-2xl font-semibold mb-2 text-white group-hover:text-blue-300 transition-colors">
              {post.title}
            </h2>
            <time className="text-sm text-gray-500 mb-3 block">
              {post.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
            <p className="text-gray-200 mb-4">{post.description}</p>
            <div className="flex flex-wrap gap-2">{tags}</div>
          </div>
          {hasImage && (
            <div className="col-span-1 relative">
              <Image
                src={post.previewImagePath!}
                alt={post.previewImageAlt || ""}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params;
  const pageNum = Number(page);
  
  return {
    title: `Page blogs ${pageNum}`,
  }
}

export default async function BlogPosts({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const pageNum = Number(page);
  if (Number.isNaN(pageNum) || pageNum < 1) {
    return NotFound();
  }

  const pagination = paginateData((await listPosts()).toReversed(), POSTS_PER_PAGE, Number(page));
  const posts = (await Promise.all(pagination.data.map(getPostMetadata)))
    .sort((a: PostMetadata, b: PostMetadata) => b.date.getTime() - a.date.getTime());
  const postEntryComponents = posts.map(postEntryComponent);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-white">Blog Posts</h1>
      {posts.length === 0 ? (<p className="text-gray-300">No posts</p>)
        : (
          <div className="space-y-8">
            {postEntryComponents}
          </div>
        )}
      <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} />
    </div>
  );
}
