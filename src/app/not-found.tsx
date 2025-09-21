import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-gray-600 mt-4">Page not found</p>
      <Link href="/" className="text-blue-500 hover:underline mt-4 inline-block">
        Go home
      </Link>
    </div>
  )
}