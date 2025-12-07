import * as React from 'react';

import { Box, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { CodeBlock as CodeBlockIcon } from '@strapi/icons';
import * as Prism from 'prismjs';
import { useIntl } from 'react-intl';
import { BaseRange, Element, Editor, Node, NodeEntry, Transforms } from 'slate';
import { useSelected, type RenderElementProps, useFocused, ReactEditor } from 'slate-react';
import { styled } from 'styled-components';

import { useBlocksEditorContext, type BlocksStore } from '../BlocksEditor';
import { codeLanguages } from '../utils/constants';
import { baseHandleConvert } from '../utils/conversions';
import { pressEnterTwiceToExit } from '../utils/enterKey';
import { CustomElement, CustomText, type Block } from '../utils/types';

// Initialize Prism instance
if (typeof window !== 'undefined') {
  (window as any).Prism = Prism;
}

import 'prismjs/themes/prism-solarizedlight.css';

// Dynamically load languages to ensure Prism is defined first
const loadPrismLanguages = async () => {
  if (typeof window === 'undefined') return;

  // Manual definition again to be safe inside the async context
  if (!(window as any).Prism) {
    (window as any).Prism = Prism;
  }

  await import('prismjs/components/prism-asmatmel');
  await import('prismjs/components/prism-bash');
  await import('prismjs/components/prism-basic');
  await import('prismjs/components/prism-c');
  await import('prismjs/components/prism-clojure');
  await import('prismjs/components/prism-cobol');
  await import('prismjs/components/prism-cpp');
  await import('prismjs/components/prism-csharp');
  await import('prismjs/components/prism-dart');
  await import('prismjs/components/prism-docker');
  await import('prismjs/components/prism-elixir');
  await import('prismjs/components/prism-erlang');
  await import('prismjs/components/prism-fortran');
  await import('prismjs/components/prism-fsharp');
  await import('prismjs/components/prism-go');
  await import('prismjs/components/prism-graphql');
  await import('prismjs/components/prism-groovy');
  await import('prismjs/components/prism-haskell');
  await import('prismjs/components/prism-haxe');
  await import('prismjs/components/prism-ini');
  await import('prismjs/components/prism-java');
  await import('prismjs/components/prism-javascript');
  await import('prismjs/components/prism-jsx');
  await import('prismjs/components/prism-json');
  await import('prismjs/components/prism-julia');
  await import('prismjs/components/prism-kotlin');
  await import('prismjs/components/prism-latex');
  await import('prismjs/components/prism-lua');
  await import('prismjs/components/prism-markdown');
  await import('prismjs/components/prism-matlab');
  await import('prismjs/components/prism-makefile');
  await import('prismjs/components/prism-objectivec');
  await import('prismjs/components/prism-perl');
  await import('prismjs/components/prism-php');
  await import('prismjs/components/prism-powershell');
  await import('prismjs/components/prism-python');
  await import('prismjs/components/prism-r');
  await import('prismjs/components/prism-ruby');
  await import('prismjs/components/prism-rust');
  await import('prismjs/components/prism-sas');
  await import('prismjs/components/prism-scala');
  await import('prismjs/components/prism-scheme');
  await import('prismjs/components/prism-sql');
  await import('prismjs/components/prism-stata');
  await import('prismjs/components/prism-swift');
  await import('prismjs/components/prism-typescript');
  await import('prismjs/components/prism-tsx');
  await import('prismjs/components/prism-vbnet');
  await import('prismjs/components/prism-yaml');
};

loadPrismLanguages();

// Add custom type definitions
interface CodeElement extends CustomElement {
  type: 'code';
  language?: string;
  children: CustomText[];
}

interface CodeEditorProps extends RenderElementProps {
  element: CodeElement;
}

type BaseRangeCustom = BaseRange & { className: string };

const isCodeElement = (node: Node): node is CodeElement => {
  return (
    !Editor.isEditor(node) && 
    Element.isElement(node) && 
    'type' in node && 
    node.type === 'code'
  );
};

export const decorateCode = ([node, path]: NodeEntry) => {
  const ranges: BaseRangeCustom[] = [];

  // make sure it is an Slate Element
  if (!Element.isElement(node) ||  'type' in node && 
    node.type === 'code') return ranges;
  // transform the Element into a string
  const text = Node.string(node);
  const language = codeLanguages.find((lang) => lang.value === (node as CustomElement).language);
  const decorateKey = language?.decorate ?? language?.value;

  const selectedLanguage = Prism.languages[decorateKey || 'plaintext'];

  // create "tokens" with "prismjs" and put them in "ranges"
  const tokens = Prism.tokenize(text, selectedLanguage);
  let start = 0;
  for (const token of tokens) {
    const length = token.length;
    const end = start + length;
    if (typeof token !== 'string') {
      ranges.push({
        anchor: { path, offset: start },
        focus: { path, offset: end },
        className: `token ${token.type}`,
      });
    }
    start = end;
  }

  // these will be found in "renderLeaf" in "leaf" and their "className" will be applied
  return ranges;
};

const CodeBlock = styled.pre`
  border-radius: ${({ theme }) => theme.borderRadius};
  background-color: ${({ theme }) => theme.colors.neutral100};
  max-width: 100%;
  overflow: auto;
  padding: ${({ theme }) => `${theme.spaces[3]} ${theme.spaces[4]}`};
  flex-shrink: 1;

  & > code {
    font-family: 'SF Mono', SFMono-Regular, ui-monospace, 'DejaVu Sans Mono', Menlo, Consolas,
      monospace;
    color: ${({ theme }) => theme.colors.neutral800};
    overflow: auto;
    max-width: 100%;
  }
`;

const CodeEditor = (props: CodeEditorProps) => {
  const { editor } = useBlocksEditorContext('CodeEditor');
  const editorIsFocused = useFocused();
  const imageIsSelected = useSelected();
  const { formatMessage } = useIntl();
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);
  const shouldDisplayLanguageSelect = (editorIsFocused && imageIsSelected) || isSelectOpen;

  return (
    <Box position="relative" width="100%">
      <CodeBlock {...props.attributes}>
        <code>{props.children}</code>
      </CodeBlock>
      {shouldDisplayLanguageSelect && (
        <Box
          position="absolute"
          background="neutral0"
          borderColor="neutral150"
          borderStyle="solid"
          borderWidth="0.5px"
          shadow="tableShadow"
          top="100%"
          marginTop={1}
          right={0}
          padding={1}
          hasRadius
        >
          <SingleSelect
            onChange={(open: string | number) => {
              Transforms.setNodes<CodeElement>(
                editor,
                { language: open.toString() },
                { 
                  match: (node): node is CodeElement => isCodeElement(node)
                }
              );
            }}
            value={(isCodeElement(props.element) && props.element.language) || 'plaintext'}
            onOpenChange={(open: boolean) => {
              setIsSelectOpen(open);

              // Focus the editor again when closing the select so the user can continue typing
              if (!open) {
                ReactEditor.focus(editor as ReactEditor);
              }
            }}
            onCloseAutoFocus={(e: Event) => e.preventDefault()}
            aria-label={formatMessage({
              id: 'components.Blocks.blocks.code.languageLabel',
              defaultMessage: 'Select a language',
            })}
          >
            {codeLanguages.map(({ value, label }) => (
              <SingleSelectOption value={value} key={value}>
                {label}
              </SingleSelectOption>
            ))}
          </SingleSelect>
        </Box>
      )}
    </Box>
  );
};

const codeBlocks: Pick<BlocksStore, 'code'> = {
  code: {
    renderElement: (props: RenderElementProps) => <CodeEditor {...props as CodeEditorProps} />,
    icon: CodeBlockIcon,
    label: {
      id: 'components.Blocks.blocks.code',
      defaultMessage: 'Code block',
    },
    // Update the matchNode function to accept Node type
    matchNode: (node: Node): node is CodeElement => {
      return (
        !Editor.isEditor(node) && 
        Element.isElement(node) && 
        'type' in node && 
        node.type === 'code'
      );
    },
    isInBlocksSelector: true,
    handleConvert(editor) {
      baseHandleConvert<CodeElement>(editor, { 
        type: 'code', 
        language: 'plaintext',
        children: [{ type: 'text', text: '' } as CustomText]
      });
    },
    handleEnterKey(editor) {
      pressEnterTwiceToExit(editor);
    },
    snippets: ['```'],
  },
};

export { codeBlocks };
