import Link from "next/link";

export default function About() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold">Coming soon</h1>
      <Link href="/" className="text-blue-500 hover:underline mt-4 inline-block">
        Go home
      </Link>
    </div>
  )
}