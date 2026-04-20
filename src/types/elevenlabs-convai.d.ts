import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          "agent-id"?: string;
          "signed-url"?: string;
          "dynamic-variables"?: string;
          variant?: string;
          placement?: string;
          "default-expanded"?: string;
          "always-expanded"?: string;
          dismissible?: string;
          "override-config"?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
