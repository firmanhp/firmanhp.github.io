import { visit } from 'unist-util-visit'
import { Root } from 'mdast'  // Markdown AST

// Handle directive blocks.
export function remarkDirectiveBlocks() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (node.type === 'containerDirective') {
        const data = node.data || (node.data = {})

        if (node.name === 'warning' || node.name === 'danger' || node.name === 'hint') {
          data.hName = 'div'
          data.hProperties = {
            // className: styles[node.name]
            className: node.name
          }
        }
      }
    });
  }
}