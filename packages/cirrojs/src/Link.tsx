import { checkLink } from "cirrojs/registry";
import type { ReactNode } from "react";

export function Link(props: { to: string; className?: string; children?: ReactNode }): ReactNode {
    checkLink(props.to);
    return (
        <a href={props.to} className={props.className}>
            {props.children}
        </a>
    );
}
