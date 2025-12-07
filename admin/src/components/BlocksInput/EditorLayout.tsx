import * as React from 'react';

import { Box, Flex, FocusTrap, Portal, IconButton, FlexComponent } from '@strapi/design-system';
import { Collapse } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { css, styled } from 'styled-components';

import { getTranslation } from '../../utils/getTranslation';
import { useBlocksEditorContext } from './BlocksEditor';


const CollapseIconButton = styled(IconButton)`
  position: absolute;
  bottom: 1.2rem;
  right: 1.2rem;
`;

const ExpandWrapper = styled<FlexComponent>(Flex)`
  // Background with 20% opacity
  background: ${({ theme }) => `${theme.colors.neutral800}1F`};
`;

interface EditorLayoutProps {
  children: React.ReactNode;
  error?: string;
  onCollapse: () => void;
  disabled: boolean;
  ariaDescriptionId: string;
}

const EditorLayout = ({
  children,
  error,
  disabled,
  onCollapse,
  ariaDescriptionId,
}: EditorLayoutProps) => {
  const { formatMessage } = useIntl();
  const { isExpandedMode } = useBlocksEditorContext('editorLayout');

  React.useEffect(() => {
    if (isExpandedMode) {
      document.body.classList.add('lock-body-scroll');
    }

    return () => {
      document.body.classList.remove('lock-body-scroll');
    };
  }, [isExpandedMode]);

  if (isExpandedMode) {
    return (
      <Portal role="dialog" aria-modal={false}>
        <FocusTrap onEscape={onCollapse}>
          <ExpandWrapper
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            zIndex={4}
            justifyContent="center"
            onClick={onCollapse}
          >
            <Box<'div'>
              background="neutral900" // Changed from neutral0
              hasRadius
              shadow="popupShadow"
              overflow="hidden"
              width="90%"
              height="90%"
              onClick={(e) => e.stopPropagation()}
              aria-describedby={ariaDescriptionId}
              position="relative"
            >
              <Flex height="100%" alignItems="flex-start" direction="column">
                {children}
                <CollapseIconButton
                  label={formatMessage({
                    id: getTranslation('components.Blocks.collapse'),
                    defaultMessage: 'Collapse',
                  })}
                  onClick={onCollapse}
                >
                  <Collapse />
                </CollapseIconButton>
              </Flex>
            </Box>
          </ExpandWrapper>
        </FocusTrap>
      </Portal>
    );
  }

  return (
    <InputWrapper
      direction="column"
      alignItems="flex-start"
      // height="512px"
      $disabled={disabled}
      $hasError={Boolean(error)}
      style={{ overflowY: 'auto', overflowX: 'hidden' }}
      aria-describedby={ariaDescriptionId}
      position="relative"
    >
      {children}
    </InputWrapper>
  );
};

const InputWrapper = styled<FlexComponent>(Flex)<{ $disabled?: boolean; $hasError?: boolean }>`
  border: 1px solid
    ${({ theme, $hasError }) => ($hasError ? theme.colors.danger600 : theme.colors.neutral200)};
  border-radius: ${({ theme }) => theme.borderRadius};
  resize: vertical;
  background: ${({ theme }) => theme.colors.neutral0};
  height: 600px;
  overflow-y: auto;
  overflow-x: hidden;

  // Dark mode overrides
  background: #181826; // neutral900
  border-color: #4a4a6a; // neutral600
  color: #ffffff;

  // Ensure text content is visible in dark mode
  & p, & span, & h1, & h2, & h3, & h4, & h5, & h6, & li, & div {
     color: #ffffff !important;
  }
  
  // Update icon colors in toolbar for dark mode visibility
  & button svg path {
    fill: #a5a5ba; // neutral400 - make icons lighter
  }
  & button[aria-checked="true"] svg path, & button[data-state="on"] svg path {
    fill: ${({ theme }) => theme.colors.primary600} !important; // Keep primary color for active
  }
  & button:hover svg path {
    fill: ${({ theme }) => theme.colors.primary500};
  }
  // Fix dropdown text color
  & div[role="combobox"] span {
    color: #ffffff !important;
  }

  ${({ theme, $hasError = false }) => css`
    outline: none;
    box-shadow: 0;
    transition-property: border-color, box-shadow, fill;
    transition-duration: 0.2s;

    &:focus-within {
      border: 1px solid ${$hasError ? theme.colors.danger600 : theme.colors.primary600};
      box-shadow: ${$hasError ? theme.colors.danger600 : theme.colors.primary600} 0px 0px 0px 2px;
    }
  `}

  ${({ theme, $disabled }) =>
    $disabled
      ? css`
          color: ${theme.colors.neutral600};
          background: ${theme.colors.neutral150};
        `
      : undefined}
`;

export { EditorLayout };
