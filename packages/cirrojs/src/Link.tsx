import { checkLink } from "cirrojs/registry";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type LinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
    to: string;
};

export function Link({ to, children, ...rest }: LinkProps): ReactNode {
    checkLink(to);
    return (
        <a {...rest} href={to}>
            {children}
        </a>
    );
}
