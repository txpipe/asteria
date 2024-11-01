declare module "*.mdx" {
  import type { ComponentProps, ComponentType } from "react";
  const component: ComponentType;
  export default component;
}
