import { redirect } from 'next/navigation'



export default async function Blog() {
  return redirect('/blog/page/1');
}