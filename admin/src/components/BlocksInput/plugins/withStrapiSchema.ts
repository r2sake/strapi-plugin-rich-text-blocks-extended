import { Node, Editor, Element, Transforms, BaseText } from 'slate';
import { CustomText, CustomElement } from '../utils/types';

// Type guard to check if a node is a text node
const isText = (node: unknown): node is BaseText => {
  return Node.isNode(node) && !Editor.isEditor(node) && !Element.isElement(node);
};

/**
 * This plugin is used to normalize the Slate document to match the Strapi schema.
 */
const withStrapiSchema = (editor: Editor) => {
  const { normalizeNode } = editor;

  /**
   * On the strapi schema, we want text nodes to have type: text
   * By default, Slate adds text nodes without type: text
   * So we add this normalization for the cases when Slate adds text nodes automatically
   */
  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    // Check if the node is a text node but doesn't have the type property
    if (!Element.isElement(node) && isText(node) && !('type' in node)) {
      // Convert it to our CustomText type
      Transforms.setNodes<CustomText>(
        editor,
        { type: 'text' },
        { at: path }
      );
      return;
    }

    // Table normalization: Ensure tables have at least one row and rows have cells
    if (Element.isElement(node) && (node as CustomElement).type === 'table') {
      const tableNode = node as CustomElement;
      if (tableNode.children.length === 0) {
        Transforms.removeNodes(editor, { at: path });
        return;
      }
    }

    if (Element.isElement(node) && (node as CustomElement).type === 'table-row') {
      const rowNode = node as CustomElement;
      if (rowNode.children.length === 0) {
        Transforms.removeNodes(editor, { at: path });
        return;
      }
    }

    normalizeNode(entry);
  };

  return editor;
};

export { withStrapiSchema };