import { useLayoutEffect, type RefObject } from "react";
import type { TranslationItem } from "../components/ReaderTokenPopup";
import { getExpandedWidth } from "../utils/tokenUtils";

interface UseCentralLayoutProps {
  tokens: string[];
  groups: number[][];
  visualGroupStarts: Map<number, string>;
  groupStarts: Map<number, string>;
  currentPage: number;
  showTranslations: boolean;
  hoveredIndex: number | null;
  hoverTranslation: string | null;
  hoverSource: "token" | "popup" | null;
  textAreaRef: RefObject<HTMLDivElement | null>;
  popupGroups?: Map<number, TranslationItem[]>;
  fontSize?: string;
  font?: string;
}


export const useCentralLayout = ({
  tokens,
  groups,
  visualGroupStarts,
  groupStarts,
  currentPage,
  showTranslations,
  hoveredIndex,
  hoverTranslation,
  hoverSource,
  textAreaRef,
  popupGroups,
  fontSize,
  font,
}: UseCentralLayoutProps) => {
  useLayoutEffect(() => {
    const containerEl = textAreaRef.current;
    if (!containerEl) return;

    let lastWidth = containerEl.getBoundingClientRect().width;

    const calculateLayout = () => {
      const popups = Array.from(
        document.querySelectorAll('[data-popup="true"]'),
      ) as HTMLElement[];
      const tokens = Array.from(
        containerEl.querySelectorAll('[id^="token-"]'),
      ) as HTMLElement[];

      if (popups.length === 0) {
        tokens.forEach((t) => {
          if (t.style.marginTop !== "") t.style.marginTop = "";
        });
        return;
      }

      interface LineInfo {
        y: number;
        tokens: HTMLElement[];
        maxMargin: number;
      }
      const lines: LineInfo[] = [];
      const tokenToLineMap = new Map<HTMLElement, LineInfo>();

      tokens.forEach((tokenEl) => {
        const textWrapper = tokenEl.querySelector(".token-text") || tokenEl;
        const rect = textWrapper.getBoundingClientRect();
        const margin = parseFloat(tokenEl.style.marginTop) || 0;
        const naturalTop = rect.top - margin;
        let line = lines.find((l) => Math.abs(l.y - naturalTop) < 12);
        if (!line) {
          line = { y: naturalTop, tokens: [], maxMargin: 0 };
          lines.push(line);
        }
        line.tokens.push(tokenEl);
        tokenToLineMap.set(tokenEl, line);
      });

      const containerRect = containerEl.getBoundingClientRect();
      const parentEl = containerEl.parentElement;
      const scrollRect = parentEl ? parentEl.getBoundingClientRect() : containerRect;
      const rightEdge = scrollRect.right;
      const leftEdge = scrollRect.left;
      const padding = window.innerWidth <= 1200 ? 8 : 16;


      popups.forEach((popupEl) => {
        const indexStr = popupEl.getAttribute("data-index");
        if (!indexStr) return;
        const globalIndex = parseInt(indexStr, 10);

        const tokenEl = popupEl.parentElement;
        if (!tokenEl) return;

        const myLine = tokenToLineMap.get(tokenEl);
        const textWrapper = tokenEl.querySelector(".token-text") || tokenEl;
        const tokenRect = textWrapper.getBoundingClientRect();
        const tokenElLeft = tokenEl.getBoundingClientRect().left; // Where left:0 actually anchors
        const targetLeft = tokenRect.left;
        let targetRight = tokenRect.right;

        // Center combined popup groups over their entire span of tokens on the same line
        const items = popupGroups?.get(globalIndex);
        const anchorIndices = items && items.length > 0
          ? items.map((it) => it.globalIndex)
          : [globalIndex];

        const indicesToTry = anchorIndices
          .map((idx) => {
            const g = groups.find((gr) => gr.includes(idx));
            return g ? g[g.length - 1] : idx;
          })
          .reverse();

        for (const lastIdx of indicesToTry) {
          const el = document.getElementById(`token-${lastIdx}`);
          if (el && tokenToLineMap.get(el) === myLine) {
            const w = el.querySelector(".token-text") || el;
            targetRight = w.getBoundingClientRect().right;
            break;
          }
        }


        const popupRect = popupEl.getBoundingClientRect();
        const popupHeight = popupRect.height;
        const fallbackText =
          visualGroupStarts.get(globalIndex) ||
          groupStarts.get(globalIndex) ||
          hoverTranslation ||
          "";
        const clampWidth = getExpandedWidth(items, fallbackText);
        const popupWidth = popupRect.width > 0 ? popupRect.width : clampWidth;

        // Center the popup over the text span
        let desiredLeft = (targetLeft + targetRight) / 2 - popupWidth / 2;

        // Clamp to container edges
        if (desiredLeft < leftEdge + padding) {
          desiredLeft = leftEdge + padding;
        } else if (desiredLeft + popupWidth > rightEdge - padding) {
          desiredLeft = rightEdge - padding - popupWidth;
        }

        // Offset from where left:0 actually places the popup (tokenEl's left edge)
        const offset = desiredLeft - tokenElLeft;

        popupEl.style.left = "0";
        popupEl.style.transform = `translateX(${offset}px)`;
        popupEl.style.bottom = ""; // Reset custom bottom offsets, rely on default CSS (120%)

        if (!popupEl.className.includes("hoverPopup") && myLine) {
          const h = popupHeight > 0 ? popupHeight : 30;
          myLine.maxMargin = Math.max(myLine.maxMargin, h + 30);
        }
      });

      lines.forEach((line) => {
        const marginStr = line.maxMargin > 0 ? `${line.maxMargin}px` : "";
        line.tokens.forEach((tokenEl) => {
          if (tokenEl.style.marginTop !== marginStr) {
            tokenEl.style.marginTop = marginStr;
          }
        });
      });
    };

    calculateLayout();

    window.addEventListener("resize", calculateLayout);
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === containerEl) {
          const currentWidth = entry.contentRect.width;
          if (Math.abs(currentWidth - lastWidth) >= 1) {
            lastWidth = currentWidth;
            calculateLayout();
          }
        }
      }
    });

    resizeObserver.observe(containerEl);

    return () => {
      window.removeEventListener("resize", calculateLayout);
      resizeObserver.disconnect();
    };
  }, [
    tokens, groups, visualGroupStarts, groupStarts, currentPage,
    showTranslations, hoveredIndex, hoverTranslation, hoverSource,
    textAreaRef, popupGroups, fontSize, font
  ]);
};

