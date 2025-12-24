import * as React from 'react';

import { Box, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { CodeBlock as CodeBlockIcon } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { BaseRange, Element, Editor, Node, NodeEntry, Transforms } from 'slate';
import { useSelected, type RenderElementProps, useFocused, ReactEditor } from 'slate-react';
import { styled } from 'styled-components';

// Highlight.js Core
import hljs from 'highlight.js/lib/core';
import 'highlight.js/styles/atom-one-light.css';

// Import Languages
import bash from 'highlight.js/lib/languages/bash';
import basic from 'highlight.js/lib/languages/basic';
import c from 'highlight.js/lib/languages/c';
import clojure from 'highlight.js/lib/languages/clojure';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import dart from 'highlight.js/lib/languages/dart';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import elixir from 'highlight.js/lib/languages/elixir';
import erlang from 'highlight.js/lib/languages/erlang';
import fortran from 'highlight.js/lib/languages/fortran';
import fsharp from 'highlight.js/lib/languages/fsharp';
import go from 'highlight.js/lib/languages/go';
import graphql from 'highlight.js/lib/languages/graphql';
import groovy from 'highlight.js/lib/languages/groovy';
import haskell from 'highlight.js/lib/languages/haskell';
import haxe from 'highlight.js/lib/languages/haxe';
import ini from 'highlight.js/lib/languages/ini';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import julia from 'highlight.js/lib/languages/julia';
import kotlin from 'highlight.js/lib/languages/kotlin';
import latex from 'highlight.js/lib/languages/latex';
import lua from 'highlight.js/lib/languages/lua';
import makefile from 'highlight.js/lib/languages/makefile';
import markdown from 'highlight.js/lib/languages/markdown';
import matlab from 'highlight.js/lib/languages/matlab';
import objectivec from 'highlight.js/lib/languages/objectivec';
import perl from 'highlight.js/lib/languages/perl';
import php from 'highlight.js/lib/languages/php';
import powershell from 'highlight.js/lib/languages/powershell';
import python from 'highlight.js/lib/languages/python';
import r from 'highlight.js/lib/languages/r';
import ruby from 'highlight.js/lib/languages/ruby';
import rust from 'highlight.js/lib/languages/rust';
import scala from 'highlight.js/lib/languages/scala';
import scheme from 'highlight.js/lib/languages/scheme';
import sql from 'highlight.js/lib/languages/sql';
import swift from 'highlight.js/lib/languages/swift';
import typescript from 'highlight.js/lib/languages/typescript';
import vbnet from 'highlight.js/lib/languages/vbnet';
import x86asm from 'highlight.js/lib/languages/x86asm';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

import { useBlocksEditorContext, type BlocksStore } from '../BlocksEditor';
import { codeLanguages } from '../utils/constants';
import { baseHandleConvert } from '../utils/conversions';
import { pressEnterTwiceToExit } from '../utils/enterKey';
import { CustomElement, CustomText, type Block } from '../utils/types';

// Register Languages
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('basic', basic);
hljs.registerLanguage('c', c);
hljs.registerLanguage('clojure', clojure);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('css', css);
hljs.registerLanguage('dart', dart);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('elixir', elixir);
hljs.registerLanguage('erlang', erlang);
hljs.registerLanguage('fortran', fortran);
hljs.registerLanguage('fsharp', fsharp);
hljs.registerLanguage('go', go);
hljs.registerLanguage('graphql', graphql);
hljs.registerLanguage('groovy', groovy);
hljs.registerLanguage('haskell', haskell);
hljs.registerLanguage('haxe', haxe);
hljs.registerLanguage('ini', ini);
hljs.registerLanguage('java', java);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('julia', julia);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('latex', latex);
hljs.registerLanguage('lua', lua);
hljs.registerLanguage('makefile', makefile);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('matlab', matlab);
hljs.registerLanguage('objectivec', objectivec);
hljs.registerLanguage('perl', perl);
hljs.registerLanguage('php', php);
hljs.registerLanguage('powershell', powershell);
hljs.registerLanguage('python', python);
hljs.registerLanguage('r', r);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('scala', scala);
hljs.registerLanguage('scheme', scheme);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('vbnet', vbnet);
hljs.registerLanguage('x86asm', x86asm);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);

// Map internal values to hljs languages
const languageMap: Record<string, string> = {
  asm: 'x86asm',
  jsx: 'javascript',
  tsx: 'typescript',
  html: 'xml',
};

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
    !Editor.isEditor(node) && Element.isElement(node) && 'type' in node && node.type === 'code'
  );
};

const decodeHtml = (html: string) => {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

export const decorateCode = ([node, path]: NodeEntry) => {
  const ranges: BaseRangeCustom[] = [];

  // Only process code elements
  if (!Element.isElement(node)) {
    return ranges;
  }

  const element = node as CustomElement;
  if (element.type !== 'code') {
    return ranges;
  }

  const text = Node.string(node);
  const langValue = element.language as string | undefined;
  const language = languageMap[langValue || 'plaintext'] || langValue || 'plaintext';

  if (!hljs.getLanguage(language)) {
    return ranges;
  }

  const html = hljs.highlight(text, { language }).value;

  const tokens = html.match(/<span class="[^"]*">|<\/span>|[^<]+/g) || [];
  let offset = 0;
  const classStack: string[] = [];

  for (const token of tokens) {
    if (token.startsWith('<span')) {
      const match = token.match(/class="([^"]*)"/);
      const className = match ? match[1] : '';
      classStack.push(className);
    } else if (token === '</span>') {
      classStack.pop();
    } else {
      const decodedText = decodeHtml(token);
      const length = decodedText.length;

      if (classStack.length > 0) {
        const className = classStack.join(' ');
        ranges.push({
          anchor: { path, offset },
          focus: { path, offset: offset + length },
          className,
        });
      }
      offset += length;
    }
  }

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
    font-family:
      'SF Mono', SFMono-Regular, ui-monospace, 'DejaVu Sans Mono', Menlo, Consolas, monospace;
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
        <code className="hljs">{props.children}</code>
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
          style={{ zIndex: 10 }}
        >
          <SingleSelect
            onChange={(open: string | number) => {
              Transforms.setNodes<CodeElement>(
                editor,
                { language: open.toString() },
                {
                  match: (node): node is CodeElement => isCodeElement(node),
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
    renderElement: (props: RenderElementProps) => <CodeEditor {...(props as CodeEditorProps)} />,
    icon: CodeBlockIcon,
    label: {
      id: 'components.Blocks.blocks.code',
      defaultMessage: 'Code block',
    },
    // Update the matchNode function to accept Node type
    matchNode: (node: Node): node is CodeElement => {
      return (
        !Editor.isEditor(node) && Element.isElement(node) && 'type' in node && node.type === 'code'
      );
    },
    isInBlocksSelector: true,
    handleConvert(editor) {
      baseHandleConvert<CodeElement>(editor, {
        type: 'code',
        language: 'plaintext',
        children: [{ type: 'text', text: '' } as CustomText],
      });
    },
    handleEnterKey(editor) {
      pressEnterTwiceToExit(editor);
    },
    snippets: ['```'],
  },
};

export { codeBlocks };
