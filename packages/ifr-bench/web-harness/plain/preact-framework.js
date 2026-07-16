(function () {

	/** Normal hydration that attaches to a DOM tree but does not diff it. */
	var MODE_HYDRATE = 1 << 5;
	/** Signifies this VNode suspended on the previous render */
	var MODE_SUSPENDED = 1 << 7;
	/** Indicates that this node needs to be inserted while patching children */
	var INSERT_VNODE = 1 << 2;
	/** Indicates a VNode has been matched with another VNode in the diff */
	var MATCHED = 1 << 1;

	/** Reset all mode flags */
	var RESET_MODE = ~(MODE_HYDRATE | MODE_SUSPENDED);
	var SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
	var XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
	var MATH_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
	var NULL = null;
	var UNDEFINED = undefined;
	var EMPTY_OBJ = /** @type {any} */{};
	var EMPTY_ARR = [];
	var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;

	var isArray = Array.isArray;

	/**
	 * Assign properties from `props` to `obj`
	 * @template O, P The obj and props types
	 * @param {O} obj The object to copy properties to
	 * @param {P} props The object to copy properties from
	 * @returns {O & P}
	 */
	function assign(obj, props) {
	  // @ts-expect-error We change the type of `obj` to be `O & P`
	  for (var i in props) obj[i] = props[i];
	  return /** @type {O & P} */obj;
	}

	/**
	 * Remove a child node from its parent if attached. This is a workaround for
	 * IE11 which doesn't support `Element.prototype.remove()`. Using this function
	 * is smaller than including a dedicated polyfill.
	 * @param {import('./index').ContainerNode} node The node to remove
	 */
	function removeNode(node) {
	  if (node && node.parentNode) node.parentNode.removeChild(node);
	}
	var slice = EMPTY_ARR.slice;

	/**
	 * Find the closest error boundary to a thrown error and call it
	 * @param {object} error The thrown value
	 * @param {import('../internal').VNode} vnode The vnode that threw the error that was caught (except
	 * for unmounting when this parameter is the highest parent that was being
	 * unmounted)
	 * @param {import('../internal').VNode} [oldVNode]
	 * @param {import('../internal').ErrorInfo} [errorInfo]
	 */
	function _catchError(error, vnode, oldVNode, errorInfo) {
	  /** @type {import('../internal').Component} */
	  var component, /** @type {import('../internal').ComponentType} */
	    ctor, /** @type {boolean} */
	    handled;
	  for (; vnode = vnode.__;) {
	    if ((component = vnode.__c) && !component.__) {
	      try {
	        ctor = component.constructor;
	        if (ctor && ctor.getDerivedStateFromError != NULL) {
	          component.setState(ctor.getDerivedStateFromError(error));
	          handled = component.__d;
	        }
	        if (component.componentDidCatch != NULL) {
	          component.componentDidCatch(error, errorInfo || {});
	          handled = component.__d;
	        }

	        // This is an error boundary. Mark it as having bailed out, and whether it was mid-hydration.
	        if (handled) {
	          return component.__E = component;
	        }
	      } catch (e) {
	        error = e;
	      }
	    }
	  }
	  throw error;
	}

	/**
	 * The `option` object can potentially contain callback functions
	 * that are called during various stages of our renderer. This is the
	 * foundation on which all our addons like `preact/debug`, `preact/compat`,
	 * and `preact/hooks` are based on. See the `Options` type in `internal.d.ts`
	 * for a full list of available option hooks (most editors/IDEs allow you to
	 * ctrl+click or cmd+click on mac the type definition below).
	 * @type {import('./internal').Options}
	 */
	var options = {
	  __e: _catchError
	};

	var vnodeId = 0;

	/**
	 * Create an virtual node (used for JSX)
	 * @param {import('./internal').VNode["type"]} type The node name or Component constructor for this
	 * virtual node
	 * @param {object | null | undefined} [props] The properties of the virtual node
	 * @param {Array<import('.').ComponentChildren>} [children] The children of the
	 * virtual node
	 * @returns {import('./internal').VNode}
	 */
	function createElement(type, props, children) {
	  var normalizedProps = {},
	    key,
	    ref,
	    i;
	  for (i in props) {
	    if (i == 'key') key = props[i];else if (i == 'ref') ref = props[i];else normalizedProps[i] = props[i];
	  }
	  if (arguments.length > 2) {
	    normalizedProps.children = arguments.length > 3 ? slice.call(arguments, 2) : children;
	  }

	  // If a Component VNode, check for and apply defaultProps
	  // Note: type may be undefined in development, must never error here.
	  if (typeof type == 'function' && type.defaultProps != NULL) {
	    for (i in type.defaultProps) {
	      if (normalizedProps[i] === UNDEFINED) {
	        normalizedProps[i] = type.defaultProps[i];
	      }
	    }
	  }
	  return createVNode(type, normalizedProps, key, ref, NULL);
	}

	/**
	 * Create a VNode (used internally by Preact)
	 * @param {import('./internal').VNode["type"]} type The node name or Component
	 * Constructor for this virtual node
	 * @param {object | string | number | null} props The properties of this virtual node.
	 * If this virtual node represents a text node, this is the text of the node (string or number).
	 * @param {string | number | null} key The key for this virtual node, used when
	 * diffing it against its children
	 * @param {import('./internal').VNode["ref"]} ref The ref property that will
	 * receive a reference to its created child
	 * @returns {import('./internal').VNode}
	 */
	function createVNode(type, props, key, ref, original) {
	  // V8 seems to be better at detecting type shapes if the object is allocated from the same call site
	  // Do not inline into createElement and coerceToVNode!
	  /** @type {import('./internal').VNode} */
	  var vnode = {
	    type: type,
	    props: props,
	    key: key,
	    ref: ref,
	    __k: NULL,
	    __: NULL,
	    __b: 0,
	    __e: NULL,
	    __c: NULL,
	    constructor: UNDEFINED,
	    __v: original == NULL ? ++vnodeId : original,
	    __i: -1,
	    __u: 0
	  };

	  // Only invoke the vnode hook if this was *not* a direct copy:
	  if (original == NULL && options.vnode != NULL) options.vnode(vnode);
	  return vnode;
	}
	function createRef() {
	  return {
	    current: NULL
	  };
	}
	function Fragment(props) {
	  return props.children;
	}

	/**
	 * Check if a the argument is a valid Preact VNode.
	 * @param {*} vnode
	 * @returns {vnode is VNode}
	 */
	var isValidElement = function isValidElement(vnode) {
	  return vnode != NULL && vnode.constructor == UNDEFINED;
	};

	/**
	 * Base Component class. Provides `setState()` and `forceUpdate()`, which
	 * trigger rendering
	 * @param {object} props The initial component props
	 * @param {object} context The initial context from parent components'
	 * getChildContext
	 */
	function BaseComponent(props, context) {
	  this.props = props;
	  this.context = context;
	}

	/**
	 * Update component state and schedule a re-render.
	 * @this {import('./internal').Component}
	 * @param {object | ((s: object, p: object) => object)} update A hash of state
	 * properties to update with new values or a function that given the current
	 * state and props returns a new partial state
	 * @param {() => void} [callback] A function to be called once component state is
	 * updated
	 */
	BaseComponent.prototype.setState = function (update, callback) {
	  // only clone state when copying to nextState the first time.
	  var s;
	  if (this.__s != NULL && this.__s != this.state) {
	    s = this.__s;
	  } else {
	    s = this.__s = assign({}, this.state);
	  }
	  if (typeof update == 'function') {
	    // Some libraries like `immer` mark the current state as readonly,
	    // preventing us from mutating it, so we need to clone it. See #2716
	    update = update(assign({}, s), this.props);
	  }
	  if (update) {
	    assign(s, update);
	  }

	  // Skip update if updater function returned null
	  if (update == NULL) return;
	  if (this.__v) {
	    if (callback) {
	      this._sb.push(callback);
	    }
	    enqueueRender(this);
	  }
	};

	/**
	 * Immediately perform a synchronous re-render of the component
	 * @this {import('./internal').Component}
	 * @param {() => void} [callback] A function to be called after component is
	 * re-rendered
	 */
	BaseComponent.prototype.forceUpdate = function (callback) {
	  if (this.__v) {
	    // Set render mode so that we can differentiate where the render request
	    // is coming from. We need this because forceUpdate should never call
	    // shouldComponentUpdate
	    this.__e = true;
	    if (callback) this.__h.push(callback);
	    enqueueRender(this);
	  }
	};

	/**
	 * Accepts `props` and `state`, and returns a new Virtual DOM tree to build.
	 * Virtual DOM is generally constructed via [JSX](https://jasonformat.com/wtf-is-jsx).
	 * @param {object} props Props (eg: JSX attributes) received from parent
	 * element/component
	 * @param {object} state The component's current state
	 * @param {object} context Context object, as returned by the nearest
	 * ancestor's `getChildContext()`
	 * @returns {ComponentChildren | void}
	 */
	BaseComponent.prototype.render = Fragment;

	/**
	 * @param {import('./internal').VNode} vnode
	 * @param {number | null} [childIndex]
	 */
	function getDomSibling(vnode, childIndex) {
	  if (childIndex == NULL) {
	    // Use childIndex==null as a signal to resume the search from the vnode's sibling
	    return vnode.__ ? getDomSibling(vnode.__, vnode.__i + 1) : NULL;
	  }
	  var sibling;
	  for (; childIndex < vnode.__k.length; childIndex++) {
	    sibling = vnode.__k[childIndex];
	    if (sibling != NULL && sibling.__e != NULL) {
	      // Since updateParentDomPointers keeps _dom pointer correct,
	      // we can rely on _dom to tell us if this subtree contains a
	      // rendered DOM node, and what the first rendered DOM node is
	      return sibling.__e;
	    }
	  }

	  // If we get here, we have not found a DOM node in this vnode's children.
	  // We must resume from this vnode's sibling (in it's parent _children array)
	  // Only climb up and search the parent if we aren't searching through a DOM
	  // VNode (meaning we reached the DOM parent of the original vnode that began
	  // the search)
	  return typeof vnode.type == 'function' ? getDomSibling(vnode) : NULL;
	}

	/**
	 * Trigger in-place re-rendering of a component.
	 * @param {import('./internal').Component} component The component to rerender
	 */
	function renderComponent(component) {
	  var oldVNode = component.__v,
	    oldDom = oldVNode.__e,
	    commitQueue = [],
	    refQueue = [];
	  if (component.__P) {
	    var newVNode = assign({}, oldVNode);
	    newVNode.__v = oldVNode.__v + 1;
	    if (options.vnode) options.vnode(newVNode);
	    if (options.renderComponent) options.renderComponent(newVNode, component);
	    diff(component.__P, newVNode, oldVNode, component.__n, component.__P.namespaceURI, oldVNode.__u & MODE_HYDRATE ? [oldDom] : NULL, commitQueue, oldDom == NULL ? getDomSibling(oldVNode) : oldDom, !!(oldVNode.__u & MODE_HYDRATE), refQueue);
	    newVNode.__v = oldVNode.__v;
	    newVNode.__.__k[newVNode.__i] = newVNode;
	    commitRoot(commitQueue, newVNode, refQueue);
	    oldVNode.__e = oldVNode.__ = null;
	    if (newVNode.__e != oldDom) {
	      updateParentDomPointers(newVNode);
	    }
	  }
	}

	/**
	 * @param {import('./internal').VNode} vnode
	 */
	function updateParentDomPointers(vnode) {
	  if ((vnode = vnode.__) != NULL && vnode.__c != NULL) {
	    vnode.__e = vnode.__c.base = NULL;
	    for (var i = 0; i < vnode.__k.length; i++) {
	      var child = vnode.__k[i];
	      if (child != NULL && child.__e != NULL) {
	        vnode.__e = vnode.__c.base = child.__e;
	        break;
	      }
	    }
	    return updateParentDomPointers(vnode);
	  }
	}

	/**
	 * The render queue
	 * @type {Array<import('./internal').Component>}
	 */
	var rerenderQueue = [];

	/*
	 * The value of `Component.debounce` must asynchronously invoke the passed in callback. It is
	 * important that contributors to Preact can consistently reason about what calls to `setState`, etc.
	 * do, and when their effects will be applied. See the links below for some further reading on designing
	 * asynchronous APIs.
	 * * [Designing APIs for Asynchrony](https://blog.izs.me/2013/08/designing-apis-for-asynchrony)
	 * * [Callbacks synchronous and asynchronous](https://blog.ometer.com/2011/07/24/callbacks-synchronous-and-asynchronous/)
	 */

	var prevDebounce;
	var defer = typeof Promise == 'function' ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout;

	/**
	 * Enqueue a rerender of a component
	 * @param {import('./internal').Component} c The component to rerender
	 */
	function enqueueRender(c) {
	  if (!c.__d && (c.__d = true) && rerenderQueue.push(c) && !process.__r++ || prevDebounce != options.debounceRendering) {
	    prevDebounce = options.debounceRendering;
	    (prevDebounce || defer)(process);
	  }
	}

	/**
	 * @param {import('./internal').Component} a
	 * @param {import('./internal').Component} b
	 */
	var depthSort = function depthSort(a, b) {
	  return a.__v.__b - b.__v.__b;
	};

	/** Flush the render queue by rerendering all queued components */
	function process() {
	  var c,
	    l = 1;

	  // Don't update `renderCount` yet. Keep its value non-zero to prevent unnecessary
	  // process() calls from getting scheduled while `queue` is still being consumed.
	  while (rerenderQueue.length) {
	    // Keep the rerender queue sorted by (depth, insertion order). The queue
	    // will initially be sorted on the first iteration only if it has more than 1 item.
	    //
	    // New items can be added to the queue e.g. when rerendering a provider, so we want to
	    // keep the order from top to bottom with those new items so we can handle them in a
	    // single pass
	    if (rerenderQueue.length > l) {
	      rerenderQueue.sort(depthSort);
	    }
	    c = rerenderQueue.shift();
	    l = rerenderQueue.length;
	    if (c.__d) {
	      renderComponent(c);
	    }
	  }
	  process.__r = 0;
	}
	process.__r = 0;

	/**
	 * @typedef {import('../internal').ComponentChildren} ComponentChildren
	 * @typedef {import('../internal').Component} Component
	 * @typedef {import('../internal').PreactElement} PreactElement
	 * @typedef {import('../internal').VNode} VNode
	 */

	/**
	 * Diff the children of a virtual node
	 * @param {PreactElement} parentDom The DOM element whose children are being
	 * diffed
	 * @param {ComponentChildren[]} renderResult
	 * @param {VNode} newParentVNode The new virtual node whose children should be
	 * diff'ed against oldParentVNode
	 * @param {VNode} oldParentVNode The old virtual node whose children should be
	 * diff'ed against newParentVNode
	 * @param {object} globalContext The current context object - modified by
	 * getChildContext
	 * @param {string} namespace Current namespace of the DOM node (HTML, SVG, or MathML)
	 * @param {Array<PreactElement>} excessDomChildren
	 * @param {Array<Component>} commitQueue List of components which have callbacks
	 * to invoke in commitRoot
	 * @param {PreactElement} oldDom The current attached DOM element any new dom
	 * elements should be placed around. Likely `null` on first render (except when
	 * hydrating). Can be a sibling DOM element when diffing Fragments that have
	 * siblings. In most cases, it starts out as `oldChildren[0]._dom`.
	 * @param {boolean} isHydrating Whether or not we are in hydration
	 * @param {any[]} refQueue an array of elements needed to invoke refs
	 */
	function diffChildren(parentDom, renderResult, newParentVNode, oldParentVNode, globalContext, namespace, excessDomChildren, commitQueue, oldDom, isHydrating, refQueue) {
	  var i, /** @type {VNode} */
	    oldVNode, /** @type {VNode} */
	    childVNode, /** @type {PreactElement} */
	    newDom, /** @type {PreactElement} */
	    firstChildDom;

	  // This is a compression of oldParentVNode!=null && oldParentVNode != EMPTY_OBJ && oldParentVNode._children || EMPTY_ARR
	  // as EMPTY_OBJ._children should be `undefined`.
	  /** @type {VNode[]} */
	  var oldChildren = oldParentVNode && oldParentVNode.__k || EMPTY_ARR;
	  var newChildrenLength = renderResult.length;
	  oldDom = constructNewChildrenArray(newParentVNode, renderResult, oldChildren, oldDom, newChildrenLength);
	  for (i = 0; i < newChildrenLength; i++) {
	    childVNode = newParentVNode.__k[i];
	    if (childVNode == NULL) continue;

	    // At this point, constructNewChildrenArray has assigned _index to be the
	    // matchingIndex for this VNode's oldVNode (or -1 if there is no oldVNode).
	    if (childVNode.__i == -1) {
	      oldVNode = EMPTY_OBJ;
	    } else {
	      oldVNode = oldChildren[childVNode.__i] || EMPTY_OBJ;
	    }

	    // Update childVNode._index to its final index
	    childVNode.__i = i;

	    // Morph the old element into the new one, but don't append it to the dom yet
	    var result = diff(parentDom, childVNode, oldVNode, globalContext, namespace, excessDomChildren, commitQueue, oldDom, isHydrating, refQueue);

	    // Adjust DOM nodes
	    newDom = childVNode.__e;
	    if (childVNode.ref && oldVNode.ref != childVNode.ref) {
	      if (oldVNode.ref) {
	        applyRef(oldVNode.ref, NULL, childVNode);
	      }
	      refQueue.push(childVNode.ref, childVNode.__c || newDom, childVNode);
	    }
	    if (firstChildDom == NULL && newDom != NULL) {
	      firstChildDom = newDom;
	    }
	    var shouldPlace = !!(childVNode.__u & INSERT_VNODE);
	    if (shouldPlace || oldVNode.__k === childVNode.__k) {
	      oldDom = insert(childVNode, oldDom, parentDom, shouldPlace);
	    } else if (typeof childVNode.type == 'function' && result !== UNDEFINED) {
	      oldDom = result;
	    } else if (newDom) {
	      oldDom = newDom.nextSibling;
	    }

	    // Unset diffing flags
	    childVNode.__u &= ~(INSERT_VNODE | MATCHED);
	  }
	  newParentVNode.__e = firstChildDom;
	  return oldDom;
	}

	/**
	 * @param {VNode} newParentVNode
	 * @param {ComponentChildren[]} renderResult
	 * @param {VNode[]} oldChildren
	 */
	function constructNewChildrenArray(newParentVNode, renderResult, oldChildren, oldDom, newChildrenLength) {
	  /** @type {number} */
	  var i;
	  /** @type {VNode} */
	  var childVNode;
	  /** @type {VNode} */
	  var oldVNode;
	  var oldChildrenLength = oldChildren.length,
	    remainingOldChildren = oldChildrenLength;
	  var skew = 0;
	  newParentVNode.__k = new Array(newChildrenLength);
	  for (i = 0; i < newChildrenLength; i++) {
	    // @ts-expect-error We are reusing the childVNode variable to hold both the
	    // pre and post normalized childVNode
	    childVNode = renderResult[i];
	    if (childVNode == NULL || typeof childVNode == 'boolean' || typeof childVNode == 'function') {
	      newParentVNode.__k[i] = NULL;
	      continue;
	    }
	    // If this newVNode is being reused (e.g. <div>{reuse}{reuse}</div>) in the same diff,
	    // or we are rendering a component (e.g. setState) copy the oldVNodes so it can have
	    // it's own DOM & etc. pointers
	    else if (typeof childVNode == 'string' || typeof childVNode == 'number' ||
	    // eslint-disable-next-line valid-typeof
	    typeof childVNode == 'bigint' || childVNode.constructor == String) {
	      childVNode = newParentVNode.__k[i] = createVNode(NULL, childVNode, NULL, NULL, NULL);
	    } else if (isArray(childVNode)) {
	      childVNode = newParentVNode.__k[i] = createVNode(Fragment, {
	        children: childVNode
	      }, NULL, NULL, NULL);
	    } else if (childVNode.constructor == UNDEFINED && childVNode.__b > 0) {
	      // VNode is already in use, clone it. This can happen in the following
	      // scenario:
	      //   const reuse = <div />
	      //   <div>{reuse}<span />{reuse}</div>
	      childVNode = newParentVNode.__k[i] = createVNode(childVNode.type, childVNode.props, childVNode.key, childVNode.ref ? childVNode.ref : NULL, childVNode.__v);
	    } else {
	      newParentVNode.__k[i] = childVNode;
	    }
	    var skewedIndex = i + skew;
	    childVNode.__ = newParentVNode;
	    childVNode.__b = newParentVNode.__b + 1;

	    // Temporarily store the matchingIndex on the _index property so we can pull
	    // out the oldVNode in diffChildren. We'll override this to the VNode's
	    // final index after using this property to get the oldVNode
	    var matchingIndex = childVNode.__i = findMatchingIndex(childVNode, oldChildren, skewedIndex, remainingOldChildren);
	    oldVNode = NULL;
	    if (matchingIndex != -1) {
	      oldVNode = oldChildren[matchingIndex];
	      remainingOldChildren--;
	      if (oldVNode) {
	        oldVNode.__u |= MATCHED;
	      }
	    }

	    // Here, we define isMounting for the purposes of the skew diffing
	    // algorithm. Nodes that are unsuspending are considered mounting and we detect
	    // this by checking if oldVNode._original == null
	    var isMounting = oldVNode == NULL || oldVNode.__v == NULL;
	    if (isMounting) {
	      if (matchingIndex == -1) {
	        // When the array of children is growing we need to decrease the skew
	        // as we are adding a new element to the array.
	        // Example:
	        // [1, 2, 3] --> [0, 1, 2, 3]
	        // oldChildren   newChildren
	        //
	        // The new element is at index 0, so our skew is 0,
	        // we need to decrease the skew as we are adding a new element.
	        // The decrease will cause us to compare the element at position 1
	        // with value 1 with the element at position 0 with value 0.
	        //
	        // A linear concept is applied when the array is shrinking,
	        // if the length is unchanged we can assume that no skew
	        // changes are needed.
	        if (newChildrenLength > oldChildrenLength) {
	          skew--;
	        } else if (newChildrenLength < oldChildrenLength) {
	          skew++;
	        }
	      }

	      // If we are mounting a DOM VNode, mark it for insertion
	      if (typeof childVNode.type != 'function') {
	        childVNode.__u |= INSERT_VNODE;
	      }
	    } else if (matchingIndex != skewedIndex) {
	      // When we move elements around i.e. [0, 1, 2] --> [1, 0, 2]
	      // --> we diff 1, we find it at position 1 while our skewed index is 0 and our skew is 0
	      //     we set the skew to 1 as we found an offset.
	      // --> we diff 0, we find it at position 0 while our skewed index is at 2 and our skew is 1
	      //     this makes us increase the skew again.
	      // --> we diff 2, we find it at position 2 while our skewed index is at 4 and our skew is 2
	      //
	      // this becomes an optimization question where currently we see a 1 element offset as an insertion
	      // or deletion i.e. we optimize for [0, 1, 2] --> [9, 0, 1, 2]
	      // while a more than 1 offset we see as a swap.
	      // We could probably build heuristics for having an optimized course of action here as well, but
	      // might go at the cost of some bytes.
	      //
	      // If we wanted to optimize for i.e. only swaps we'd just do the last two code-branches and have
	      // only the first item be a re-scouting and all the others fall in their skewed counter-part.
	      // We could also further optimize for swaps
	      if (matchingIndex == skewedIndex - 1) {
	        skew--;
	      } else if (matchingIndex == skewedIndex + 1) {
	        skew++;
	      } else {
	        if (matchingIndex > skewedIndex) {
	          skew--;
	        } else {
	          skew++;
	        }

	        // Move this VNode's DOM if the original index (matchingIndex) doesn't
	        // match the new skew index (i + new skew)
	        // In the former two branches we know that it matches after skewing
	        childVNode.__u |= INSERT_VNODE;
	      }
	    }
	  }

	  // Remove remaining oldChildren if there are any. Loop forwards so that as we
	  // unmount DOM from the beginning of the oldChildren, we can adjust oldDom to
	  // point to the next child, which needs to be the first DOM node that won't be
	  // unmounted.
	  if (remainingOldChildren) {
	    for (i = 0; i < oldChildrenLength; i++) {
	      oldVNode = oldChildren[i];
	      if (oldVNode != NULL && (oldVNode.__u & MATCHED) == 0) {
	        if (oldVNode.__e == oldDom) {
	          oldDom = getDomSibling(oldVNode);
	        }
	        unmount(oldVNode, oldVNode);
	      }
	    }
	  }
	  return oldDom;
	}

	/**
	 * @param {VNode} parentVNode
	 * @param {PreactElement} oldDom
	 * @param {PreactElement} parentDom
	 * @param {boolean} shouldPlace
	 * @returns {PreactElement}
	 */
	function insert(parentVNode, oldDom, parentDom, shouldPlace) {
	  // Note: VNodes in nested suspended trees may be missing _children.

	  if (typeof parentVNode.type == 'function') {
	    var children = parentVNode.__k;
	    for (var i = 0; children && i < children.length; i++) {
	      if (children[i]) {
	        // If we enter this code path on sCU bailout, where we copy
	        // oldVNode._children to newVNode._children, we need to update the old
	        // children's _parent pointer to point to the newVNode (parentVNode
	        // here).
	        children[i].__ = parentVNode;
	        oldDom = insert(children[i], oldDom, parentDom, shouldPlace);
	      }
	    }
	    return oldDom;
	  } else if (parentVNode.__e != oldDom) {
	    if (shouldPlace) {
	      if (oldDom && parentVNode.type && !oldDom.parentNode) {
	        oldDom = getDomSibling(parentVNode);
	      }
	      parentDom.insertBefore(parentVNode.__e, oldDom || NULL);
	    }
	    oldDom = parentVNode.__e;
	  }
	  do {
	    oldDom = oldDom && oldDom.nextSibling;
	  } while (oldDom != NULL && oldDom.nodeType == 8);
	  return oldDom;
	}

	/**
	 * Flatten and loop through the children of a virtual node
	 * @param {ComponentChildren} children The unflattened children of a virtual
	 * node
	 * @returns {VNode[]}
	 */
	function toChildArray(children, out) {
	  out = out || [];
	  if (children == NULL || typeof children == 'boolean') ; else if (isArray(children)) {
	    children.some(function (child) {
	      toChildArray(child, out);
	    });
	  } else {
	    out.push(children);
	  }
	  return out;
	}

	/**
	 * @param {VNode} childVNode
	 * @param {VNode[]} oldChildren
	 * @param {number} skewedIndex
	 * @param {number} remainingOldChildren
	 * @returns {number}
	 */
	function findMatchingIndex(childVNode, oldChildren, skewedIndex, remainingOldChildren) {
	  var key = childVNode.key;
	  var type = childVNode.type;
	  var oldVNode = oldChildren[skewedIndex];
	  var matched = oldVNode != NULL && (oldVNode.__u & MATCHED) == 0;

	  // We only need to perform a search if there are more children
	  // (remainingOldChildren) to search. However, if the oldVNode we just looked
	  // at skewedIndex was not already used in this diff, then there must be at
	  // least 1 other (so greater than 1) remainingOldChildren to attempt to match
	  // against. So the following condition checks that ensuring
	  // remainingOldChildren > 1 if the oldVNode is not already used/matched. Else
	  // if the oldVNode was null or matched, then there could needs to be at least
	  // 1 (aka `remainingOldChildren > 0`) children to find and compare against.
	  //
	  // If there is an unkeyed functional VNode, that isn't a built-in like our Fragment,
	  // we should not search as we risk re-using state of an unrelated VNode. (reverted for now)
	  var shouldSearch =
	  // (typeof type != 'function' || type === Fragment || key) &&
	  remainingOldChildren > (matched ? 1 : 0);
	  if (oldVNode === NULL && key == null || matched && key == oldVNode.key && type == oldVNode.type) {
	    return skewedIndex;
	  } else if (shouldSearch) {
	    var x = skewedIndex - 1;
	    var y = skewedIndex + 1;
	    while (x >= 0 || y < oldChildren.length) {
	      var childIndex = x >= 0 ? x-- : y++;
	      oldVNode = oldChildren[childIndex];
	      if (oldVNode != NULL && (oldVNode.__u & MATCHED) == 0 && key == oldVNode.key && type == oldVNode.type) {
	        return childIndex;
	      }
	    }
	  }
	  return -1;
	}

	function setStyle(style, key, value) {
	  if (key[0] == '-') {
	    style.setProperty(key, value == NULL ? '' : value);
	  } else if (value == NULL) {
	    style[key] = '';
	  } else if (typeof value != 'number' || IS_NON_DIMENSIONAL.test(key)) {
	    style[key] = value;
	  } else {
	    style[key] = value + 'px';
	  }
	}
	var CAPTURE_REGEX = /(PointerCapture)$|Capture$/i;

	// A logical clock to solve issues like https://github.com/preactjs/preact/issues/3927.
	// When the DOM performs an event it leaves micro-ticks in between bubbling up which means that
	// an event can trigger on a newly reated DOM-node while the event bubbles up.
	//
	// Originally inspired by Vue
	// (https://github.com/vuejs/core/blob/caeb8a68811a1b0f79/packages/runtime-dom/src/modules/events.ts#L90-L101),
	// but modified to use a logical clock instead of Date.now() in case event handlers get attached
	// and events get dispatched during the same millisecond.
	//
	// The clock is incremented after each new event dispatch. This allows 1 000 000 new events
	// per second for over 280 years before the value reaches Number.MAX_SAFE_INTEGER (2**53 - 1).
	var eventClock = 0;

	/**
	 * Set a property value on a DOM node
	 * @param {import('../internal').PreactElement} dom The DOM node to modify
	 * @param {string} name The name of the property to set
	 * @param {*} value The value to set the property to
	 * @param {*} oldValue The old value the property had
	 * @param {string} namespace Whether or not this DOM node is an SVG node or not
	 */
	function setProperty(dom, name, value, oldValue, namespace) {
	  var useCapture;
	  o: if (name == 'style') {
	    if (typeof value == 'string') {
	      dom.style.cssText = value;
	    } else {
	      if (typeof oldValue == 'string') {
	        dom.style.cssText = oldValue = '';
	      }
	      if (oldValue) {
	        for (name in oldValue) {
	          if (!(value && name in value)) {
	            setStyle(dom.style, name, '');
	          }
	        }
	      }
	      if (value) {
	        for (name in value) {
	          if (!oldValue || value[name] != oldValue[name]) {
	            setStyle(dom.style, name, value[name]);
	          }
	        }
	      }
	    }
	  }
	  // Benchmark for comparison: https://esbench.com/bench/574c954bdb965b9a00965ac6
	  else if (name[0] == 'o' && name[1] == 'n') {
	    useCapture = name != (name = name.replace(CAPTURE_REGEX, '$1'));
	    var lowerCaseName = name.toLowerCase();

	    // Infer correct casing for DOM built-in events:
	    if (lowerCaseName in dom || name == 'onFocusOut' || name == 'onFocusIn') name = lowerCaseName.slice(2);else name = name.slice(2);
	    if (!dom.l) dom.l = {};
	    dom.l[name + useCapture] = value;
	    if (value) {
	      if (!oldValue) {
	        value._attached = eventClock;
	        dom.addEventListener(name, useCapture ? eventProxyCapture : eventProxy, useCapture);
	      } else {
	        value._attached = oldValue._attached;
	      }
	    } else {
	      dom.removeEventListener(name, useCapture ? eventProxyCapture : eventProxy, useCapture);
	    }
	  } else {
	    if (namespace == SVG_NAMESPACE) {
	      // Normalize incorrect prop usage for SVG:
	      // - xlink:href / xlinkHref --> href (xlink:href was removed from SVG and isn't needed)
	      // - className --> class
	      name = name.replace(/xlink(H|:h)/, 'h').replace(/sName$/, 's');
	    } else if (name != 'width' && name != 'height' && name != 'href' && name != 'list' && name != 'form' &&
	    // Default value in browsers is `-1` and an empty string is
	    // cast to `0` instead
	    name != 'tabIndex' && name != 'download' && name != 'rowSpan' && name != 'colSpan' && name != 'role' && name != 'popover' && name in dom) {
	      try {
	        dom[name] = value == NULL ? '' : value;
	        // labelled break is 1b smaller here than a return statement (sorry)
	        break o;
	      } catch (e) {}
	    }

	    // aria- and data- attributes have no boolean representation.
	    // A `false` value is different from the attribute not being
	    // present, so we can't remove it. For non-boolean aria
	    // attributes we could treat false as a removal, but the
	    // amount of exceptions would cost too many bytes. On top of
	    // that other frameworks generally stringify `false`.

	    if (typeof value == 'function') ; else if (value != NULL && (value !== false || name[4] == '-')) {
	      dom.setAttribute(name, name == 'popover' && value == true ? '' : value);
	    } else {
	      dom.removeAttribute(name);
	    }
	  }
	}

	/**
	 * Create an event proxy function.
	 * @param {boolean} useCapture Is the event handler for the capture phase.
	 * @private
	 */
	function createEventProxy(useCapture) {
	  /**
	   * Proxy an event to hooked event handlers
	   * @param {import('../internal').PreactEvent} e The event object from the browser
	   * @private
	   */
	  return function (e) {
	    if (this.l) {
	      var eventHandler = this.l[e.type + useCapture];
	      if (e._dispatched == NULL) {
	        e._dispatched = eventClock++;

	        // When `e._dispatched` is smaller than the time when the targeted event
	        // handler was attached we know we have bubbled up to an element that was added
	        // during patching the DOM.
	      } else if (e._dispatched < eventHandler._attached) {
	        return;
	      }
	      return eventHandler(options.event ? options.event(e) : e);
	    }
	  };
	}
	var eventProxy = createEventProxy(false);
	var eventProxyCapture = createEventProxy(true);

	/**
	 * @typedef {import('../internal').ComponentChildren} ComponentChildren
	 * @typedef {import('../internal').Component} Component
	 * @typedef {import('../internal').PreactElement} PreactElement
	 * @typedef {import('../internal').VNode} VNode
	 */

	/**
	 * @template {any} T
	 * @typedef {import('../internal').Ref<T>} Ref<T>
	 */

	/**
	 * Diff two virtual nodes and apply proper changes to the DOM
	 * @param {PreactElement} parentDom The parent of the DOM element
	 * @param {VNode} newVNode The new virtual node
	 * @param {VNode} oldVNode The old virtual node
	 * @param {object} globalContext The current context object. Modified by
	 * getChildContext
	 * @param {string} namespace Current namespace of the DOM node (HTML, SVG, or MathML)
	 * @param {Array<PreactElement>} excessDomChildren
	 * @param {Array<Component>} commitQueue List of components which have callbacks
	 * to invoke in commitRoot
	 * @param {PreactElement} oldDom The current attached DOM element any new dom
	 * elements should be placed around. Likely `null` on first render (except when
	 * hydrating). Can be a sibling DOM element when diffing Fragments that have
	 * siblings. In most cases, it starts out as `oldChildren[0]._dom`.
	 * @param {boolean} isHydrating Whether or not we are in hydration
	 * @param {any[]} refQueue an array of elements needed to invoke refs
	 */
	function diff(parentDom, newVNode, oldVNode, globalContext, namespace, excessDomChildren, commitQueue, oldDom, isHydrating, refQueue) {
	  /** @type {any} */
	  var tmp,
	    newType = newVNode.type;

	  // When passing through createElement it assigns the object
	  // constructor as undefined. This to prevent JSON-injection.
	  if (newVNode.constructor != UNDEFINED) return NULL;

	  // If the previous diff bailed out, resume creating/hydrating.
	  if (oldVNode.__u & MODE_SUSPENDED) {
	    isHydrating = !!(oldVNode.__u & MODE_HYDRATE);
	    oldDom = newVNode.__e = oldVNode.__e;
	    excessDomChildren = [oldDom];
	  }
	  if (tmp = options.__b) tmp(newVNode);
	  if (tmp = options._diff2) tmp(newVNode, oldVNode);
	  outer: if (typeof newType == 'function') {
	    try {
	      var c, isNew, oldProps, oldState, snapshot, clearProcessingException;
	      var newProps = newVNode.props;
	      var isClassComponent = 'prototype' in newType && newType.prototype.render;

	      // Necessary for createContext api. Setting this property will pass
	      // the context value as `this.context` just for this component.
	      tmp = newType.contextType;
	      var provider = tmp && globalContext[tmp.__c];
	      var componentContext = tmp ? provider ? provider.props.value : tmp.__ : globalContext;

	      // Get component and set it to `c`
	      if (oldVNode.__c) {
	        c = newVNode.__c = oldVNode.__c;
	        clearProcessingException = c.__ = c.__E;
	      } else {
	        // Instantiate the new component
	        if (isClassComponent) {
	          // @ts-expect-error The check above verifies that newType is suppose to be constructed
	          newVNode.__c = c = new newType(newProps, componentContext); // eslint-disable-line new-cap
	        } else {
	          // @ts-expect-error Trust me, Component implements the interface we want
	          newVNode.__c = c = new BaseComponent(newProps, componentContext);
	          c.constructor = newType;
	          c.render = doRender;
	        }
	        if (provider) provider.sub(c);
	        if (!c.state) c.state = {};
	        c.__n = globalContext;
	        isNew = c.__d = true;
	        c.__h = [];
	        c._sb = [];
	      }

	      // Invoke getDerivedStateFromProps
	      if (isClassComponent && c.__s == NULL) {
	        c.__s = c.state;
	      }
	      if (isClassComponent && newType.getDerivedStateFromProps != NULL) {
	        if (c.__s == c.state) {
	          c.__s = assign({}, c.__s);
	        }
	        assign(c.__s, newType.getDerivedStateFromProps(newProps, c.__s));
	      }
	      oldProps = c.props;
	      oldState = c.state;
	      c.__v = newVNode;

	      // Invoke pre-render lifecycle methods
	      if (isNew) {
	        if (isClassComponent && newType.getDerivedStateFromProps == NULL && c.componentWillMount != NULL) {
	          c.componentWillMount();
	        }
	        if (isClassComponent && c.componentDidMount != NULL) {
	          c.__h.push(c.componentDidMount);
	        }
	      } else {
	        if (isClassComponent && newType.getDerivedStateFromProps == NULL && newProps !== oldProps && c.componentWillReceiveProps != NULL) {
	          c.componentWillReceiveProps(newProps, componentContext);
	        }
	        if (newVNode.__v == oldVNode.__v || !c.__e && c.shouldComponentUpdate != NULL && c.shouldComponentUpdate(newProps, c.__s, componentContext) === false) {
	          // More info about this here: https://gist.github.com/JoviDeCroock/bec5f2ce93544d2e6070ef8e0036e4e8
	          if (newVNode.__v != oldVNode.__v) {
	            // When we are dealing with a bail because of sCU we have to update
	            // the props, state and dirty-state.
	            // when we are dealing with strict-equality we don't as the child could still
	            // be dirtied see #3883
	            c.props = newProps;
	            c.state = c.__s;
	            c.__d = false;
	          }
	          newVNode.__e = oldVNode.__e;
	          newVNode.__k = oldVNode.__k;
	          newVNode.__k.some(function (vnode) {
	            if (vnode) vnode.__ = newVNode;
	          });
	          for (var i = 0; i < c._sb.length; i++) {
	            c.__h.push(c._sb[i]);
	          }
	          c._sb = [];
	          if (c.__h.length) {
	            commitQueue.push(c);
	          }
	          break outer;
	        }
	        if (c.componentWillUpdate != NULL) {
	          c.componentWillUpdate(newProps, c.__s, componentContext);
	        }
	        if (isClassComponent && c.componentDidUpdate != NULL) {
	          c.__h.push(function () {
	            c.componentDidUpdate(oldProps, oldState, snapshot);
	          });
	        }
	      }
	      c.context = componentContext;
	      c.props = newProps;
	      c.__P = parentDom;
	      c.__e = false;
	      var renderHook = options.__r,
	        count = 0;
	      if (isClassComponent) {
	        c.state = c.__s;
	        c.__d = false;
	        if (renderHook) renderHook(newVNode);
	        tmp = c.render(c.props, c.state, c.context);
	        for (var _i = 0; _i < c._sb.length; _i++) {
	          c.__h.push(c._sb[_i]);
	        }
	        c._sb = [];
	      } else {
	        do {
	          c.__d = false;
	          if (renderHook) renderHook(newVNode);
	          tmp = c.render(c.props, c.state, c.context);

	          // Handle setState called in render, see #2553
	          c.state = c.__s;
	        } while (c.__d && ++count < 25);
	      }

	      // Handle setState called in render, see #2553
	      c.state = c.__s;
	      if (c.getChildContext != NULL) {
	        globalContext = assign(assign({}, globalContext), c.getChildContext());
	      }
	      if (isClassComponent && !isNew && c.getSnapshotBeforeUpdate != NULL) {
	        snapshot = c.getSnapshotBeforeUpdate(oldProps, oldState);
	      }
	      var isTopLevelFragment = tmp != NULL && tmp.type === Fragment && tmp.key == NULL;
	      var renderResult = tmp;
	      if (isTopLevelFragment) {
	        renderResult = cloneNode(tmp.props.children);
	      }
	      oldDom = diffChildren(parentDom, isArray(renderResult) ? renderResult : [renderResult], newVNode, oldVNode, globalContext, namespace, excessDomChildren, commitQueue, oldDom, isHydrating, refQueue);
	      c.base = newVNode.__e;

	      // We successfully rendered this VNode, unset any stored hydration/bailout state:
	      newVNode.__u &= RESET_MODE;
	      if (c.__h.length) {
	        commitQueue.push(c);
	      }
	      if (clearProcessingException) {
	        c.__E = c.__ = NULL;
	      }
	    } catch (e) {
	      newVNode.__v = NULL;
	      // if hydrating or creating initial tree, bailout preserves DOM:
	      if (isHydrating || excessDomChildren != NULL) {
	        if (e.then) {
	          newVNode.__u |= isHydrating ? MODE_HYDRATE | MODE_SUSPENDED : MODE_SUSPENDED;
	          while (oldDom && oldDom.nodeType == 8 && oldDom.nextSibling) {
	            oldDom = oldDom.nextSibling;
	          }
	          excessDomChildren[excessDomChildren.indexOf(oldDom)] = NULL;
	          newVNode.__e = oldDom;
	        } else {
	          for (var _i2 = excessDomChildren.length; _i2--;) {
	            removeNode(excessDomChildren[_i2]);
	          }
	          markAsForce(newVNode);
	        }
	      } else {
	        newVNode.__e = oldVNode.__e;
	        newVNode.__k = oldVNode.__k;
	        if (!e.then) markAsForce(newVNode);
	      }
	      options.__e(e, newVNode, oldVNode);
	    }
	  } else if (excessDomChildren == NULL && newVNode.__v == oldVNode.__v) {
	    newVNode.__k = oldVNode.__k;
	    newVNode.__e = oldVNode.__e;
	  } else {
	    oldDom = newVNode.__e = diffElementNodes(oldVNode.__e, newVNode, oldVNode, globalContext, namespace, excessDomChildren, commitQueue, isHydrating, refQueue);
	  }
	  if (tmp = options.diffed) tmp(newVNode);
	  return newVNode.__u & MODE_SUSPENDED ? undefined : oldDom;
	}
	function markAsForce(vnode) {
	  if (vnode && vnode.__c) vnode.__c.__e = true;
	  if (vnode && vnode.__k) vnode.__k.forEach(markAsForce);
	}

	/**
	 * @param {Array<Component>} commitQueue List of components
	 * which have callbacks to invoke in commitRoot
	 * @param {VNode} root
	 */
	function commitRoot(commitQueue, root, refQueue) {
	  for (var i = 0; i < refQueue.length; i++) {
	    applyRef(refQueue[i], refQueue[++i], refQueue[++i]);
	  }
	  if (options.__c) options.__c(root, commitQueue);
	  commitQueue.some(function (c) {
	    try {
	      // @ts-expect-error Reuse the commitQueue variable here so the type changes
	      commitQueue = c.__h;
	      c.__h = [];
	      commitQueue.some(function (cb) {
	        // @ts-expect-error See above comment on commitQueue
	        cb.call(c);
	      });
	    } catch (e) {
	      options.__e(e, c.__v);
	    }
	  });
	}
	function cloneNode(node) {
	  if (typeof node != 'object' || node == NULL || node.__b && node.__b > 0) {
	    return node;
	  }
	  if (isArray(node)) {
	    return node.map(cloneNode);
	  }
	  return assign({}, node);
	}

	/**
	 * Diff two virtual nodes representing DOM element
	 * @param {PreactElement} dom The DOM element representing the virtual nodes
	 * being diffed
	 * @param {VNode} newVNode The new virtual node
	 * @param {VNode} oldVNode The old virtual node
	 * @param {object} globalContext The current context object
	 * @param {string} namespace Current namespace of the DOM node (HTML, SVG, or MathML)
	 * @param {Array<PreactElement>} excessDomChildren
	 * @param {Array<Component>} commitQueue List of components which have callbacks
	 * to invoke in commitRoot
	 * @param {boolean} isHydrating Whether or not we are in hydration
	 * @param {any[]} refQueue an array of elements needed to invoke refs
	 * @returns {PreactElement}
	 */
	function diffElementNodes(dom, newVNode, oldVNode, globalContext, namespace, excessDomChildren, commitQueue, isHydrating, refQueue) {
	  var oldProps = oldVNode.props || EMPTY_OBJ;
	  var newProps = newVNode.props;
	  var nodeType = /** @type {string} */newVNode.type;
	  /** @type {any} */
	  var i;
	  /** @type {{ __html?: string }} */
	  var newHtml;
	  /** @type {{ __html?: string }} */
	  var oldHtml;
	  /** @type {ComponentChildren} */
	  var newChildren;
	  var value;
	  var inputValue;
	  var checked;

	  // Tracks entering and exiting namespaces when descending through the tree.
	  if (nodeType == 'svg') namespace = SVG_NAMESPACE;else if (nodeType == 'math') namespace = MATH_NAMESPACE;else if (!namespace) namespace = XHTML_NAMESPACE;
	  if (excessDomChildren != NULL) {
	    for (i = 0; i < excessDomChildren.length; i++) {
	      value = excessDomChildren[i];

	      // if newVNode matches an element in excessDomChildren or the `dom`
	      // argument matches an element in excessDomChildren, remove it from
	      // excessDomChildren so it isn't later removed in diffChildren
	      if (value && 'setAttribute' in value == !!nodeType && (nodeType ? value.localName == nodeType : value.nodeType == 3)) {
	        dom = value;
	        excessDomChildren[i] = NULL;
	        break;
	      }
	    }
	  }
	  if (dom == NULL) {
	    if (nodeType == NULL) {
	      return options.document.createTextNode(newProps);
	    }
	    dom = options.document.createElementNS(namespace, nodeType, newProps.is && newProps);

	    // we are creating a new node, so we can assume this is a new subtree (in
	    // case we are hydrating), this deopts the hydrate
	    if (isHydrating) {
	      if (options.__m) options.__m(newVNode, excessDomChildren);
	      isHydrating = false;
	    }
	    // we created a new parent, so none of the previously attached children can be reused:
	    excessDomChildren = NULL;
	  }
	  if (nodeType == NULL) {
	    // During hydration, we still have to split merged text from SSR'd HTML.
	    if (oldProps !== newProps && (!isHydrating || dom.data != newProps)) {
	      dom.data = newProps;
	    }
	  } else {
	    // If excessDomChildren was not null, repopulate it with the current element's children:
	    excessDomChildren = excessDomChildren && slice.call(dom.childNodes);

	    // If we are in a situation where we are not hydrating but are using
	    // existing DOM (e.g. replaceNode) we should read the existing DOM
	    // attributes to diff them
	    if (!isHydrating && excessDomChildren != NULL) {
	      oldProps = {};
	      for (i = 0; i < dom.attributes.length; i++) {
	        value = dom.attributes[i];
	        oldProps[value.name] = value.value;
	      }
	    }
	    for (i in oldProps) {
	      value = oldProps[i];
	      if (i == 'children') ; else if (i == 'dangerouslySetInnerHTML') {
	        oldHtml = value;
	      } else if (!(i in newProps)) {
	        if (i == 'value' && 'defaultValue' in newProps || i == 'checked' && 'defaultChecked' in newProps) {
	          continue;
	        }
	        setProperty(dom, i, NULL, value, namespace);
	      }
	    }

	    // During hydration, props are not diffed at all (including dangerouslySetInnerHTML)
	    // @TODO we should warn in debug mode when props don't match here.
	    for (i in newProps) {
	      value = newProps[i];
	      if (i == 'children') {
	        newChildren = value;
	      } else if (i == 'dangerouslySetInnerHTML') {
	        newHtml = value;
	      } else if (i == 'value') {
	        inputValue = value;
	      } else if (i == 'checked') {
	        checked = value;
	      } else if ((!isHydrating || typeof value == 'function') && oldProps[i] !== value) {
	        setProperty(dom, i, value, oldProps[i], namespace);
	      }
	    }

	    // If the new vnode didn't have dangerouslySetInnerHTML, diff its children
	    if (newHtml) {
	      // Avoid re-applying the same '__html' if it did not changed between re-render
	      if (!isHydrating && (!oldHtml || newHtml.__html != oldHtml.__html && newHtml.__html != dom.innerHTML)) {
	        dom.innerHTML = newHtml.__html;
	      }
	      newVNode.__k = [];
	    } else {
	      if (oldHtml) dom.innerHTML = '';
	      diffChildren(
	      // @ts-expect-error
	      newVNode.type == 'template' ? dom.content : dom, isArray(newChildren) ? newChildren : [newChildren], newVNode, oldVNode, globalContext, nodeType == 'foreignObject' ? XHTML_NAMESPACE : namespace, excessDomChildren, commitQueue, excessDomChildren ? excessDomChildren[0] : oldVNode.__k && getDomSibling(oldVNode, 0), isHydrating, refQueue);

	      // Remove children that are not part of any vnode.
	      if (excessDomChildren != NULL) {
	        for (i = excessDomChildren.length; i--;) {
	          removeNode(excessDomChildren[i]);
	        }
	      }
	    }

	    // As above, don't diff props during hydration
	    if (!isHydrating) {
	      i = 'value';
	      if (nodeType == 'progress' && inputValue == NULL) {
	        dom.removeAttribute('value');
	      } else if (inputValue != UNDEFINED && (
	      // #2756 For the <progress>-element the initial value is 0,
	      // despite the attribute not being present. When the attribute
	      // is missing the progress bar is treated as indeterminate.
	      // To fix that we'll always update it when it is 0 for progress elements
	      inputValue !== dom[i] || nodeType == 'progress' && !inputValue ||
	      // This is only for IE 11 to fix <select> value not being updated.
	      // To avoid a stale select value we need to set the option.value
	      // again, which triggers IE11 to re-evaluate the select value
	      nodeType == 'option' && inputValue != oldProps[i])) {
	        setProperty(dom, i, inputValue, oldProps[i], namespace);
	      }
	      i = 'checked';
	      if (checked != UNDEFINED && checked != dom[i]) {
	        setProperty(dom, i, checked, oldProps[i], namespace);
	      }
	    }
	  }
	  return dom;
	}

	/**
	 * Invoke or update a ref, depending on whether it is a function or object ref.
	 * @param {Ref<any> & { _unmount?: unknown }} ref
	 * @param {any} value
	 * @param {VNode} vnode
	 */
	function applyRef(ref, value, vnode) {
	  try {
	    if (typeof ref == 'function') {
	      var hasRefUnmount = typeof ref.__u == 'function';
	      if (hasRefUnmount) {
	        // @ts-ignore TS doesn't like moving narrowing checks into variables
	        ref.__u();
	      }
	      if (!hasRefUnmount || value != NULL) {
	        // Store the cleanup function on the function
	        // instance object itself to avoid shape
	        // transitioning vnode
	        ref.__u = ref(value);
	      }
	    } else ref.current = value;
	  } catch (e) {
	    options.__e(e, vnode);
	  }
	}

	/**
	 * Unmount a virtual node from the tree and apply DOM changes
	 * @param {VNode} vnode The virtual node to unmount
	 * @param {VNode} parentVNode The parent of the VNode that initiated the unmount
	 * @param {boolean} [skipRemove] Flag that indicates that a parent node of the
	 * current element is already detached from the DOM.
	 */
	function unmount(vnode, parentVNode, skipRemove) {
	  var r;
	  if (options.unmount) options.unmount(vnode);
	  if (r = vnode.ref) {
	    if (!r.current || r.current == vnode.__e) {
	      applyRef(r, NULL, parentVNode);
	    }
	  }
	  if ((r = vnode.__c) != NULL) {
	    if (r.componentWillUnmount) {
	      try {
	        r.componentWillUnmount();
	      } catch (e) {
	        options.__e(e, parentVNode);
	      }
	    }
	    r.base = r.__P = NULL;
	  }
	  if (r = vnode.__k) {
	    for (var i = 0; i < r.length; i++) {
	      if (r[i]) {
	        unmount(r[i], parentVNode, skipRemove || typeof vnode.type != 'function');
	      }
	    }
	  }
	  if (!skipRemove) {
	    removeNode(vnode.__e);
	  }
	  vnode.__c = vnode.__ = vnode.__e = UNDEFINED;
	}

	/** The `.render()` method for a PFC backing instance. */
	function doRender(props, state, context) {
	  return this.constructor(props, context);
	}

	/**
	 * Render a Preact virtual node into a DOM element
	 * @param {import('./internal').ComponentChild} vnode The virtual node to render
	 * @param {import('./internal').PreactElement} parentDom The DOM element to render into
	 * @param {import('./internal').PreactElement | object} [replaceNode] Optional: Attempt to re-use an
	 * existing DOM tree rooted at `replaceNode`
	 */
	function render(vnode, parentDom, replaceNode) {
	  if (options.__) options.__(vnode, parentDom);

	  // We abuse the `replaceNode` parameter in `hydrate()` to signal if we are in
	  // hydration mode or not by passing the `hydrate` function instead of a DOM
	  // element..
	  var isHydrating = typeof replaceNode == 'function';

	  // To be able to support calling `render()` multiple times on the same
	  // DOM node, we need to obtain a reference to the previous tree. We do
	  // this by assigning a new `_children` property to DOM nodes which points
	  // to the last rendered tree. By default this property is not present, which
	  // means that we are mounting a new tree for the first time.
	  var oldVNode = isHydrating ? NULL : replaceNode && replaceNode.__k || parentDom.__k;
	  vnode = (!isHydrating && replaceNode || parentDom).__k = createElement(Fragment, NULL, [vnode]);

	  // List of effects that need to be called after diffing.
	  var commitQueue = [],
	    refQueue = [];
	  diff(parentDom,
	  // Determine the new vnode tree and store it on the DOM element on
	  // our custom `_children` property.
	  vnode, oldVNode || EMPTY_OBJ, EMPTY_OBJ, parentDom.namespaceURI, !isHydrating && replaceNode ? [replaceNode] : oldVNode ? NULL : parentDom.firstChild ? slice.call(parentDom.childNodes) : NULL, commitQueue, !isHydrating && replaceNode ? replaceNode : oldVNode ? oldVNode.__e : parentDom.firstChild, isHydrating, refQueue);

	  // Flush all queued effects
	  commitRoot(commitQueue, vnode, refQueue);
	}

	/**
	 * Update an existing DOM element with data from a Preact virtual node
	 * @param {import('./internal').ComponentChild} vnode The virtual node to render
	 * @param {import('./internal').PreactElement} parentDom The DOM element to update
	 */
	function hydrate(vnode, parentDom) {
	  render(vnode, parentDom, hydrate);
	}

	/**
	 * Clones the given VNode, optionally adding attributes/props and replacing its
	 * children.
	 * @param {import('./internal').VNode} vnode The virtual DOM element to clone
	 * @param {object} props Attributes/props to add when cloning
	 * @param {Array<import('./internal').ComponentChildren>} rest Any additional arguments will be used
	 * as replacement children.
	 * @returns {import('./internal').VNode}
	 */
	function cloneElement(vnode, props, children) {
	  var normalizedProps = assign({}, vnode.props),
	    key,
	    ref,
	    i;
	  var defaultProps;
	  if (vnode.type && vnode.type.defaultProps) {
	    defaultProps = vnode.type.defaultProps;
	  }
	  for (i in props) {
	    if (i == 'key') key = props[i];else if (i == 'ref') ref = props[i];else if (props[i] === UNDEFINED && defaultProps != UNDEFINED) {
	      normalizedProps[i] = defaultProps[i];
	    } else {
	      normalizedProps[i] = props[i];
	    }
	  }
	  if (arguments.length > 2) {
	    normalizedProps.children = arguments.length > 3 ? slice.call(arguments, 2) : children;
	  }
	  return createVNode(vnode.type, normalizedProps, key || vnode.key, ref || vnode.ref, NULL);
	}

	var i = 0;
	function createContext(defaultValue) {
	  function Context(props) {
	    if (!this.getChildContext) {
	      /** @type {Set<import('./internal').Component> | null} */
	      var subs = new Set();
	      var ctx = {};
	      ctx[Context.__c] = this;
	      this.getChildContext = function () {
	        return ctx;
	      };
	      this.componentWillUnmount = function () {
	        subs = NULL;
	      };
	      this.shouldComponentUpdate = function (_props) {
	        // @ts-expect-error even
	        if (this.props.value != _props.value) {
	          subs.forEach(function (c) {
	            c.__e = true;
	            enqueueRender(c);
	          });
	        }
	      };
	      this.sub = function (c) {
	        subs.add(c);
	        var old = c.componentWillUnmount;
	        c.componentWillUnmount = function () {
	          if (subs) {
	            subs.delete(c);
	          }
	          if (old) old.call(c);
	        };
	      };
	    }
	    return props.children;
	  }
	  Context.__c = '__cC' + i++;
	  Context.__ = defaultValue;

	  /** @type {import('./internal').FunctionComponent} */
	  Context.Consumer = function (props, contextValue) {
	    return props.children(contextValue);
	  };

	  // we could also get rid of _contextRef entirely
	  Context.Provider = Context.__l = Context.Consumer.contextType = Context;
	  return Context;
	}

	var preact = {
		__proto__: null,
		render: render,
		hydrate: hydrate,
		createElement: createElement,
		h: createElement,
		Fragment: Fragment,
		createRef: createRef,
		isValidElement: isValidElement,
		Component: BaseComponent,
		process: process,
		cloneElement: cloneElement,
		createContext: createContext,
		toChildArray: toChildArray,
		options: options
	};

	if (typeof module < 'u') module.exports = preact;else self.preact = preact;

})();
//# sourceMappingURL=preact.min.js.map
