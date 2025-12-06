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

if (typeof window !== 'undefined') {
  (window as any).Prism = Prism;
}

import 'prismjs/themes/prism-solarizedlight.css';
import 'prismjs/components/prism-asmatmel';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-basic';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-clojure';
import 'prismjs/components/prism-cobol';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-dart';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-elixir';
import 'prismjs/components/prism-erlang';
import 'prismjs/components/prism-fortran';
import 'prismjs/components/prism-fsharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-groovy';
import 'prismjs/components/prism-haskell';
import 'prismjs/components/prism-haxe';
import 'prismjs/components/prism-ini';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-julia';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-latex';
import 'prismjs/components/prism-lua';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-matlab';
import 'prismjs/components/prism-makefile';
import 'prismjs/components/prism-objectivec';
import 'prismjs/components/prism-perl';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-powershell';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-r';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sas';
import 'prismjs/components/prism-scala';
import 'prismjs/components/prism-scheme';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-stata';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-vbnet';
import 'prismjs/components/prism-yaml';

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
