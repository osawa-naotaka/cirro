import { brands } from "./fontawesome-brands.ts";
import { regular } from "./fontawesome-regular.ts";
import { solid } from "./fontawesome-solid.ts";

export const faDir = "/fa";

export type IconType = "brands" | "solid" | "regular";

export type BrandsIconName = keyof typeof brands;

export type BrandsIcon = {
    type: "brands";
    name: BrandsIconName;
};

export type SolidIconName = keyof typeof solid;

export type SolidIcon = {
    type: "solid";
    name: SolidIconName;
};

export type RegularIconName = keyof typeof regular;

export type RegularIcon = {
    type: "regular";
    name: RegularIconName;
};

export type FaIcon = BrandsIcon | SolidIcon | RegularIcon;

export const allowed_icon_names = {
    brands: new Set<string>(Object.keys(brands)),
    solid: new Set<string>(Object.keys(solid)),
    regular: new Set<string>(Object.keys(regular)),
} as const;
