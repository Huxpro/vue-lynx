/**
 * Demonstrates: bounded cell recycling with an explicit structural reuse type.
 * Paste this file into the Lynx REPL main-thread editor.
 */

globalThis.renderPage = function renderPage() {
  const page = __CreatePage('page', 0)
  const rows = Array.from({ length: 1000 }, (_, index) => ({
    id: `row-${index}`,
    label: `Lazy row ${index}`,
  }))
  const active = new Map()
  const pool = []

  function createCell() {
    const root = __CreateView(0)
    const text = __CreateText(0)
    const rawText = __CreateRawText('')
    __AppendElement(text, rawText)
    __AppendElement(root, text)
    __SetInlineStyles(root, { height: '52px', padding: '14px' })
    return { root, rawText }
  }

  function componentAtIndex(
    listRef,
    listId,
    index,
    operationId,
    enableReuseNotification,
  ) {
    const pooledCell = pool.pop()
    const cell = pooledCell || createCell()
    const isFresh = !pooledCell
    __SetAttribute(cell.rawText, 'text', rows[index].label)

    if (isFresh) __AppendElement(listRef, cell.root)
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

  function enqueueComponent(_listRef, _listId, elementId) {
    const cell = active.get(elementId)
    if (!cell) return
    active.delete(elementId)
    pool.push(cell)
  }

  const list = __CreateList(0, componentAtIndex, enqueueComponent)
  __SetAttribute(list, 'list-type', 'single')
  __SetAttribute(list, 'recyclable', true)
  __SetInlineStyles(list, { width: '100%', height: '100%' })
  __AppendElement(page, list)
  __FlushElementTree()

  __SetAttribute(list, 'update-list-info', {
    insertAction: rows.map((row, position) => ({
      position,
      'item-key': row.id,
      // Only cells with the same structural shape may share this value.
      'reuse-identifier': 'single-line-row-v1',
      'estimated-main-axis-size-px': 52,
    })),
    removeAction: [],
    updateAction: [],
  })
  __FlushElementTree()
}
