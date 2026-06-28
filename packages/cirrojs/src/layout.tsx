import type { ComponentPropsWithoutRef, ReactNode } from "react";
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
    clusterWrap?: Properties["flex_wrap"];
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
    // sidebar の従（sidebar）のインライン幅（この値で固定されます）。
    sidebarSideWidth: string;
    // cover の最小ブロックサイズ（高さ）。
    coverMinHeight: string;
    // frame のアスペクト比（"幅 / 高さ" の文字列）。
    frameRatio: string;
    // box の既定 padding。未設定なら gap を使う。
    boxPadding?: string;
}

const DEFAULTS: LayoutDefaults = {
    gap: "1rem",
    clusterJustify: "flex-start",
    clusterAlign: "center",
    centerMax: "60ch",
    gridMin: "16rem",
    switcherThreshold: "30rem",
    switcherLimit: 4,
    sidebarContentMin: "65ch",
    sidebarSideWidth: "30ch",
    coverMinHeight: "100vh",
    frameRatio: "16 / 9",
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

// cover は「縦方向に中央寄せする 1 要素」を消費側が指定する必要があるため、クラスの束を返す（方式B）。
// centered を当てた子は上下 auto マージンで中央に置かれ、その他の子は gap で等間隔に並ぶ。
export interface CoverSlots {
    root: string;
    centered: string;
}

export interface StackOpt {
    gap?: string;
}

export interface ClusterOpt {
    gap?: string;
    wrap?: Properties["flex_wrap"];
    justify?: Properties["justify_content"];
    align?: Properties["align_items"];
}

export interface CenterOpt {
    max?: string;
    gutters?: string;
    intrinsic?: boolean;
    andText?: boolean;
}

export interface GridOpt {
    gap?: string;
    min?: string;
}

export interface SwitcherOpt {
    threshold?: string;
    gap?: string;
    limit?: number;
}

export interface SidebarOpt {
    sideWidth?: string;
    contentMin?: string;
    gap?: string;
}

export interface CoverOpt {
    minHeight?: string;
    gap?: string;
    padding?: string;
}

export interface FrameOpt {
    ratio?: string;
}

export interface ReelOpt {
    itemWidth?: string;
    height?: string;
    gap?: string;
}

export interface ImposterOpt {
    fixed?: boolean;
    contain?: boolean;
    margin?: string;
}

export interface BoxOpt {
    padding?: string;
    border?: string;
}

// レイアウト用コンポーネント（Stack 等）が受け取る要素属性。div の標準属性をそのまま受けつつ、
// インライン style は除外する（style-src 'self' を破る穴を型で塞ぐ）。className / children は含まれる。
export type ElementOpt = Omit<ComponentPropsWithoutRef<"div">, "style">;

export interface Layout {
    stack(opts?: StackOpt): string;
    cluster(opts?: ClusterOpt): string;
    center(opts?: CenterOpt): string;
    grid(opts?: GridOpt): string;
    switcher(opts?: SwitcherOpt): string;
    sidebar(opts?: SidebarOpt): SidebarSlots;
    cover(opts?: CoverOpt): CoverSlots;
    frame(opts?: FrameOpt): string;
    reel(opts?: ReelOpt): string;
    imposter(opts?: ImposterOpt): string;
    box(opts?: BoxOpt): string;

    // 純レイアウト目的の div を返すコンポーネント版（単一クラス系のみ）。意図が読みやすい場所で使う。
    // セマンティック要素（ul / nav / section …）には対応する小文字の関数で className を当てる。
    Stack(props?: StackOpt & ElementOpt): ReactNode;
    Cluster(props?: ClusterOpt & ElementOpt): ReactNode;
    Center(props?: CenterOpt & ElementOpt): ReactNode;
    Grid(props?: GridOpt & ElementOpt): ReactNode;
    Switcher(props?: SwitcherOpt & ElementOpt): ReactNode;
    Frame(props?: FrameOpt & ElementOpt): ReactNode;
    Reel(props?: ReelOpt & ElementOpt): ReactNode;
    Imposter(props?: ImposterOpt & ElementOpt): ReactNode;
    Box(props?: BoxOpt & ElementOpt): ReactNode;
}

// 複数クラス名を結合する（falsy は除外）。
export function cx(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(" ");
}

// ============================================================
// createLayout
// ============================================================

export function createLayout(theme: LayoutTheme = {}): Layout {
    const css = theme.css ?? genCssFn({ layer: "low" });
    const d = { ...DEFAULTS, ...theme.defaults };

    // Stack — 縦積み。flex column + gap で隣接間に等間隔の余白を入れる。
    function stack(opts?: StackOpt): string {
        return css({ display: "flex", flex_direction: "column", gap: opts?.gap ?? d.stackGap ?? d.gap }, { name: "stack" });
    }

    // Cluster — 折り返す横並び。要素間は gap が所有する。
    function cluster(opts?: ClusterOpt): string {
        return css(
            {
                display: "flex",
                flex_wrap: opts?.wrap ?? d.clusterWrap ?? "wrap",
                gap: opts?.gap ?? d.clusterGap ?? d.gap,
                justify_content: opts?.justify ?? d.clusterJustify,
                align_items: opts?.align ?? d.clusterAlign,
            },
            { name: "cluster" },
        );
    }

    // Center — 中央寄せ＋最大幅。intrinsic で中身も中央寄せ、andText で文字も中央寄せ。
    function center(opts?: CenterOpt): string {
        return cx(
            css({ box_sizing: "border-box", margin_inline: "auto", max_inline_size: opts?.max ?? d.centerMax }, { name: "center" }),
            opts?.gutters ? css({ padding_inline: opts.gutters }, { name: "center-gutters" }) : "",
            opts?.intrinsic ? css({ display: "flex", flex_direction: "column", align_items: "center" }, { name: "center-intrinsic" }) : "",
            opts?.andText ? css({ text_align: "center" }, { name: "center-andText" }) : "",
        );
    }

    // Grid — auto-fit による自動段組。トラック最小幅を下回ると段数が減る。メディアクエリ不要。
    function grid(opts?: GridOpt): string {
        const min = opts?.min ?? d.gridMin;
        return css(
            {
                display: "grid",
                gap: opts?.gap ?? d.gridGap ?? d.gap,
                grid_template_columns: `repeat(auto-fit, minmax(min(${min}, 100%), 1fr))`,
            },
            { name: "grid" },
        );
    }

    // Switcher — 閾値で横並び↔縦積みを切り替える。flex-basis の calc により内在的にレスポンシブ。
    // 要素数が limit を超えたら（nth-last-child）強制的に縦積みへ倒す。
    function switcher(opts?: SwitcherOpt): string {
        const threshold = opts?.threshold ?? d.switcherThreshold;
        const limit = opts?.limit ?? d.switcherLimit;
        return cx(
            css({ display: "flex", flex_wrap: "wrap", gap: opts?.gap ?? d.switcherGap ?? d.gap }, { name: "switcher" }),
            css({ flex_grow: "1", flex_basis: `calc((${threshold} - 100%) * 999)` }, { selector: "& > *", name: "switcher-item" }),
            css(
                { flex_basis: "100%" },
                {
                    selector: `& > :nth-last-child(n+${limit + 1})`,
                    name: "switcher-item-last",
                },
            ),
            css(
                { flex_basis: "100%" },
                {
                    selector: `& > :nth-last-child(n+${limit + 1}) ~ *`,
                    name: "switcher-item-last-child",
                },
            ),
        );
    }

    // Sidebar — 主従 2 カラム。従（side）は内容なりまたは固定幅、主（content）は伸びて折り返す。
    // 主従の指定は消費側がスロットを当てて行う（方式B）。左右は DOM の並び順で決まる。
    function sidebar(opts?: SidebarOpt): SidebarSlots {
        return {
            root: css({ display: "flex", flex_wrap: "wrap", gap: opts?.gap ?? d.sidebarGap ?? d.gap }, { name: "sidebar" }),
            side: css({ flex_grow: "1", flex_basis: opts?.sideWidth ?? d.sidebarSideWidth ?? "auto" }, { name: "sidebar-side" }),
            content: css(
                {
                    flex_grow: "999",
                    flex_basis: "0",
                    min_inline_size: opts?.contentMin ?? d.sidebarContentMin,
                },
                { name: "sidebar-content" },
            ),
        };
    }

    // Cover — 縦方向の中央寄せ。最小高さを確保し、centered を当てた子を上下中央へ、
    // それ以外の子は gap で等間隔に並べる。中央寄せ対象は消費側がスロットで指定する（方式B）。
    function cover(opts?: CoverOpt): CoverSlots {
        const gap = opts?.gap ?? d.gap;
        // 中央寄せ対象の子（自身の上下 auto マージンで中央に置く）。
        const centered = css({ margin_block: "auto" }, { name: "cover-centered" });
        return {
            root: cx(
                css(
                    {
                        display: "flex",
                        flex_direction: "column",
                        min_block_size: opts?.minHeight ?? d.coverMinHeight,
                        padding: opts?.padding ?? gap,
                    },
                    { name: "cover" },
                ),
                // centered 以外の子に縦の余白を入れる（centered には触れない）。
                css({ margin_block: gap }, { selector: `& > :not(.${centered})`, name: "cover-gap" }),
                css({ margin_block_start: "0" }, { selector: `& > :first-child:not(.${centered})`, name: "cover-gap-first" }),
                css({ margin_block_end: "0" }, { selector: `& > :last-child:not(.${centered})`, name: "cover-gap-last" }),
            ),
            centered,
        };
    }

    // Frame — アスペクト比を固定し、中身（img/video）を切り抜いて全面に敷く。
    function frame(opts?: FrameOpt): string {
        return cx(
            css(
                {
                    aspect_ratio: opts?.ratio ?? d.frameRatio,
                    overflow: "hidden",
                    display: "flex",
                    justify_content: "center",
                    align_items: "center",
                },
                { name: "frame" },
            ),
            css({ inline_size: "100%", block_size: "100%", object_fit: "cover" }, { selector: "& > img, & > video", name: "frame-img" }),
        );
    }

    // Reel — 横スクロールの帯。子は縮まず（flex 0 0）横に並び、はみ出した分はスクロールする。
    function reel(opts?: ReelOpt): string {
        return cx(
            css(
                {
                    display: "flex",
                    block_size: opts?.height ?? "auto",
                    overflow_x: "auto",
                    overflow_y: "hidden",
                    gap: opts?.gap ?? d.gap,
                },
                { name: "reel" },
            ),
            css({ flex: `0 0 ${opts?.itemWidth ?? "auto"}` }, { selector: "& > *", name: "reel-child" }),
            css({ block_size: "100%", flex_basis: "auto", inline_size: "auto" }, { selector: "& > img", name: "reel-img" }),
        );
    }

    // Imposter — 位置決め済みの親（position: relative 等）の中央へ絶対配置で重ねる。
    // contain を付けると親をはみ出さないよう最大サイズを制限し、内部はスクロールさせる。
    function imposter(opts?: ImposterOpt): string {
        const margin = opts?.margin ?? "0px";
        return cx(
            css(
                {
                    position: opts?.fixed ? "fixed" : "absolute",
                    inset_block_start: "50%",
                    inset_inline_start: "50%",
                    transform: "translate(-50%, -50%)",
                },
                { name: "imposter" },
            ),
            opts?.contain
                ? css(
                      {
                          overflow: "auto",
                          max_inline_size: `calc(100% - (${margin} * 2))`,
                          max_block_size: `calc(100% - (${margin} * 2))`,
                      },
                      { name: "imposter-contain" },
                  )
                : "",
        );
    }

    // Box — padding を持つ枠。border は既定で出さない（線なし・色なし）。指定する場合は
    // border ショートハンド（色を含む）を直接渡す。box-sizing: border-box でサイズを予測可能にする。
    function box(opts?: BoxOpt): string {
        return cx(
            css({ box_sizing: "border-box", padding: opts?.padding ?? d.boxPadding ?? d.gap }, { name: "box" }),
            opts?.border ? css({ border: opts.border }, { name: "box-border" }) : "",
        );
    }

    // ============================================================
    // コンポーネント版（単一クラス系のみ）— 純レイアウト目的の div を返す。
    // 各々レイアウト用 opts を分離し、残りの div 属性（style 除外済み）を div へ spread する。
    // ============================================================

    function Stack({ gap, className, children, ...rest }: StackOpt & ElementOpt = {}): ReactNode {
        return (
            <div className={cx(stack({ gap }), className)} {...rest}>
                {children}
            </div>
        );
    }

    function Cluster({ gap, wrap, justify, align, className, children, ...rest }: ClusterOpt & ElementOpt = {}): ReactNode {
        return (
            <div className={cx(cluster({ gap, wrap, justify, align }), className)} {...rest}>
                {children}
            </div>
        );
    }

    function Center({ max, gutters, intrinsic, andText, className, children, ...rest }: CenterOpt & ElementOpt = {}): ReactNode {
        return (
            <div className={cx(center({ max, gutters, intrinsic, andText }), className)} {...rest}>
                {children}
            </div>
        );
    }

    function Grid({ gap, min, className, children, ...rest }: GridOpt & ElementOpt = {}): ReactNode {
        return (
            <div className={cx(grid({ gap, min }), className)} {...rest}>
                {children}
            </div>
        );
    }

    function Switcher({ threshold, gap, limit, className, children, ...rest }: SwitcherOpt & ElementOpt = {}): ReactNode {
        return (
            <div className={cx(switcher({ threshold, gap, limit }), className)} {...rest}>
                {children}
            </div>
        );
    }

    function Frame({ ratio, className, children, ...rest }: FrameOpt & ElementOpt = {}): ReactNode {
        return (
            <div className={cx(frame({ ratio }), className)} {...rest}>
                {children}
            </div>
        );
    }

    function Reel({ itemWidth, height, gap, className, children, ...rest }: ReelOpt & ElementOpt = {}): ReactNode {
        return (
            <div className={cx(reel({ itemWidth, height, gap }), className)} {...rest}>
                {children}
            </div>
        );
    }

    function Imposter({ fixed, contain, margin, className, children, ...rest }: ImposterOpt & ElementOpt = {}): ReactNode {
        return (
            <div className={cx(imposter({ fixed, contain, margin }), className)} {...rest}>
                {children}
            </div>
        );
    }

    function Box({ padding, border, className, children, ...rest }: BoxOpt & ElementOpt = {}): ReactNode {
        return (
            <div className={cx(box({ padding, border }), className)} {...rest}>
                {children}
            </div>
        );
    }

    return {
        stack,
        cluster,
        center,
        grid,
        switcher,
        sidebar,
        cover,
        frame,
        reel,
        imposter,
        box,
        Stack,
        Cluster,
        Center,
        Grid,
        Switcher,
        Frame,
        Reel,
        Imposter,
        Box,
    };
}
