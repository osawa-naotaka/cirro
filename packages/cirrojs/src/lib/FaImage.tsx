import { registerIcon } from "cirrojs/registry";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { brands, type FaIcon, faDir, regular, solid } from "./fontawesome";

export type FaImageProps = ComponentPropsWithoutRef<"svg"> & {
    icon: FaIcon;
};

export function FaImage({ icon, ...props }: FaImageProps): ReactNode {
    registerIcon(icon);
    const size = icon.type === "brands" ? brands[icon.name] : icon.type === "regular" ? regular[icon.name] : solid[icon.name];
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${size} 512`} {...props}>
            <title>{`${icon.type}/${icon.name}`}</title>
            <use href={`${faDir}/${icon.type}.svg#${icon.name}`} />
        </svg>
    );
}
