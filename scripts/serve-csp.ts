// 検証用: dist を厳格な CSP ヘッダ付きで配信する簡易サーバ。
// `unsafe-inline` / `unsafe-eval` を含まない CSP で島が動くことを確認するために使う。
const csp = "default-src 'self'; script-src 'self'; style-src 'self'";
const port = 8787;

Bun.serve({
    port,
    async fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname === "/" ? "/index.html" : url.pathname;
        const file = Bun.file(`dist${path}`);
        if (!(await file.exists())) return new Response("not found", { status: 404 });
        return new Response(file, { headers: { "Content-Security-Policy": csp } });
    },
});

console.log(`serving dist on http://localhost:${port}`);
console.log(`CSP: ${csp}`);
