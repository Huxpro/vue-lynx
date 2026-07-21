/**
 * Demonstrates: positional list mutations and callback refresh.
 * Paste this file into the Lynx REPL main-thread editor.
 */

globalThis.renderPage = function renderPage() {
  const page = __CreatePage('page', 0)
  let rows = [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
  ]

  function makeCallbacks() {
    function componentAtIndex(listRef, listId, index, operationId) {
      const row = __CreateView(0)
      const text = __CreateText(0)
      const rawText = __CreateRawText(rows[index].label)
      __AppendElement(text, rawText)
      __AppendElement(row, text)
      __AppendElement(listRef, row)
      const sign = __GetElementUniqueID(row)
      __FlushElementTree(row, {
        triggerLayout: true,
        operationID: operationId,
        elementID: sign,
        listID: listId,
      })
      return sign
    }

    return { componentAtIndex, enqueueComponent() {} }
  }

  let callbacks = makeCallbacks()
  const list = __CreateList(
    0,
    callbacks.componentAtIndex,
    callbacks.enqueueComponent,
  )
  __SetAttribute(list, 'list-type', 'single')
  __SetInlineStyles(list, { width: '100%', height: '100%' })
  __AppendElement(page, list)
  __FlushElementTree()

  __SetAttribute(list, 'update-list-info', {
    insertAction: rows.map((row, position) => ({
      position,
      'item-key': row.id,
    })),
    removeAction: [],
    updateAction: [],
  })
  __FlushElementTree()

  setTimeout(() => {
    rows = [{ id: 'x', label: 'Prepended X' }, ...rows]
    callbacks = makeCallbacks()
    __UpdateListCallbacks(
      list,
      callbacks.componentAtIndex,
      callbacks.enqueueComponent,
    )
    __SetAttribute(list, 'update-list-info', {
      insertAction: [{ position: 0, 'item-key': 'x' }],
      removeAction: [],
      updateAction: [],
    })
    __FlushElementTree()
  }, 1200)

  setTimeout(() => {
    // Removal positions refer to the old list, before this transaction.
    rows = rows.filter((row) => row.id !== 'a')
    callbacks = makeCallbacks()
    __UpdateListCallbacks(
      list,
      callbacks.componentAtIndex,
      callbacks.enqueueComponent,
    )
    __SetAttribute(list, 'update-list-info', {
      insertAction: [],
      removeAction: [1],
      updateAction: [],
    })
    __FlushElementTree()
  }, 2400)
}
