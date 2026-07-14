import { checkImage } from "cirrojs/registry";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type ImageProps = Omit<ComponentPropsWithoutRef<"img">, "src"> & {
    from: string;
};

export function Image({ from, alt, ...rest }: ImageProps): ReactNode {
    const src = checkImage(from);
    return src ? <img {...rest} alt={alt} src={src} /> : <img {...rest} alt={alt} />;
}
