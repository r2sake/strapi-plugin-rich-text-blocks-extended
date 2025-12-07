import * as React from 'react';
import { styled } from 'styled-components';
import { Typography } from '@strapi/design-system';
import { Paragraph } from '@strapi/icons'; // Using Paragraph as a placeholder for Table icon
import { Editor, Transforms, Element as SlateElement, Path, Node } from 'slate';
import { ReactEditor, useSlate, type RenderElementProps } from 'slate-react';

import { baseHandleConvert } from '../utils/conversions';
import { type Block, TableNode, TableRowNode, TableCellNode } from '../utils/types';

const TableRoot = styled.table`
  display: table !important;
  width: 100%;
  border-collapse: collapse;
  table-layout: auto; // Changed from fixed
  margin-top: ${({ theme }) => theme.spaces[2]};
  margin-bottom: ${({ theme }) => theme.spaces[2]};
  
  // Ensure table itself has borders if needed, or rely on cells
`;

const Tbody = styled.tbody`
  display: table-row-group !important;
`;

const Tr = styled.tr`
  display: table-row !important;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral600}; // Darker/Lighter for visibility
`;

const Td = styled.td`
  display: table-cell !important;
  padding: ${({ theme }) => theme.spaces[2]};
  border: 1px solid ${({ theme }) => theme.colors.neutral600}; // Darker/Lighter for visibility
  min-width: 50px;
  vertical-align: top;
  color: inherit; // Ensure text color is inherited
  
  // Prevent collapsing
  height: 100%; 
`;

const TableComponent = ({ attributes, children, element }: RenderElementProps) => {
  const tableNode = element as TableNode;
  const allRows = tableNode.children || [];
  
  // Separation Logic: Identify header rows (assume contiguous from top)
  let headerRowCount = 0;
  for (const row of allRows) {
      const cells = (row as any).children || [];
      if (cells.length > 0 && cells[0].isHeader) {
          headerRowCount++;
      } else {
          break; // Stop at first non-header row
      }
  }

  const bodyRows = allRows.slice(headerRowCount);
  
  // Grouping Logic (Only for body rows)
  interface Range { start: number; end: number; }
  let ranges: Range[] = [];
  
  // Important: rowIndex here is relative to bodyRows (0-based for body)
  // But when we map to `childrenArray`, we need absolute index.
  // Let's use ABSOLUTE indices for ranges to avoid confusion, 
  // but only process body rows.
  
  bodyRows.forEach((row, bodyRowIndex) => {
      const absoluteRowIndex = headerRowCount + bodyRowIndex;
      const cells = (row as any).children || [];
      cells.forEach((cell: any) => {
          if (cell.rowspan && cell.rowspan > 1) {
                const end = absoluteRowIndex + cell.rowspan - 1;
                ranges.push({ start: absoluteRowIndex, end: end });
          }
      });
  });
  
  ranges.sort((a, b) => a.start - b.start);
  
  const mergedRanges: Range[] = [];
  if (ranges.length > 0) {
      let current = ranges[0];
      for (let i = 1; i < ranges.length; i++) {
          if (current.end >= ranges[i].start) {
              current.end = Math.max(current.end, ranges[i].end);
          } else {
              mergedRanges.push(current);
              current = ranges[i];
          }
      }
      mergedRanges.push(current);
  }
  
  const groups: number[][] = [];
  const childrenArray = React.Children.toArray(children);
  const totalRows = childrenArray.length; // Should match allRows.length
  
  let currentAbsoluteRow = headerRowCount; // Start from first body row
  
  while (currentAbsoluteRow < totalRows) {
      const range = mergedRanges.find(r => r.start === currentAbsoluteRow);
      const rowIndices: number[] = [];
      
      if (range) {
          for(let i=range.start; i<=range.end; i++) {
              if (i < totalRows) rowIndices.push(i);
          }
          currentAbsoluteRow = range.end + 1;
      } else {
          rowIndices.push(currentAbsoluteRow);
          currentAbsoluteRow++;
      }
      if (rowIndices.length > 0) groups.push(rowIndices);
  }
  
  // Header Rows Indices
  const headerIndices = Array.from({ length: headerRowCount }, (_, i) => i);

  return (
    <TableRoot {...attributes}>
        {/* Render Header Rows (if any) - No implicit background color or specific header style comes from Th component */}
       {headerIndices.length > 0 && (
           <Tbody>
               {headerIndices.map(i => childrenArray[i])}
           </Tbody>
       )}
       
       {/* Render Body Groups with Stripes */}
      {groups.map((groupIndices, index) => (
          <Tbody 
            key={`group-${index}`} 
            className={(index + 1) % 2 === 0 ? 'tbody-even' : 'tbody-odd'}
            style={{ backgroundColor: (index + 1) % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent' }}
          >
              {groupIndices.map(i => childrenArray[i])}
          </Tbody>
      ))}
    </TableRoot>
  );
};

const TableRowComponent = ({ attributes, children }: RenderElementProps) => {
  return <Tr {...attributes}>{children}</Tr>;
};

const Th = styled.th`
  display: table-cell !important;
  padding: ${({ theme }) => theme.spaces[2]};
  border: 1px solid ${({ theme }) => theme.colors.neutral600};
  min-width: 50px;
  vertical-align: top;
  color: inherit;
  font-weight: bold;
  background-color: ${({ theme }) => theme.colors.neutral200}; /* Slightly different bg for header */
  
  // Dark mode adjustment if needed, but neutral100 is dark grey in dark mode?
  // In previous turns we established Input is dark.
  // neutral100 is usually lighter than neutral0.
  // If neutral0 is #181826 (Dark), neutral100 is #212134 (Lighter Dark).
  // So it should look like a header.
`;

const TableCellComponent = ({ attributes, children, element }: RenderElementProps) => {
  const editor = useSlate();
  const cell = element as any; // Cast to access custom props

  // Key down handling to prevent deleting empty cell on Backspace
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Backspace') {
      const cellPath = ReactEditor.findPath(editor as ReactEditor, element);
      const text = Node.string(cell);
      const { selection } = editor;
      if (selection && Editor.isStart(editor, selection.anchor, cellPath)) {
        // Prevent default deletion which would remove the cell
        event.preventDefault();
        return;
      }
    }
  };

  if (cell.isHeader) {
      return (
          <Th 
            {...attributes} 
            colSpan={cell.colspan} 
            rowSpan={cell.rowspan}
            onKeyDown={handleKeyDown}
          >
            {children}
          </Th>
      );
  }
  
  return (
    <Td 
        {...attributes}
        colSpan={cell.colspan} 
        rowSpan={cell.rowspan}
        onKeyDown={handleKeyDown}
    >
        {children}
    </Td>
  );
};

const tableBlocks: any = {
  table: {
    renderElement: (props: RenderElementProps) => <TableComponent {...props} />,
    icon: Paragraph,
    label: {
      id: 'components.Blocks.blocks.table',
      defaultMessage: 'Table',
    },
    matchNode: (node: { type: string }) => node.type === 'table',
    isInBlocksSelector: true as const,
    handleConvert(editor: Editor) {
        // Insert a basic 2x2 table. First row cells are marked as header by default.
        const tableNode: TableNode = {
            type: 'table',
            children: [
                {
                    type: 'table-row',
                    children: [
                        { type: 'table-cell', isHeader: false, children: [{ text: '' }] },
                        { type: 'table-cell', isHeader: false, children: [{ text: '' }] },
                    ]
                },
                {
                    type: 'table-row',
                    children: [
                        { type: 'table-cell', isHeader: false, children: [{ text: '' }] },
                        { type: 'table-cell', isHeader: false, children: [{ text: '' }] },
                    ]
                }
            ]
        };
        Transforms.insertNodes(editor, tableNode as any);
    },
    handleEnterKey(editor: Editor) {
        // Default behavior for now
        // Eventually could add new row
    }
  },
  'table-row': {
    renderElement: (props: RenderElementProps) => <TableRowComponent {...props} />,
    matchNode: (node: { type: string }) => node.type === 'table-row',
    isInBlocksSelector: false as const,
    icon: Paragraph, // Add icon to prevent crash in BlocksDropdown if selected
    label: {
        id: 'components.Blocks.blocks.table-row',
        defaultMessage: 'Table Row',
    },
  },
  'table-cell': {
    renderElement: (props: RenderElementProps) => <TableCellComponent {...props} />,
    matchNode: (node: { type: string }) => node.type === 'table-cell',
    isInBlocksSelector: false as const,
    icon: Paragraph, // Add icon to prevent crash in BlocksDropdown if selected
    label: {
        id: 'components.Blocks.blocks.table-cell',
        defaultMessage: 'Table Cell',
    },
  }
};

// Utility functions for Table manipulation

export const getTableFromSelection = (editor: Editor) => {
  const { selection } = editor;
  if (!selection) return null;

  const [tableNode, tablePath] = Editor.above(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'table',
  }) || [];

  if (tableNode) {
    return { tableNode: tableNode as TableNode, tablePath };
  }
  return null;
};

export const insertRow = (editor: Editor) => {
  const result = getTableFromSelection(editor);
  if (!result) return;
  const { tableNode, tablePath } = result;
  
  // Find current row
  const [rowNode, rowPath] = Editor.above(editor, {
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'table-row',
  }) || [];
  
  if (!rowNode) return;
  
  // Calculate grid width (max columns) based on colspan sums
  let maxCols = 0;
  tableNode.children.forEach(row => {
      const rowCols = (row as TableRowNode).children.reduce((sum, cell) => sum + ((cell as TableCellNode).colspan || 1), 0);
      if (rowCols > maxCols) maxCols = rowCols;
  });
  
  // Create new row with maxCols cells
  // We explicitly create cells with default colspan=1, rowspan=1
  const newCells: TableCellNode[] = Array.from({ length: maxCols }).map(() => ({
      type: 'table-cell',
      colspan: 1,
      rowspan: 1,
      children: [{ text: '' }]
  }));
  
  const newRow: TableRowNode = {
      type: 'table-row',
      children: newCells
  };
  
  // Insert after current row
  Transforms.insertNodes(editor, newRow, { at: Path.next(rowPath!) });
};

export const deleteRow = (editor: Editor) => {
    const result = getTableFromSelection(editor);
    if (!result) return;
    const { tableNode, tablePath } = result;

    // Find current row
    const [rowNode, rowPath] = Editor.above(editor, {
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'table-row',
    }) || [];
    
    if (!rowNode) return;
    
    // Check if it's the last row
    if (tableNode.children.length <= 1) {
        Transforms.removeNodes(editor, { at: tablePath });
    } else {
        Transforms.removeNodes(editor, { at: rowPath });
    }
};

export const insertColumn = (editor: Editor) => {
    const result = getTableFromSelection(editor);
    if (!result) return;
    const { tableNode, tablePath } = result;

    const [cellNode, cellPath] = Editor.above(editor, {
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'table-cell',
    }) || [];

    if (!cellNode) return;

    // 1. Build Virtual Grid
    const grid: any[][] = [];
    const rows = tableNode.children;
    const maxRows = rows.length;

    // Initialize grid
    for(let i=0; i<maxRows; i++) grid[i] = [];

    rows.forEach((row, rowIndex) => {
        const cells = (row as TableRowNode).children;
        let colIndex = 0;
        cells.forEach(cell => {
             // Find first empty slot
             while(grid[rowIndex][colIndex]) colIndex++;
             
             const rowspan = (cell as TableCellNode).rowspan || 1;
             const colspan = (cell as TableCellNode).colspan || 1;
             
             for(let r=0; r<rowspan; r++) {
                 for(let c=0; c<colspan; c++) {
                     if (rowIndex + r < maxRows) {
                         grid[rowIndex + r][colIndex + c] = {
                             cell,
                             originRow: rowIndex,
                             originCol: colIndex // Visual start col
                         };
                     }
                 }
             }
             colIndex += colspan;
        });
    });

    // 2. Find Selected Cell Visual End
    let targetVisualCol = -1;
    // Iterate grid to find cell matches
    outer: for(let r=0; r<grid.length; r++) {
        for(let c=0; c<grid[r].length; c++) {
            if (grid[r][c] && grid[r][c].cell === cellNode) {
                const cellStartCol = grid[r][c].originCol; 
                targetVisualCol = cellStartCol + ((cellNode as TableCellNode).colspan || 1);
                break outer;
            }
        }
    }
    
    if (targetVisualCol === -1) return;

    // 3. Insert or Widen
    const visitedCells = new Set();
    
    Editor.withoutNormalizing(editor, () => {
        rows.forEach((row, rowIndex) => {
            const leftSlot = grid[rowIndex][targetVisualCol - 1];
            const rightSlot = grid[rowIndex][targetVisualCol]; // Might be undefined if appending
            
            // Case: Inside a Merged Cell (widen)
            if (leftSlot && rightSlot && leftSlot.cell === rightSlot.cell) {
                 const cellToWiden = leftSlot.cell;
                 if (!visitedCells.has(cellToWiden)) {
                      const path = ReactEditor.findPath(editor as ReactEditor, cellToWiden);
                      const newColspan = (cellToWiden.colspan || 1) + 1;
                      Transforms.setNodes(editor, { colspan: newColspan } as any, { at: path });
                      visitedCells.add(cellToWiden);
                 }
            } else {
                // Case: Boundary (insert new)
                
                // If the left cell corresponds to a vertically merged cell that we ALREADY widened,
                // then this row is already covered by that widened cell.
                if (leftSlot && visitedCells.has(leftSlot.cell)) {
                    return;
                }
                
                // Determine insertion index in the children array
                 let insertAt = 0;
                 const seen = new Set();
                 for(let c=0; c<targetVisualCol; c++) {
                     const slot = grid[rowIndex][c];
                     // Count only cells that originated in THIS row
                     if (slot && slot.originRow === rowIndex && !seen.has(slot.cell)) {
                         seen.add(slot.cell);
                         insertAt++;
                     }
                 }
                 
                 const rowPath = [...tablePath!, rowIndex];
                 const insertionPath = [...rowPath, insertAt];
                 
                 Transforms.insertNodes(editor, {
                    type: 'table-cell',
                    colspan: 1,
                    rowspan: 1,
                    children: [{ text: '' }]
                } as TableCellNode, { at: insertionPath });
            }
        });
    });
};

export const deleteColumn = (editor: Editor) => {
    const result = getTableFromSelection(editor);
    if (!result) return;
    const { tableNode, tablePath } = result;
    
    const [cellNode, cellPath] = Editor.above(editor, {
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'table-cell',
    }) || [];
    
    if (!cellNode) return;
    const cellIndex = cellPath![cellPath!.length - 1];
    
    // Check if it's the last column
    if (tableNode.children[0].children.length <= 1) {
        Transforms.removeNodes(editor, { at: tablePath });
        return;
    }

    Editor.withoutNormalizing(editor, () => {
        tableNode.children.forEach((row, rowIndex) => {
             const targetPath = [...tablePath!, rowIndex, cellIndex];
             Transforms.removeNodes(editor, { at: targetPath });
        });
    });
};

export const toggleHeader = (editor: Editor) => {
    const result = getTableFromSelection(editor);
    if (!result) return;
    const { tableNode, tablePath } = result;
    
    // Determine current header state of the first row
    const firstRow = tableNode.children[0] as TableRowNode;
    const isHeader = (firstRow.children[0] as any).isHeader === true;
    const newIsHeader = !isHeader;
    
    Editor.withoutNormalizing(editor, () => {
        firstRow.children.forEach((cell, cellIndex) => {
            const cellPath = [...tablePath!, 0, cellIndex];
            Transforms.setNodes(editor, { isHeader: newIsHeader } as any, { at: cellPath });
        });
    });
};

export const deleteTable = (editor: Editor) => {
    const result = getTableFromSelection(editor);
    if (!result) return;
    Transforms.removeNodes(editor, { at: result.tablePath });
};

// Merging Utilities

export const mergeRight = (editor: Editor) => {
    const result = getTableFromSelection(editor);
    if (!result) return;
    const { tableNode, tablePath } = result;

    const [cellNode, cellPath] = Editor.above(editor, {
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'table-cell',
    }) || [];

    if (!cellNode) return;

    // cellPath ends with [..., rowIndex, cellIndex]
    const rowIndex = cellPath![cellPath!.length - 2];
    const cellIndex = cellPath![cellPath!.length - 1];
    
    // Find Next Cell
    // Note: This logic assumes simple grid. With existing merges, visual index != model index.
    // However, for basic merge, we check the immediate next sibling in the "children" array.
    // If the table is already messy, this might merge disjoint visual cells, but it complies with DOM structure.
    
    // Check if next sibling exists
    const rowNode = Node.get(editor, Path.parent(cellPath!));
    if (cellIndex >= (rowNode as any).children.length - 1) return; // No right neighbor

    const nextCellPath = Path.next(cellPath!);
    const nextCellNode = Node.get(editor, nextCellPath) as TableCellNode;

    // Simple constraint: Can only merge if rowspans match?
    // User requirement doesn't specify constraint, but usually merging different rowspans is complex.
    // We'll enforce: rowspan must match.
    const currentRowspan = (cellNode as TableCellNode).rowspan || 1;
    const nextRowspan = nextCellNode.rowspan || 1;
    
    if (currentRowspan !== nextRowspan) {
        // Option: Allow logic to handle complex shape, or generic reject.
        // For simplicity, we reject.
        return; 
    }

    const currentColspan = (cellNode as TableCellNode).colspan || 1;
    const nextColspan = nextCellNode.colspan || 1;

    Editor.withoutNormalizing(editor, () => {
        // Update current cell colspan
        Transforms.setNodes(editor, { colspan: currentColspan + nextColspan } as any, { at: cellPath });
        // Remove next cell
        Transforms.removeNodes(editor, { at: nextCellPath });
    });
};

export const mergeDown = (editor: Editor) => {
    const result = getTableFromSelection(editor);
    if (!result) return;
    const { tableNode, tablePath } = result;

    const [cellNode, cellPath] = Editor.above(editor, {
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'table-cell',
    }) || [];

    if (!cellNode) return;
    
    const rowIndex = cellPath![cellPath!.length - 2];
    const cellIndex = cellPath![cellPath!.length - 1];

    // Find Cell Below
    // This is tricky because indices shift.
    // We assume "visual column" index roughly aligns with model index IF no preceding colspans in current/next row.
    // BUT correctly, we generally merge with the cell at the SAME Index in next row?
    // Or we need to calculate visual index.
    
    // Strict Approach:
    // Only support mergeDown if the 'index' in children array matches?
    // No, if row 1 has 3 cells and row 2 has 3 cells, cell[0] merges with cell[0].
    // If row 1 has merged cell (colspan 2) + cell, it has 2 children.
    // Row 2 has 3 children. 
    // Merging child 0 (colspan 2) with ? 
    // Ideally it merges with child 0 (and child 1?) of next row.
    // For simplicity: We only support mergeDown if the tables structure is somewhat regular or we merge strict indices.
    
    // We will implement "Merge with cell at same child-index of next row".
    
    if (rowIndex >= tableNode.children.length - 1) return; // Last row

    const nextRowPath = [...tablePath!, rowIndex + 1];
    const nextRowNode = Node.get(editor, nextRowPath);
    
    // Check if next row has a cell at this index
    if (cellIndex >= (nextRowNode as any).children.length) return;

    const belowCellPath = [...nextRowPath, cellIndex];
    const belowCellNode = Node.get(editor, belowCellPath) as TableCellNode;

    // Constraint: Colspans must match
    const currentColspan = (cellNode as TableCellNode).colspan || 1;
    const belowColspan = belowCellNode.colspan || 1;
    
    if (currentColspan !== belowColspan) return;

    const currentRowspan = (cellNode as TableCellNode).rowspan || 1;
    const belowRowspan = belowCellNode.rowspan || 1;

    Editor.withoutNormalizing(editor, () => {
        // Update current cell rowspan
        Transforms.setNodes(editor, { rowspan: currentRowspan + belowRowspan } as any, { at: cellPath });
        // Remove below cell
        Transforms.removeNodes(editor, { at: belowCellPath });
    });
};

export const splitCell = (editor: Editor) => {
    const result = getTableFromSelection(editor);
    if (!result) return;
    const { tableNode, tablePath } = result;

    const [cellNode, cellPath] = Editor.above(editor, {
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'table-cell',
    }) || [];

    if (!cellNode) return;

    const tCellNode = cellNode as TableCellNode;
    const currentRowspan = tCellNode.rowspan || 1;
    const currentColspan = tCellNode.colspan || 1;

    // If perfectly normal cell, nothing to split
    if (currentRowspan === 1 && currentColspan === 1) return;

    const rowIndex = cellPath![cellPath!.length - 2];
    const cellIndex = cellPath![cellPath!.length - 1];

    Editor.withoutNormalizing(editor, () => {
        // 1. Reset current cell to 1x1
        Transforms.setNodes(editor, { colspan: 1, rowspan: 1 } as any, { at: cellPath });

        // 2. Insert missing horizontal cells in the current row
        // We need to insert (currentColspan - 1) cells AFTER the current cell
        if (currentColspan > 1) {
            for (let i = 0; i < currentColspan - 1; i++) {
                // Insert at cellIndex + 1 (and shift)
                // Since we are inserting one by one at the same position (right after current), 
                // effectively we push previous inserts to the right or insert in reverse order?
                // Slate inserts at valid index.
                // Insert at: index + 1.
                // Doing it multiple times at 'index+1' pushes previous new cells to 'index+2'.
                // So we get [Original] [NewLast] ... [NewFirst]?
                // No, insert at k puts it between k-1 and k. 
                // Existing at k becomes k+1.
                // So if we always insert at index+1:
                // [A] [B]
                // Ins1 at 1: [A] [Ins1] [B]
                // Ins2 at 1: [A] [Ins2] [Ins1] [B]
                // Order might matter if content matters, but typically empty cells.
                
                Transforms.insertNodes(editor, {
                    type: 'table-cell',
                    children: [{ text: '' }]
                } as TableCellNode, { at: [...tablePath!, rowIndex, cellIndex + 1] });
            }
        }

        // 3. Insert missing cells in rows below
        if (currentRowspan > 1) {
            for (let r = 1; r < currentRowspan; r++) {
                const targetRowIndex = rowIndex + r;
                // Ensure row exists (should, if valid table)
                if (targetRowIndex < tableNode.children.length) {
                    const targetRowPath = [...tablePath!, targetRowIndex];
                    // We need to insert `currentColspan` number of cells at `cellIndex`.
                    // Because the merged cell claimed this spot, the "next" cell in that row is currently at `cellIndex`.
                    // So we insert right before it -> at `cellIndex`.
                    
                    for (let c = 0; c < currentColspan; c++) {
                         Transforms.insertNodes(editor, {
                            type: 'table-cell',
                            children: [{ text: '' }]
                        } as TableCellNode, { at: [...targetRowPath, cellIndex] });
                    }
                }
            }
        }
    });
};

export { tableBlocks };
