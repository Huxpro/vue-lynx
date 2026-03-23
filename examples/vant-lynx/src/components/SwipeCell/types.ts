export type SwipeCellSide = 'left' | 'right';

export type SwipeCellPosition = SwipeCellSide | 'cell' | 'outside';

export interface SwipeCellProps {
  name?: string | number;
  disabled?: boolean;
  leftWidth?: number | string;
  rightWidth?: number | string;
  beforeClose?: (params: {
    name: string | number;
    position: SwipeCellPosition;
  }) => boolean | Promise<boolean> | undefined | void;
  stopPropagation?: boolean;
}

export interface SwipeCellExpose {
  open: (side: SwipeCellSide) => void;
  close: (position?: SwipeCellPosition) => void;
}
