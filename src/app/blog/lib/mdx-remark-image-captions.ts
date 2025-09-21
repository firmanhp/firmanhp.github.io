import { visit } from 'unist-util-visit'
import { Root, PhrasingContent } from 'mdast'  // Markdown AST

export default function remarkImageCaptions() {
  return (tree: Root) => {
    visit(tree, (node) => {
      // Check if current node is a paragraph
      if (node.type !== 'paragraph')
        return;
      
      // Check if paragraph has at least 2 children and starts with an image
      if (node.children.length < 2 || node.children[0].type !== 'image')
        return;

      // Get the image and caption content
      const imageNode = node.children[0];
      const captionContent = node.children.slice(1); // Everything after the image

      // Change this node into <figure>
      const data = node.data || (node.data = {})
      data.hName = 'figure'

      // Create a new figcaption node with all the caption content
      const figcaptionNode = {
        type: 'paragraph',
        children: captionContent,
        data: {
          hName: 'figcaption',
          hProperties: {
            className: 'imageCaption'
          }
        }
      } as unknown as PhrasingContent; // wtf?

      // Replace the paragraph children with just image + figcaption
      node.children = [imageNode, figcaptionNode];
    });
  }
}