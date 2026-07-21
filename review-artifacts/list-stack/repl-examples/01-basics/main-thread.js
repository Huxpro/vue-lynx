/**
 * Demonstrates: a lazy single-column list written directly against Element PAPI.
 * Paste this file into the Lynx REPL main-thread editor.
 */

globalThis.renderPage = function renderPage() {
  const page = __CreatePage('page', 0)
  const rows = [
    { id: 'alpha', label: 'Alpha' },
    { id: 'beta', label: 'Beta' },
    { id: 'gamma', label: 'Gamma' },
  ]

  function createRow(item) {
    const row = __CreateView(0)
    const text = __CreateText(0)
    const rawText = __CreateRawText(item.label)

    __AppendElement(text, rawText)
    __AppendElement(row, text)
    __SetInlineStyles(row, {
      height: '56px',
      padding: '16px',
      'border-bottom-width': '1px',
      'border-bottom-color': '#d7dbe0',
    })
    return row
  }

  function componentAtIndex(
    listRef,
    listElementId,
    cellIndex,
    operationId,
  ) {
    const row = createRow(rows[cellIndex])
    const sign = __GetElementUniqueID(row)
    __AppendElement(listRef, row)
    __FlushElementTree(row, {
      triggerLayout: true,
      operationID: operationId,
      elementID: sign,
      listID: listElementId,
    })
    return sign
  }

  function enqueueComponent() {
    // No recycling in the basics example.
  }

  const list = __CreateList(0, componentAtIndex, enqueueComponent)
  __SetAttribute(list, 'list-type', 'single')
  __SetAttribute(list, 'scroll-orientation', 'vertical')
  __SetAttribute(list, 'span-count', 1)
  __SetInlineStyles(list, { width: '100%', height: '100%' })
  __AppendElement(page, list)
  __FlushElementTree()

  // The information list is the data model. Cells are created lazily by the
  // callback above, rather than appended eagerly here.
  __SetAttribute(list, 'update-list-info', {
    insertAction: rows.map((row, position) => ({
      position,
      'item-key': row.id,
      'estimated-main-axis-size-px': 56,
    })),
    removeAction: [],
    updateAction: [],
  })
  __FlushElementTree()
}
