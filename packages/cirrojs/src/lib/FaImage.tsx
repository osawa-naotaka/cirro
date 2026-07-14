import { registerIcon } from "cirrojs/registry";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { type FaIcon, faDir } from "./fontawesome.ts";
import { brands } from "./fontawesome-brands.ts";
import { regular } from "./fontawesome-regular.ts";
import { solid } from "./fontawesome-solid.ts";

export type FaImageProps = ComponentPropsWithoutRef<"svg"> & {
    icon: FaIcon;
};

export function FaImage({ icon, ...props }: FaImageProps): ReactNode {
    registerIcon(icon);
    const size = icon.type === "brands" ? brands[icon.name] : icon.type === "regular" ? regular[icon.name] : solid[icon.name];
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${size} 512`} aria-hidden={true} height="1em" {...props}>
            <use href={`${faDir}/${icon.type}.svg#${icon.name}`} />
        </svg>
    );
}
