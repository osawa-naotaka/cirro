import { runBuild } from "./runtime/build.ts";
import { runDev } from "./runtime/dev.ts";

// cli.sh（bin ランチャー）から呼ばれるエントリ。args は実行 runtime のパスを除いた引数列。
export async function main(args: string[]): Promise<void> {
    const cmd = args[0];

    if (cmd === "dev") {
        await runDev();
    } else if (cmd === "build") {
        await runBuild();
    } else {
        console.error("usage: cirro <dev|build>");
        process.exit(1);
    }
}
