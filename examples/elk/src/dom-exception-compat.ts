type DOMExceptionTarget = Record<string, any>;

export function installDOMException(target: DOMExceptionTarget): void {
  if (typeof target.DOMException === 'function')
    return;

  class CompatibleDOMException extends Error {
    constructor(message = '', name = 'Error') {
      super(message);
      this.name = name;
    }
  }

  target.DOMException = CompatibleDOMException;
}
