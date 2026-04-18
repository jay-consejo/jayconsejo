import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          "agent-id": string;
          "dynamic-variables"?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
