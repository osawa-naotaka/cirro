export function Page({ params }: { params: { slug?: string } }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <title>page</title>
            </head>
            <body>{params.slug ?? "page"}</body>
        </html>
    );
}
