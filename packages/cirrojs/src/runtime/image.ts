import type { BrokenImageSrc } from "../registry/registry.common";

export function reportBrokenImageSrc(brokenImageSrc: BrokenImageSrc[]) {
    for (const link of brokenImageSrc) {
        switch (link.type) {
            case "malformed":
                console.log(`Image is malformed: "${link.from}". from property of Image must begin with "/" or ":" or "(package name):".`);
                break;
            case "unsupported":
                console.log(`Unsupported image source: "${link.from}".`);
                break;
            case "not-found":
                console.log(`Image is not found: "${link.from}".`);
                break;
            case "not-exist":
                console.log(`Icon is not found: "${link.from}".`);
                break;
        }
    }
}
