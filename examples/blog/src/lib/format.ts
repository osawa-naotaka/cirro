// 日付文字列（"2026-05-01" 等）を日本語表記に整形する。
// 不正な値はそのまま返す（ビルドを止めない）。
export function formatDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
