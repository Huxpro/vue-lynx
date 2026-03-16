import { type FC, useEffect, useRef, useState } from 'react';
import { CodeBlockRuntime } from '@theme';

import { getHighlightLines } from '../utils/example-data';
import { transformerNotationHighlight } from '@shikijs/transformers';
import { transformerAddLineNumbers } from '@rspress/core/shiki-transformers';
import { transformerRuntimeMetaHighlight } from './shiki-transformer';
import styles from './code.module.scss';

interface CodeProps {
  val: string;
  language: string;
  highlight?: string; // {1,3-5}
  isFirstShowCode: boolean;
  setIsFirstShowCode: (isFirstShowCode: boolean) => void;
}

export const Code: FC<CodeProps> = ({
  val,
  language,
  highlight,
  isFirstShowCode,
  setIsFirstShowCode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightVal, setHighlightVal] = useState(highlight);
  const defaultValRef = useRef(val);

  function scrollToFirstHighlightLine() {
    if (!val) {
      return;
    }

    if (isFirstShowCode) {
      if (containerRef.current && highlight) {
        const highlightLines = getHighlightLines(highlight);
        const firstHighlight = highlightLines[0];
        setIsFirstShowCode(false);
        if (firstHighlight > 3) {
          setTimeout(() => {
            const container = containerRef.current;
            if (container) {
              const firstHighlightElement = containerRef.current.querySelector(
                `pre.shiki code span.highlighted`,
              );

              if (firstHighlightElement) {
                const container = containerRef.current.parentElement;
                if (container) {
                  const offsetTop =
                    firstHighlightElement.getBoundingClientRect().top -
                    containerRef.current.getBoundingClientRect().top -
                    50;
                  container.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
              }
            }
          });
        }
        defaultValRef.current = val;
      }
    } else {
      if (defaultValRef.current) {
        defaultValRef.current = '';
        return;
      }
      if (containerRef.current) {
        const container = containerRef.current.parentElement;
        // fix scroll to top flicker
        setTimeout(() => {
          if (container) {
            container.scrollTo({ top: 0, behavior: 'auto' });
          }
        }, 0);
      }
    }
  }

  // fixed tab change highlight delay
  useEffect(() => {
    setHighlightVal(highlight);
  }, [highlight]);
  return (
    <div ref={containerRef} className={styles.code}>
      <CodeBlockRuntime
        lang={language}
        onRendered={() => {
          scrollToFirstHighlightLine();
        }}
        code={val}
        shikiOptions={{
          transformers: [
            transformerNotationHighlight(),
            transformerAddLineNumbers(),
            ...(highlightVal
              ? [
                  transformerRuntimeMetaHighlight({
                    highlightVal,
                  }),
                ]
              : []),
          ],
        }}
      />
    </div>
  );
};
