import type { BrokenImageSrc, BrokenLink, ErrorInfo, IslandError, IslandPropsError, MarkdownRef, MissingSite } from "../registry/registry.common";

function reportMarkdownRef(e: MarkdownRef) {
    switch (e.type) {
        case "malformed":
            console.log(
                `Markdown ${e.attr}="${e.ref}" is malformed. In-site references must be root-relative ("/...") or an anchor ("#..."); ` +
                    "relative paths are not supported because content location is decoupled from the URL structure.",
            );
            break;
        case "not-found":
            console.log(`Markdown ${e.attr}="${e.ref}" is not found on this site.`);
            break;
    }
}

function reportIslandError(e: IslandError) {
    switch (e.type) {
        case "not-configured":
            console.log(
                `Island "${e.island}" was rendered but the islands option is not set; nothing will hydrate. ` +
                    'Add cirro({ islands: "./src/islands/registry.ts" }) to vite.config.',
            );
            break;
        case "unknown-name":
            console.log(
                `Island "${e.island}" is not a key of the islands registry configured in cirro({ islands }); ` +
                    "the client mounter will silently skip it. The registry passed to createIsland() and the one in vite.config must be the same module.",
            );
            break;
    }
}

function reportIslandPropsError(e: IslandPropsError) {
    console.log(
        `Island "${e.island}": ${e.path} is not JSON-serializable (${e.kind}); ` +
            "it will be lost or altered when passed to the client via data-props and can break hydration.",
    );
}

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
            case "island":
                reportIslandError(error);
                break;
            case "island-props":
                reportIslandPropsError(error);
                break;
            case "markdown-ref":
                reportMarkdownRef(error);
                break;
        }
    }
}
