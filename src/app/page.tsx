import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <Image
            src="/cat-emoji.png"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          <h1 className="text-heading text-xl text-center">Hello!</h1>
          <p>Welcome to my site.</p>
          <p>I don&apos;t have anything to say here, why don&apos;t you go straight to the&nbsp;
            <Link
              className="px-2 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
              href="/blog">
             blog
            </Link>
            &nbsp;?
          </p>
        </main>
      </div>
    </div>

  );
}
