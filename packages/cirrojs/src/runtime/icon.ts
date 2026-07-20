import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { faDir } from "../lib/fontawesome.ts";
import type { Registry } from "../registry/registry.common.ts";

// FA スプライトを読み込み、配信可能な形へ整えて返す（dev の合成ルートと build のコピーで共有）。
//
// FA のスプライトはルート <svg> に style="display: none;" を持つ（HTML へのインライン埋め込み
// 利用を想定した属性）。<use> 参照で複製されるのは <symbol> のサブツリーだけなので動作には
// 無関係だが、「生成物にインラインスタイルを含めない」保証（15_TESTING.md）を守るため、
// ルートの style 属性のみ除去して配信する。除去後にも style= が残る場合（FA のフォーマット
// 変更で symbol 側に style が現れた場合）は、加工方針の再検討が必要なため throw する。
export function loadSprite(type: string): string {
    const require = createRequire(import.meta.url);
    const path = require.resolve(`@fortawesome/fontawesome-free/sprites/${type}.svg`);
    const svg = readFileSync(path, "utf-8");

    const start = svg.indexOf("<svg");
    if (start < 0) throw new Error(`cirro: unexpected sprite format (no <svg> root): ${path}`);
    const end = svg.indexOf(">", start);
    const rootTag = svg.slice(start, end).replace(/\s+style="[^"]*"/, "");
    const cleaned = svg.slice(0, start) + rootTag + svg.slice(end);

    if (cleaned.includes("style=")) {
        throw new Error(`cirro: sprite still contains style attribute after sanitization: ${path}`);
    }
    return cleaned;
}

export function bundleIcon(registry: Registry, outDir: string): void {
    const types = new Set(registry.icon.values().map((e) => e.split("/")[0]));

    for (const t of types) {
        const url = join(faDir, `${t}.svg`);
        const filePath = join(outDir, url);

        mkdirSync(dirname(filePath), { recursive: true });
        writeFileSync(filePath, loadSprite(t));
        console.log(`wrote ${filePath} (url: ${url})`);
    }
}
