import { Node, mergeAttributes } from "@tiptap/core";

export type CalloutType = "summary" | "keypoints" | "questions";

export interface CalloutOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attributes?: { type: CalloutType }) => ReturnType;
      toggleCallout: (attributes?: { type: CalloutType }) => ReturnType;
      unsetCallout: () => ReturnType;
    };
  }
}

/**
 * Custom TipTap Node Extension for Rich Callout Blocks:
 * 1. সারসংক্ষেপ (Summary) - Amber / Gold Accent
 * 2. গুরুত্বপূর্ণ পয়েন্টসমূহ (Key Points) - Indigo / Purple Accent
 * 3. গুরুত্বপূর্ণ প্রশ্নসমূহ (Important Questions) - Emerald / Matrix Accent
 */
export const CalloutBlock = Node.create<CalloutOptions>({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      type: {
        default: "summary",
        parseHTML: (element) => element.getAttribute("data-callout-type") || "summary",
        renderHTML: (attributes) => ({
          "data-callout-type": attributes.type,
          class: `callout-block callout-${attributes.type}`,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-callout-type]",
      },
      {
        tag: "div.callout-block",
        getAttrs: (node) => {
          if (typeof node === "string") return false;
          const element = node as HTMLElement;
          let type: CalloutType = "summary";
          if (element.classList?.contains("callout-keypoints")) type = "keypoints";
          else if (element.classList?.contains("callout-questions")) type = "questions";
          return { type };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setCallout:
        (attributes) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attributes);
        },
      toggleCallout:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, attributes);
        },
      unsetCallout:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
    };
  },
});
