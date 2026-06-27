import { type CssFnT, genCssFn } from "./css.ts";
import type { Properties } from "./properties.ts";

// Every Layout（every-layout.dev）のレイアウトプリミティブを「意図で名付けた型付き関数」として提供する。
// 各関数は呼び出すたびに css() を実行し、決定的なクラス名（の束）を返す（recipe と同じ形）。
//
// 設計方針:
// - 値はすべて単位付きの文字列で受け取る（基本単位 rem）。space スケールの段数注入はしない。
// - 既定値はユーザーが createLayout({ defaults }) で上書きできる（DI）。recipe のロジックは
//   cirro が所有し、デフォルトの起点だけをユーザーへ開放する。
// - 出力先は既定で @layer low。component レシピ（button 等＝@layer main）より下に置くことで、
//   component 側が常に layout を上書きできる正しいカスケードになる。
// - 配置の軸は要素非依存（& > * 系セレクタ）に保ち、single-owner-per-property を守る。

// ============================================================
// テーマ / デフォルト
// ============================================================

export interface LayoutDefaults {
    // 大本の gap。各プリミティブ個別の gap が未設定ならこれにフォールバックする。
    gap: string;
    // プリミティブ個別の gap。未設定なら gap を使う。
    stackGap?: string;
    clusterGap?: string;
    gridGap?: string;
    switcherGap?: string;
    sidebarGap?: string;
    // cluster の整列。
    clusterJustify: Properties["justify_content"];
    clusterAlign: Properties["align_items"];
    // center の最大インライン幅（測度。space スケール外）。
    centerMax: string;
    // grid の各トラックの最小幅（これを下回ると段数が減る）。
    gridMin: string;
    // switcher が縦積みへ切り替わる閾値幅、および横並びを許す最大要素数。
    switcherThreshold: string;
    switcherLimit: number;
    // sidebar の主（content）の最小インライン幅（これを下回ると折り返す）。
    sidebarContentMin: string;
}

const DEFAULTS: LayoutDefaults = {
    gap: "1rem",
    clusterJustify: "flex-start",
    clusterAlign: "center",
    centerMax: "60ch",
    gridMin: "16rem",
    switcherThreshold: "30rem",
    switcherLimit: 4,
    sidebarContentMin: "50%",
};

export interface LayoutTheme {
    // 出力先 css 関数。省略時は @layer low。ユーザーがレイヤーを制御したい場合に差し替える。
    css?: CssFnT;
    // 既定値の部分上書き。
    defaults?: Partial<LayoutDefaults>;
}

// sidebar は主従の 2 要素それぞれに別スタイルを当てるため、クラス名の束を返す（方式B＝型付きスロット）。
// 消費側が root / side / content を各要素へ明示的に当てる。視覚的な左右は DOM の並び順で決まる。
export interface SidebarSlots {
    root: string;
    side: string;
    content: string;
}

export interface Layout {
    stack(opts?: { gap?: string }): string;
    cluster(opts?: { gap?: string; justify?: Properties["justify_content"]; align?: Properties["align_items"] }): string;
    center(opts?: { max?: string; gutters?: string; intrinsic?: boolean; andText?: boolean }): string;
    grid(opts?: { gap?: string; min?: string }): string;
    switcher(opts?: { threshold?: string; gap?: string; limit?: number }): string;
    sidebar(opts?: { sideWidth?: string; contentMin?: string; gap?: string }): SidebarSlots;
}

// 複数クラス名を結合する（falsy は除外）。
function cx(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(" ");
}

// ============================================================
// createLayout
// ============================================================

export function createLayout(theme: LayoutTheme = {}): Layout {
    const css = theme.css ?? genCssFn({ layer: "low" });
    const d = { ...DEFAULTS, ...theme.defaults };

    // Stack — 縦積み。flex column + gap で隣接間に等間隔の余白を入れる。
    function stack(opts?: { gap?: string }): string {
        return css({ display: "flex", flex_direction: "column", gap: opts?.gap ?? d.stackGap ?? d.gap });
    }

    // Cluster — 折り返す横並び。要素間は gap が所有する。
    function cluster(opts?: { gap?: string; justify?: Properties["justify_content"]; align?: Properties["align_items"] }): string {
        return css({
            display: "flex",
            flex_wrap: "wrap",
            gap: opts?.gap ?? d.clusterGap ?? d.gap,
            justify_content: opts?.justify ?? d.clusterJustify,
            align_items: opts?.align ?? d.clusterAlign,
        });
    }

    // Center — 中央寄せ＋最大幅。intrinsic で中身も中央寄せ、andText で文字も中央寄せ。
    function center(opts?: { max?: string; gutters?: string; intrinsic?: boolean; andText?: boolean }): string {
        return cx(
            css({ box_sizing: "border-box", margin_inline: "auto", max_inline_size: opts?.max ?? d.centerMax }),
            opts?.gutters ? css({ padding_inline: opts.gutters }) : "",
            opts?.intrinsic ? css({ display: "flex", flex_direction: "column", align_items: "center" }) : "",
            opts?.andText ? css({ text_align: "center" }) : "",
        );
    }

    // Grid — auto-fit による自動段組。トラック最小幅を下回ると段数が減る。メディアクエリ不要。
    function grid(opts?: { gap?: string; min?: string }): string {
        const min = opts?.min ?? d.gridMin;
        return css({
            display: "grid",
            gap: opts?.gap ?? d.gridGap ?? d.gap,
            grid_template_columns: `repeat(auto-fit, minmax(min(${min}, 100%), 1fr))`,
        });
    }

    // Switcher — 閾値で横並び↔縦積みを切り替える。flex-basis の calc により内在的にレスポンシブ。
    // 要素数が limit を超えたら（nth-last-child）強制的に縦積みへ倒す。
    function switcher(opts?: { threshold?: string; gap?: string; limit?: number }): string {
        const threshold = opts?.threshold ?? d.switcherThreshold;
        const limit = opts?.limit ?? d.switcherLimit;
        return cx(
            css({ display: "flex", flex_wrap: "wrap", gap: opts?.gap ?? d.switcherGap ?? d.gap }),
            css({ flex_grow: "1", flex_basis: `calc((${threshold} - 100%) * 999)` }, { selector: "& > *" }),
            css({ flex_basis: "100%" }, { selector: `& > :nth-last-child(n+${limit + 1})` }),
            css({ flex_basis: "100%" }, { selector: `& > :nth-last-child(n+${limit + 1}) ~ *` }),
        );
    }

    // Sidebar — 主従 2 カラム。従（side）は内容なりまたは固定幅、主（content）は伸びて折り返す。
    // 主従の指定は消費側がスロットを当てて行う（方式B）。左右は DOM の並び順で決まる。
    function sidebar(opts?: { sideWidth?: string; contentMin?: string; gap?: string }): SidebarSlots {
        return {
            root: css({ display: "flex", flex_wrap: "wrap", gap: opts?.gap ?? d.sidebarGap ?? d.gap }),
            side: css({ flex_grow: "1", flex_basis: opts?.sideWidth ?? "auto" }),
            content: css({
                flex_grow: "999",
                flex_basis: "0",
                min_inline_size: opts?.contentMin ?? d.sidebarContentMin,
            }),
        };
    }

    return { stack, cluster, center, grid, switcher, sidebar };
}
