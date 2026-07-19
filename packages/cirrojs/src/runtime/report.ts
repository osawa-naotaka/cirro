import type { BrokenImageSrc, BrokenLink, ErrorInfo, MissingSite } from "../registry/registry.common";

function reportMissingSite(m: MissingSite) {
    console.log(
        `Site metadata is required by ${m.feature} but is not declared. Declare it with const site = defineSite({ ... }); and pass it to createRouteFn({ site }).`,
    );
}

function reportBrokenLink(link: BrokenLink) {
    switch (link.type) {
        case "malformed":
            console.log(`Link is malformed: "${link.link}". to property of Link must begin with "/" or "#". "//" or "/\\" are not allowed.`);
            break;
        case "not-found":
            console.log(`Link is not found: "${link.link}".`);
            break;
    }
}

function reportBrokenImageSrc(link: BrokenImageSrc) {
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

export function reportErrors(errors: ErrorInfo[]): void {
    if (errors.length === 0) return;
    for (const error of errors) {
        switch (error.cause) {
            case "broken-link":
                reportBrokenLink(error);
                break;
            case "broken-image-src":
                reportBrokenImageSrc(error);
                break;
            case "missing-site":
                reportMissingSite(error);
                break;
        }
    }
}
