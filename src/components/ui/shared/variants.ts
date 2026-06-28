import { cn } from "@/utils";

type VariantConfig = Record<string, Record<string, string>>;

export function createVariants<V extends VariantConfig>(
  base: string,
  variants: V,
) {
  return (
    props: {
      [K in keyof V]?: keyof V[K] & string | null | undefined;
    } & { className?: string },
  ): string => {
    const resolved = [base];

    for (const key of Object.keys(variants) as (keyof V)[]) {
      const value = props[key];
      const variantGroup = variants[key];
      if (value != null && variantGroup) {
        const className = variantGroup[value as string];
        if (className) {
          resolved.push(className);
        }
      }
    }

    if (props.className) {
      resolved.push(props.className);
    }

    return cn(...resolved);
  };
}
