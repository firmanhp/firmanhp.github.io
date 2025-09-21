import { remark } from 'remark';
import { visit } from 'unist-util-visit';
import GithubSlugger from 'github-slugger';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function extractHeadings(markdown: string, slugger: GithubSlugger): TocItem[] {
  const headings: TocItem[] = [];
  const tree = remark().parse(markdown);

  visit(tree, 'heading', (node) => {
    const text = node.children
      .filter((child) => child.type === 'text')
      .map((child) => child.value)
      .join('');

    if (text) {
      headings.push({
        id: slugger.slug(text),
        text,
        level: node.depth
      });
    }
  });

  return headings;
}
