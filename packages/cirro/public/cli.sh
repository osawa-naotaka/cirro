#!/usr/bin/env bash

runtime=""
script_args=()

# 引数をループして実行環境とその他の引数を分離
for arg in "$@"; do
    case "$arg" in
        --bun)  runtime="bun" ;;
        --node) runtime="node" ;;
        --deno) runtime="deno" ;;
        *)      script_args+=("$arg") ;;
    esac
done

# 実行環境が指定されていない場合、自動検出（優先順位: bun -> node -> deno）
if [ -z "$runtime" ]; then
    if command -v bun &> /dev/null; then
        runtime="bun"
    elif command -v node &> /dev/null; then
        runtime="node"
    elif command -v deno &> /dev/null; then
        runtime="deno"
    else
        echo "Error: No JavaScript runtime found (bun, node, or deno)" >&2
        exit 1
    fi
fi

case "$runtime" in
    bun)
        exec bun -e='import { main } from "cirro/bin"; await main(process.argv.slice(1));' "${script_args[@]}"
        ;;
    node)
        exec node --eval 'import { main } from "cirro/bin"; await main(process.argv.slice(1));' "${script_args[@]}"
        ;;
    deno)
        exec deno eval 'import { main } from "cirro/bin"; await main(process.argv.slice(2));' "${script_args[@]}"
        ;;
esac
