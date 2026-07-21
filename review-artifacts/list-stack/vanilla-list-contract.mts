/**
 * Typed, framework-free sketch of the Lynx list protocol.
 * The ambient PAPI declarations are supplied by @lynx-js/type-element-api in
 * a real main-thread project; they are repeated here to expose the contract.
 */

type ElementRef = Record<string, unknown>

type ComponentAtIndex = (
  listRef: ElementRef,
  listElementId: number,
  cellIndex: number,
  operationId: number,
  enableReuseNotification?: boolean,
  enableBatchRender?: boolean,
  asyncFlush?: boolean,
) => number | undefined

type EnqueueComponent = (
  listRef: ElementRef,
  listElementId: number,
  elementId: number,
) => void

interface Row {
  key: string
  label: string
  reuseType: 'single-line-row-v1'
}

interface Cell {
  root: ElementRef
  rawText: ElementRef
}

declare function __CreateList(
  parentId: number,
  componentAtIndex: ComponentAtIndex,
  enqueueComponent: EnqueueComponent,
): ElementRef
declare function __CreateView(parentId: number): ElementRef
declare function __CreateText(parentId: number): ElementRef
declare function __CreateRawText(text: string): ElementRef
declare function __AppendElement(parent: ElementRef, child: ElementRef): void
declare function __SetAttribute(
  element: ElementRef,
  name: string,
  value: unknown,
): void
declare function __GetElementUniqueID(element: ElementRef): number
declare function __FlushElementTree(
  root?: ElementRef,
  options?: {
    triggerLayout?: boolean
    operationID?: number
    elementID?: number
    listID?: number
  },
): void

export function createLazyList(getRows: () => readonly Row[]): ElementRef {
  const active = new Map<number, Cell>()
  const pool: Cell[] = []

  function createCell(): Cell {
    const root = __CreateView(0)
    const text = __CreateText(0)
    const rawText = __CreateRawText('')
    __AppendElement(text, rawText)
    __AppendElement(root, text)
    return { root, rawText }
  }

  const componentAtIndex: ComponentAtIndex = (
    listRef,
    listId,
    index,
    operationId,
  ) => {
    const pooled = pool.pop()
    const cell = pooled ?? createCell()
    __SetAttribute(cell.rawText, 'text', getRows()[index].label)
    if (!pooled) __AppendElement(listRef, cell.root)

    const sign = __GetElementUniqueID(cell.root)
    active.set(sign, cell)
    __FlushElementTree(cell.root, {
      triggerLayout: true,
      operationID: operationId,
      elementID: sign,
      listID: listId,
    })
    return sign
  }

  const enqueueComponent: EnqueueComponent = (_list, _listId, sign) => {
    const cell = active.get(sign)
    if (!cell) return
    active.delete(sign)
    pool.push(cell)
  }

  return __CreateList(0, componentAtIndex, enqueueComponent)
}
