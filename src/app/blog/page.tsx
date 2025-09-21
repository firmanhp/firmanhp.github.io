import BlogPage from '@/app/blog/page/[page]/page'

export default async function Blog() {
  return BlogPage({ params: Promise.resolve({ page: "1" })});
}