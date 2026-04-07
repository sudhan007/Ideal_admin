// import { useEffect, useRef } from 'react';
// import katex from 'katex';

// interface MathPreviewProps {
//   text: string;
//   latex: string;
// }

// const MathPreview = ({ text, latex }: MathPreviewProps) => {
//   const containerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (!containerRef.current) return;

//     try {
//       if (latex) {
//         // Render LaTeX formula
//         containerRef.current.innerHTML = '';

//         // Handle inline and display math
//         const processedLatex = latex
//           .replace(/\$\$(.*?)\$\$/g, (_, formula) => {
//             // Display math (block)
//             const span = document.createElement('div');
//             span.className = 'math-display';
//             katex.render(formula, span, {
//               displayMode: true,
//               throwOnError: false,
//               strict: false,
//             });
//             return span.outerHTML;
//           })
//           .replace(/\$(.*?)\$/g, (_, formula) => {
//             // Inline math
//             const span = document.createElement('span');
//             span.className = 'math-inline';
//             katex.render(formula, span, {
//               displayMode: false,
//               throwOnError: false,
//               strict: false,
//             });
//             return span.outerHTML;
//           });

//         containerRef.current.innerHTML = processedLatex;
//       } else if (text) {
//         // Render plain text (but check for any LaTeX patterns)
//         containerRef.current.innerHTML = '';

//         // Split by $ delimiters and render LaTeX parts
//         const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);

//         parts.forEach((part) => {
//           if (part.match(/^\$\$.*\$\$$/)) {
//             // Display math
//             const formula = part.slice(2, -2);
//             const div = document.createElement('div');
//             div.className = 'math-display';
//             try {
//               katex.render(formula, div, {
//                 displayMode: true,
//                 throwOnError: false,
//                 strict: false,
//               });
//             } catch (e) {
//               div.textContent = part;
//             }
//             containerRef.current?.appendChild(div);
//           } else if (part.match(/^\$.*\$$/)) {
//             // Inline math
//             const formula = part.slice(1, -1);
//             const span = document.createElement('span');
//             span.className = 'math-inline';
//             try {
//               katex.render(formula, span, {
//                 displayMode: false,
//                 throwOnError: false,
//                 strict: false,
//               });
//             } catch (e) {
//               span.textContent = part;
//             }
//             containerRef.current?.appendChild(span);
//           } else if (part) {
//             // Regular text
//             const textNode = document.createTextNode(part);
//             containerRef.current?.appendChild(textNode);
//           }
//         });
//       } else {
//         containerRef.current.innerHTML =
//           '<span class="text-gray-400 italic">No content</span>';
//       }
//     } catch (error) {
//       console.error('Error rendering math:', error);
//       containerRef.current.innerHTML = `<span class="text-red-500">Error rendering formula</span>`;
//     }
//   }, [text, latex]);

//   return (
//     <div
//       ref={containerRef}
//       className="math-preview"
//       style={{
//         minHeight: '1.5em',
//       }}
//     />
//   );
// };

// export default MathPreview;

// import { useEffect, useRef } from 'react';

// interface MathPreviewProps {
//   text: string;
//   latex: string;
// }

// // Extend window type for MathJax
// declare global {
//   interface Window {
//     MathJax: any;
//   }
// }

// const loadMathJax = (): Promise<void> => {
//   return new Promise((resolve) => {
//     if (window.MathJax?.typesetPromise) {
//       resolve();
//       return;
//     }

//     window.MathJax = {
//       tex: {
//         inlineMath: [
//           ['$', '$'],
//           ['\\(', '\\)'],
//         ],
//         displayMath: [
//           ['$$', '$$'],
//           ['\\[', '\\]'],
//         ],
//         packages: { '[+]': ['ams', 'boldsymbol'] },
//         tags: 'ams',
//       },
//       options: {
//         skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
//       },
//       startup: {
//         ready() {
//           window.MathJax.startup.defaultReady();
//           resolve();
//         },
//       },
//     };

//     const script = document.createElement('script');
//     script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-chtml.js';
//     script.async = true;
//     document.head.appendChild(script);
//   });
// };

// // const MathPreview = ({ text, latex }: MathPreviewProps) => {
// //   const containerRef = useRef<HTMLDivElement>(null);

// //   useEffect(() => {
// //     if (!containerRef.current) return;

// //     const content = latex || text;

// //     if (!content) {
// //       containerRef.current.innerHTML =
// //         '<span style="color:#9ca3af;font-style:italic">No content</span>';
// //       return;
// //     }

// //     const hasDelimiters =
// //       /\$/.test(content) || /\\\[/.test(content) || /\\\(/.test(content);

// //     const wrapped = hasDelimiters ? content : `\\[${content}\\]`;
// //     containerRef.current.innerHTML = wrapped;

// //     loadMathJax().then(() => {
// //       if (!containerRef.current) return;
// //       // Re-set content and ask MathJax to typeset
// //       containerRef.current.innerHTML = wrapped;
// //       window.MathJax.typesetPromise([containerRef.current]).catch((err: any) =>
// //         console.error('MathJax error:', err),
// //       );
// //     });
// //   }, [text, latex]);

// //   return (
// //     <div
// //       ref={containerRef}
// //       className="math-preview"
// //       style={{ minHeight: '1.5em' }}
// //     />
// //   );
// // };
// // const MathPreview = ({ text, latex }: MathPreviewProps) => {
// //   const containerRef = useRef<HTMLDivElement>(null);

// //   useEffect(() => {
// //     if (!containerRef.current) return;

// //     const raw = latex || text;
// //     if (!raw) {
// //       containerRef.current.innerHTML =
// //         '<span style="color:#9ca3af;font-style:italic">No content</span>';
// //       return;
// //     }

// //     // ✅ Fix: unescape double backslashes from JSON serialization
// //     const content = raw.replace(/\\\\/g, '\\');

// //     const hasDelimiters =
// //       /\$/.test(content) || /\\\[/.test(content) || /\\\(/.test(content);
// //     const wrapped = hasDelimiters ? content : `\\[${content}\\]`;

// //     containerRef.current.innerHTML = wrapped;

// //     loadMathJax().then(() => {
// //       if (!containerRef.current) return;
// //       containerRef.current.innerHTML = wrapped;
// //       window.MathJax.typesetPromise([containerRef.current]).catch((err: any) =>
// //         console.error('MathJax error:', err),
// //       );
// //     });
// //   }, [text, latex]);

// //   return (
// //     <div
// //       ref={containerRef}
// //       className="math-preview"
// //       style={{ minHeight: '1.5em' }}
// //     />
// //   );
// // };

// const MathPreview = ({ text, latex }: MathPreviewProps) => {
//   const containerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (!containerRef.current) return;

//     const raw = latex || text;
//     if (!raw) {
//       containerRef.current.innerHTML =
//         '<span style="color:#9ca3af;font-style:italic">No content</span>';
//       return;
//     }

//     const content = raw.replace(/\\\\/g, '\\');

//     // ✅ Handle \begin{figure}...\end{figure} blocks
//     const figureRegex = /\\begin\{figure\}([\s\S]*?)\\end\{figure\}/g;
//     const imgTagRegex = /\\includegraphics\[.*?\]\{(.*?)\}/;

//     let htmlContent = content;
//     let hasFigure = false;

//     htmlContent = htmlContent.replace(figureRegex, (_, figureBody) => {
//       hasFigure = true;
//       const imgMatch = figureBody.match(imgTagRegex);
//       if (imgMatch) {
//         const src = imgMatch[1];
//         return `<img src="${src}" style="max-width:100%;display:block;margin:auto;" />`;
//       }
//       return ''; // figure block with no image
//     });

//     if (hasFigure) {
//       // Render as HTML directly, no MathJax needed
//       containerRef.current.innerHTML = htmlContent;
//       return;
//     }

//     // ✅ Normal math rendering path
//     const hasDelimiters =
//       /\$/.test(content) || /\\\[/.test(content) || /\\\(/.test(content);
//     const wrapped = hasDelimiters ? content : `\\[${content}\\]`;

//     containerRef.current.innerHTML = wrapped;

//     loadMathJax().then(() => {
//       if (!containerRef.current) return;
//       containerRef.current.innerHTML = wrapped;
//       window.MathJax.typesetPromise([containerRef.current]).catch((err: any) =>
//         console.error('MathJax error:', err),
//       );
//     });
//   }, [text, latex]);

//   return (
//     <div
//       ref={containerRef}
//       className="math-preview"
//       style={{ minHeight: '1.5em' }}
//     />
//   );
// };

// export default MathPreview;

import { useEffect, useRef } from 'react';

interface MathPreviewProps {
  text: string;
  latex: string;
}

declare global {
  interface Window {
    MathJax: any;
    _mathJaxReady: Promise<void> | null;
  }
}

// Singleton promise — MathJax loads only once
const getMathJax = (): Promise<void> => {
  if (window._mathJaxReady) return window._mathJaxReady;

  window._mathJaxReady = new Promise((resolve) => {
    if (window.MathJax?.typesetPromise) {
      resolve();
      return;
    }

    window.MathJax = {
      tex: {
        inlineMath: [
          ['$', '$'],
          ['\\(', '\\)'],
        ],
        displayMath: [
          ['$$', '$$'],
          ['\\[', '\\]'],
        ],
        packages: { '[+]': ['ams', 'boldsymbol'] },
        tags: 'ams',
      },
      options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
      },
      startup: {
        ready() {
          window.MathJax.startup.defaultReady();
          resolve();
        },
      },
    };

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
    script.async = true;
    document.head.appendChild(script);
  });

  return window._mathJaxReady;
};

// Global queue to serialize typeset calls
let typesetQueue = Promise.resolve();

const queueTypeset = (el: HTMLElement, wrapped: string): Promise<void> => {
  typesetQueue = typesetQueue.then(async () => {
    try {
      await getMathJax();
      if (!el.isConnected) return;

      // Clear previous MathJax output before re-rendering
      if (window.MathJax.typesetClear) {
        window.MathJax.typesetClear([el]);
      }

      el.style.visibility = 'hidden';
      el.innerHTML = wrapped; // Re-set AFTER clearing
      await window.MathJax.typesetPromise([el]);
      el.style.visibility = 'visible';
    } catch (err) {
      el.style.visibility = 'visible';
      console.warn('MathJax typeset error:', err);
    }
  });
  return typesetQueue;
};

const MathPreview = ({ text, latex }: MathPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const raw = latex || text;
    if (!raw) {
      el.innerHTML =
        '<span style="color:#9ca3af;font-style:italic">No content</span>';
      return;
    }

    const content = raw.replace(/\\\\/g, '\\');

    // Handle \begin{figure}...\end{figure}
    const figureRegex = /\\begin\{figure\}([\s\S]*?)\\end\{figure\}/g;
    const imgTagRegex = /\\includegraphics\[.*?\]\{(.*?)\}/;
    let hasFigure = false;

    const htmlContent = content.replace(figureRegex, (_, figureBody) => {
      hasFigure = true;
      const imgMatch = figureBody.match(imgTagRegex);
      return imgMatch
        ? `<img src="${imgMatch[1]}" style="max-width:100%;display:block;margin:auto;" />`
        : '';
    });

    if (hasFigure) {
      el.innerHTML = htmlContent;
      return;
    }

    // Normal math path
    // Normal math path
    const hasDelimiters =
      /\$/.test(content) || /\\\[/.test(content) || /\\\(/.test(content);
    const wrapped = hasDelimiters ? content : `\\[${content}\\]`;

    el.innerHTML = wrapped; // initial set
    queueTypeset(el, wrapped); // pass wrapped so it re-sets after clear
  }, [text, latex]);

  return (
    <div
      ref={containerRef}
      className="math-preview"
      style={{ minHeight: '1.5em' }}
    />
  );
};

export default MathPreview;
