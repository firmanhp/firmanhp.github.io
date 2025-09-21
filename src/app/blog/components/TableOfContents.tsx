'use client'

import { TocItem } from '@/app/blog/lib/mdx-utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface TableOfContentsProps {
  className?: string;
  tocEntries?: TocItem[];
}

export default function TableOfContents({ className, tocEntries }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.filter((entry) => entry.isIntersecting)
          .forEach((entry) => setActiveId(entry.target.id))
      },
      { rootMargin: '-90px 0px -90% 0px' });
    tocEntries?.forEach((entry) => {
      const element = document.getElementById(entry.id);
      if (element)
        observer.observe(element)
    });

    return () => observer.disconnect();
  }, [tocEntries]);

  return (
    <aside className={`${className} p-4`}>
      <div className="lg:sticky lg:top-20">
        <h3 className="text-lg font-semibold mb-4">Table of Contents</h3>
        <nav className="space-y-2">
          {tocEntries?.map((entry) => (
            <Link
              key={entry.id}
              href={`#${entry.id}`}
              className={`block ${activeId === entry.id
                ? 'text-blue-400 font-medium border-l-2 border-blue-400 pl-3'
                : 'text-gray-400 hover:text-gray-200'}`}
              style={{
                marginLeft: entry.level > 1 ? `${(entry.level - 1) * 0.75}rem` : '0',
                fontSize: entry.level === 1 ? '0.95rem' : '0.85rem'
              }}>
              {entry.text}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}