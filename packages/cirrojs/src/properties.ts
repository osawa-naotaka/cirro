export type PropertyName = (typeof property_names)[number];

export const property_names = [
    "accent_color",
    "align_content",
    "align_items",
    "align_self",
    "alignment_baseline",
    "all",
    "anchor_name",
    "animation",
    "animation_composition",
    "animation_delay",
    "animation_direction",
    "animation_duration",
    "animation_fill_mode",
    "animation_iteration_count",
    "animation_name",
    "animation_play_state",
    "animation_range",
    "animation_range_end",
    "animation_range_start",
    "animation_timeline",
    "animation_timing_function",
    "appearance",
    "aspect_ratio",
    "backdrop_filter",
    "backface_visibility",
    "background",
    "background_attachment",
    "background_blend_mode",
    "background_clip",
    "background_color",
    "background_image",
    "background_origin",
    "background_position",
    "background_position_x",
    "background_position_y",
    "background_repeat",
    "background_size",
    "block_size",
    "border",
    "border_block",
    "border_block_color",
    "border_block_end",
    "border_block_end_color",
    "border_block_end_style",
    "border_block_end_width",
    "border_block_start",
    "border_block_start_color",
    "border_block_start_style",
    "border_block_start_width",
    "border_block_style",
    "border_block_width",
    "border_bottom",
    "border_bottom_color",
    "border_bottom_left_radius",
    "border_bottom_right_radius",
    "border_bottom_style",
    "border_bottom_width",
    "border_collapse",
    "border_color",
    "border_end_end_radius",
    "border_end_start_radius",
    "border_image",
    "border_image_outset",
    "border_image_repeat",
    "border_image_slice",
    "border_image_source",
    "border_image_width",
    "border_inline",
    "border_inline_color",
    "border_inline_end",
    "border_inline_end_color",
    "border_inline_end_style",
    "border_inline_end_width",
    "border_inline_start",
    "border_inline_start_color",
    "border_inline_start_style",
    "border_inline_start_width",
    "border_inline_style",
    "border_inline_width",
    "border_left",
    "border_left_color",
    "border_left_style",
    "border_left_width",
    "border_radius",
    "border_right",
    "border_right_color",
    "border_right_style",
    "border_right_width",
    "border_spacing",
    "border_start_end_radius",
    "border_start_start_radius",
    "border_style",
    "border_top",
    "border_top_color",
    "border_top_left_radius",
    "border_top_right_radius",
    "border_top_style",
    "border_top_width",
    "border_width",
    "bottom",
    "box_decoration_break",
    "box_reflect",
    "box_shadow",
    "box_sizing",
    "break_after",
    "break_before",
    "break_inside",
    "caption_side",
    "caret_color",
    "clear",
    "clip",
    "clip_path",
    "color",
    "color_scheme",
    "column_count",
    "column_fill",
    "column_gap",
    "column_rule",
    "column_rule_color",
    "column_rule_style",
    "column_rule_width",
    "column_span",
    "column_width",
    "columns",
    "contain",
    "contain_intrinsic_block_size",
    "contain_intrinsic_height",
    "contain_intrinsic_inline_size",
    "contain_intrinsic_size",
    "contain_intrinsic_width",
    "content",
    "content_visibility",
    "counter_increment",
    "counter_reset",
    "counter_set",
    "cursor",
    "direction",
    "display",
    "empty_cells",
    "filter",
    "flex",
    "flex_basis",
    "flex_direction",
    "flex_flow",
    "flex_grow",
    "flex_shrink",
    "flex_wrap",
    "float",
    "font",
    "font_family",
    "font_feature_settings",
    "font_kerning",
    "font_language_override",
    "font_optical_sizing",
    "font_size",
    "font_size_adjust",
    "font_stretch",
    "font_style",
    "font_synthesis",
    "font_variant",
    "font_variant_alternates",
    "font_variant_caps",
    "font_variant_east_asian",
    "font_variant_ligatures",
    "font_variant_numeric",
    "font_variant_position",
    "font_variation_settings",
    "font_weight",
    "gap",
    "grid",
    "grid_area",
    "grid_auto_columns",
    "grid_auto_flow",
    "grid_auto_rows",
    "grid_column",
    "grid_column_end",
    "grid_column_gap",
    "grid_column_start",
    "grid_gap",
    "grid_row",
    "grid_row_end",
    "grid_row_gap",
    "grid_row_start",
    "grid_template",
    "grid_template_areas",
    "grid_template_columns",
    "grid_template_rows",
    "hanging_punctuation",
    "height",
    "hyphenate_character",
    "hyphens",
    "image_orientation",
    "image_rendering",
    "image_resolution",
    "initial_letter",
    "inline_size",
    "inset",
    "inset_block",
    "inset_block_end",
    "inset_block_start",
    "inset_inline",
    "inset_inline_end",
    "inset_inline_start",
    "isolation",
    "justify_content",
    "justify_items",
    "justify_self",
    "left",
    "letter_spacing",
    "line_break",
    "line_height",
    "list_style",
    "list_style_image",
    "list_style_position",
    "list_style_type",
    "margin",
    "margin_block",
    "margin_block_end",
    "margin_block_start",
    "margin_bottom",
    "margin_inline",
    "margin_inline_end",
    "margin_inline_start",
    "margin_left",
    "margin_right",
    "margin_top",
    "marker",
    "marker_end",
    "marker_mid",
    "marker_start",
    "mask",
    "mask_border",
    "mask_border_mode",
    "mask_border_outset",
    "mask_border_repeat",
    "mask_border_slice",
    "mask_border_source",
    "mask_border_width",
    "mask_clip",
    "mask_composite",
    "mask_image",
    "mask_mode",
    "mask_origin",
    "mask_position",
    "mask_repeat",
    "mask_size",
    "mask_type",
    "max_block_size",
    "max_height",
    "max_inline_size",
    "max_width",
    "min_block_size",
    "min_height",
    "min_inline_size",
    "min_width",
    "mix_blend_mode",
    "object_fit",
    "object_position",
    "offset",
    "offset_anchor",
    "offset_distance",
    "offset_path",
    "offset_position",
    "offset_rotate",
    "opacity",
    "order",
    "orphans",
    "outline",
    "outline_color",
    "outline_offset",
    "outline_style",
    "outline_width",
    "overflow",
    "overflow_anchor",
    "overflow_block",
    "overflow_clip_margin",
    "overflow_inline",
    "overflow_wrap",
    "overflow_x",
    "overflow_y",
    "overscroll_behavior",
    "overscroll_behavior_block",
    "overscroll_behavior_inline",
    "overscroll_behavior_x",
    "overscroll_behavior_y",
    "padding",
    "padding_block",
    "padding_block_end",
    "padding_block_start",
    "padding_bottom",
    "padding_inline",
    "padding_inline_end",
    "padding_inline_start",
    "padding_left",
    "padding_right",
    "padding_top",
    "page_break_after",
    "page_break_before",
    "page_break_inside",
    "paint_order",
    "perspective",
    "perspective_origin",
    "place_content",
    "place_items",
    "place_self",
    "pointer_events",
    "position",
    "quotes",
    "resize",
    "right",
    "rotate",
    "row_gap",
    "scale",
    "scroll_behavior",
    "scroll_margin",
    "scroll_margin_block",
    "scroll_margin_block_end",
    "scroll_margin_block_start",
    "scroll_margin_bottom",
    "scroll_margin_inline",
    "scroll_margin_inline_end",
    "scroll_margin_inline_start",
    "scroll_margin_left",
    "scroll_margin_right",
    "scroll_margin_top",
    "scroll_padding",
    "scroll_padding_block",
    "scroll_padding_block_end",
    "scroll_padding_block_start",
    "scroll_padding_bottom",
    "scroll_padding_inline",
    "scroll_padding_inline_end",
    "scroll_padding_inline_start",
    "scroll_padding_left",
    "scroll_padding_right",
    "scroll_padding_top",
    "scroll_snap_align",
    "scroll_snap_stop",
    "scroll_snap_type",
    "scrollbar_color",
    "scrollbar_width",
    "shape_image_threshold",
    "shape_margin",
    "shape_outside",
    "tab_size",
    "table_layout",
    "text_align",
    "text_align_last",
    "text_combine_upright",
    "text_decoration",
    "text_decoration_color",
    "text_decoration_line",
    "text_decoration_skip",
    "text_decoration_skip_ink",
    "text_decoration_style",
    "text_decoration_thickness",
    "text_emphasis",
    "text_emphasis_color",
    "text_emphasis_position",
    "text_emphasis_style",
    "text_indent",
    "text_justify",
    "text_orientation",
    "text_overflow",
    "text_rendering",
    "text_shadow",
    "text_size_adjust",
    "text_transform",
    "text_underline_offset",
    "text_underline_position",
    "top",
    "touch_action",
    "transform",
    "transform_box",
    "transform_origin",
    "transform_style",
    "transition",
    "transition_delay",
    "transition_duration",
    "transition_property",
    "transition_timing_function",
    "translate",
    "unicode_bidi",
    "user_select",
    "vertical_align",
    "visibility",
    "white_space",
    "widows",
    "width",
    "will_change",
    "word_break",
    "word_spacing",
    "word_wrap",
    "writing_mode",
    "z_index",
    "zoom",
] as const;

// リテラル補完を残したまま任意の文字列も受け付けるためのヘルパー。
// TypeScript は `"a" | string` を `string` に簡約してしまい補完候補が消えるが、
// `(string & {})` を挟むと簡約されず、列挙したキーワードが補完に残る。
// 長さ・色・url() など値が開いているプロパティに使う。
export type Kw<T extends string> = T | (string & {});

// 単一キーワード、またはスペース区切り（配列で渡す）で複数指定できる閉じた列挙。
// 値の集合が完全に列挙できるプロパティ（任意の長さ・色を取らないもの）に使う。
export type Multi<T extends string> = T | T[];

export type AlignContentBaseKeyword =
    | "normal"
    | "start"
    | "center"
    | "end"
    | "flex-start"
    | "flex-end"
    | "baseline"
    | "first baseline"
    | "last baseline"
    | "space-between"
    | "space-around"
    | "space-evenly"
    | "stretch";

export type AlignContentKeyword = AlignContentBaseKeyword | ["safe", AlignContentBaseKeyword] | ["unsafe", AlignContentBaseKeyword];

// Background position values
export type BackgroundPositionKeyword = "left" | "center" | "right" | "top" | "bottom";
export type BackgroundPositionValue = Kw<BackgroundPositionKeyword>;

export type PInherit = "inherit";
export type PInitial = "initial";
export type PRevert = "revert";
export type PRevertLayer = "revert-layer";
export type PUnset = "unset";

export type PGlobal = PInherit | PInitial | PRevert | PRevertLayer | PUnset;

// Display values
export type DisplayOutsideValue = "block" | "inline" | "run-in";

export type DisplayInsideValue = "flow" | "flow-root" | "table" | "flex" | "grid" | "ruby";

export type DisplayListItemValue = "list-item";

export type DisplayInternalValue =
    | "table-row-group"
    | "table-header-group"
    | "table-footer-group"
    | "table-row"
    | "table-cell"
    | "table-column-group"
    | "table-column"
    | "table-caption"
    | "ruby-base"
    | "ruby-text"
    | "ruby-base-container"
    | "ruby-text-container";

export type DisplayBoxValue = "contents" | "none";

export type DisplayLegacyValue = "inline-block" | "inline-table" | "inline-flex" | "inline-grid";

// Display型はキーワードの組み合わせを許可
export type DisplayValue = DisplayOutsideValue | DisplayInsideValue | DisplayListItemValue | DisplayInternalValue | DisplayBoxValue | DisplayLegacyValue;

// Displayの値をシンプルな形で定義（配列型を使用）
export type DisplayMultiValue = DisplayValue | DisplayValue[];

// Position values
export type PositionValue = "static" | "relative" | "absolute" | "fixed" | "sticky";

// 追加のグローバル値の派生型
// アニメーション関連のプロパティのグローバル値
export type PAnimationGlobal = PGlobal;

// トランジション関連のプロパティのグローバル値
export type PTransitionGlobal = PGlobal;

// 色関連のプロパティのグローバル値
export type PColorGlobal = PGlobal;

// ボックスモデル関連のプロパティのグローバル値
export type PBoxModelGlobal = PGlobal;

// フォント関連のプロパティのグローバル値
export type PFontGlobal = PGlobal;

// ポジショニング関連のプロパティのグローバル値
export type PPositionGlobal = PGlobal;

// Flex direction values
export type FlexDirectionValue = "row" | "row-reverse" | "column" | "column-reverse";

// Flex wrap values
export type FlexWrapValue = "nowrap" | "wrap" | "wrap-reverse";

// Flex関連の全ての値
export type FlexFlowSingleValue = FlexDirectionValue | FlexWrapValue;

// 複数値を取るプロパティ用の型（シンプル化）
export type FlexFlowMultiValue = FlexFlowSingleValue | [FlexFlowSingleValue, FlexFlowSingleValue];

// Justify content values
export type JustifyContentValue = "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly" | "start" | "end" | "left" | "right";

// Align items values
export type AlignItemsSelfPosition = "center" | "start" | "end" | "self-start" | "self-end" | "flex-start" | "flex-end";

export type AlignItemsValue =
    | "normal"
    | "stretch"
    | "anchor-center"
    | "baseline"
    | "first baseline"
    | "last baseline"
    | AlignItemsSelfPosition
    | ["safe", AlignItemsSelfPosition]
    | ["unsafe", AlignItemsSelfPosition];

export type AlignSelfValue =
    | "auto"
    | "normal"
    | "stretch"
    | "baseline"
    | "first baseline"
    | "last baseline"
    | "anchor-center"
    | AlignItemsSelfPosition
    | ["unsafe", AlignItemsSelfPosition]
    | ["safe", AlignItemsSelfPosition];

export type AlignmentBaselineValue = "baseline" | "text-bottom" | "alphabetic" | "ideographic" | "middle" | "central" | "mathematical" | "text-top";

// Text align values
export type TextAlignValue = "left" | "right" | "center" | "justify" | "start" | "end";

// Overflow values
export type OverflowValue = "visible" | "hidden" | "scroll" | "auto" | "clip";

// 複数値を取るOverflow型（シンプル化）
export type OverflowMultiValue = OverflowValue | [OverflowValue, OverflowValue];

// Text decoration values
export type TextDecorationLineValue = "none" | "underline" | "overline" | "line-through" | "blink";

// Text decoration style values
export type TextDecorationStyleValue = "solid" | "double" | "dotted" | "dashed" | "wavy";

// Text decoration color values
export type TextDecorationColorValue = string;

// Text decoration全ての値のユニオン型（色を含むため任意文字列を許容しつつキーワード補完を残す）
export type TextDecorationValue = Kw<TextDecorationLineValue | TextDecorationStyleValue>;

// Text decoration multi values（配列型を使用してシンプル化）
export type TextDecorationMultiValue = TextDecorationValue | TextDecorationValue[];

// Text transform values
export type TextTransformValue = "none" | "capitalize" | "uppercase" | "lowercase" | "full-width" | "full-size-kana";

// Border style values
export type BorderStyleValue = "none" | "hidden" | "dotted" | "dashed" | "solid" | "double" | "groove" | "ridge" | "inset" | "outset";

// Border幅値（長さも取るためキーワード補完を残しつつ任意文字列を許容）
export type BorderWidthValue = Kw<"thin" | "medium" | "thick">;

// Border色値
export type BorderColorValue = string;

// Border全ての値のユニオン型（ショートハンド。色を含むため開いている）
export type BorderValue = BorderStyleValue | BorderWidthValue;

// Blend mode values（background-blend-mode / mix-blend-mode 共用）
export type BlendModeValue =
    | "normal"
    | "multiply"
    | "screen"
    | "overlay"
    | "darken"
    | "lighten"
    | "color-dodge"
    | "color-burn"
    | "hard-light"
    | "soft-light"
    | "difference"
    | "exclusion"
    | "hue"
    | "saturation"
    | "color"
    | "luminosity";

// Cursor values
export type CursorValue =
    | "auto"
    | "default"
    | "none"
    | "context-menu"
    | "help"
    | "pointer"
    | "progress"
    | "wait"
    | "cell"
    | "crosshair"
    | "text"
    | "vertical-text"
    | "alias"
    | "copy"
    | "move"
    | "no-drop"
    | "not-allowed"
    | "grab"
    | "grabbing"
    | "all-scroll"
    | "col-resize"
    | "row-resize"
    | "n-resize"
    | "e-resize"
    | "s-resize"
    | "w-resize"
    | "ne-resize"
    | "nw-resize"
    | "se-resize"
    | "sw-resize"
    | "ew-resize"
    | "ns-resize"
    | "nesw-resize"
    | "nwse-resize"
    | "zoom-in"
    | "zoom-out";

// Animation property 関連の型
export type AnimationNameValue = string;
export type AnimationDurationValue = string;
export type AnimationTimingFunctionValue = Kw<"ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear" | "step-start" | "step-end">;
export type AnimationDelayValue = string;
export type AnimationIterationCountValue = Kw<"infinite">;
export type AnimationDirectionValue = "normal" | "reverse" | "alternate" | "alternate-reverse";
export type AnimationFillModeValue = "none" | "forwards" | "backwards" | "both";
export type AnimationPlayStateValue = "running" | "paused";
export type AnimationCompositionValue = "replace" | "add" | "accumulate";
export type AnimationTimeline = string;

// Animation複合型
export type AnimationValueBase =
    | AnimationNameValue
    | AnimationDurationValue
    | AnimationTimingFunctionValue
    | AnimationDelayValue
    | AnimationIterationCountValue
    | AnimationDirectionValue
    | AnimationFillModeValue
    | AnimationPlayStateValue
    | AnimationTimeline;

export type AnimationValue = AnimationValueBase | AnimationValueBase[];

// Font関連の型
export type FontStyleValue = Kw<"normal" | "italic" | "oblique">;
export type FontWeightValue = "normal" | "bold" | "bolder" | "lighter" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
export type FontSizeValue = Kw<"xx-small" | "x-small" | "small" | "medium" | "large" | "x-large" | "xx-large" | "xxx-large" | "smaller" | "larger">;
export type LineHeightValue = Kw<"normal">;
export type FontFamilyValue = string | string[];

// Font用の全ての値のユニオン型
export type FontValueType = FontStyleValue | FontWeightValue | FontSizeValue | LineHeightValue | FontFamilyValue;

// Font複合型（ショートハンド。font-family を含むため開いている）
export type FontValue = string | string[];

// Grid Template Areas用の型定義
export type GridTemplateAreasValue = Kw<"none"> | string[]; // 複数行のグリッド定義

// Grid関連の複合プロパティのためのカンマと空白区切り型
export type GridTemplateValue = string | string[];
export type GridTemplateColumnsValue = Kw<"none"> | string[];
export type GridTemplateRowsValue = Kw<"none"> | string[];

// Transform関数の型
export type TransformFunctionValue = string;

// Transform複合型（関数の連なり。任意文字列を許容しつつ none を補完）
export type TransformValue = Kw<"none"> | string[];

// Transition property 関連の型
export type TransitionPropertyValue = Kw<"none" | "all">;
export type TransitionDurationValue = string;
export type TransitionTimingFunctionValue = Kw<"ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear" | "step-start" | "step-end">;
export type TransitionDelayValue = string;

// Transition複合型
export type TransitionValue = string | string[];

// Main CSS Properties type
export type Properties = Partial<{
    // A
    accent_color: Kw<"auto"> | PColorGlobal;
    align_content: AlignContentKeyword | PGlobal;
    align_items: AlignItemsValue | PGlobal;
    align_self: AlignSelfValue | PGlobal;
    alignment_baseline: AlignmentBaselineValue | PGlobal;
    all: PGlobal;
    anchor_name: Kw<"none"> | string[] | PGlobal;
    animation: AnimationValue | PAnimationGlobal;
    animation_composition: Multi<AnimationCompositionValue> | PAnimationGlobal;
    animation_delay: string | string[] | PAnimationGlobal;
    animation_direction: Multi<AnimationDirectionValue> | PAnimationGlobal;
    animation_duration: string | string[] | PAnimationGlobal;
    animation_fill_mode: Multi<AnimationFillModeValue> | PAnimationGlobal;
    animation_iteration_count: AnimationIterationCountValue | AnimationIterationCountValue[] | PAnimationGlobal;
    animation_name: string | string[] | PAnimationGlobal;
    animation_play_state: Multi<AnimationPlayStateValue> | PAnimationGlobal;
    animation_range: string | string[] | PAnimationGlobal;
    animation_range_end: string | string[] | PAnimationGlobal;
    animation_range_start: string | string[] | PAnimationGlobal;
    animation_timeline: string | string[] | PAnimationGlobal;
    animation_timing_function: AnimationTimingFunctionValue | AnimationTimingFunctionValue[] | PAnimationGlobal;
    appearance: "none" | "auto" | PGlobal;
    aspect_ratio: Kw<"auto"> | [string, "/", string] | PGlobal;

    // B
    backdrop_filter: Kw<"none"> | string[] | PGlobal;
    backface_visibility: "visible" | "hidden" | PGlobal;
    background: string | string[] | PGlobal;
    background_attachment: Multi<"scroll" | "fixed" | "local"> | PGlobal;
    background_blend_mode: Multi<BlendModeValue> | PGlobal;
    background_clip: Multi<"border-box" | "padding-box" | "content-box" | "text"> | PGlobal;
    background_color: string | PColorGlobal;
    background_image: Kw<"none"> | string[] | PGlobal;
    background_origin: Multi<"border-box" | "padding-box" | "content-box"> | PGlobal;
    background_position: BackgroundPositionValue | BackgroundPositionValue[] | PGlobal;
    background_position_x: Kw<"left" | "center" | "right"> | string[] | PGlobal;
    background_position_y: Kw<"top" | "center" | "bottom"> | string[] | PGlobal;
    background_repeat: Multi<"repeat" | "repeat-x" | "repeat-y" | "no-repeat" | "space" | "round"> | PGlobal;
    background_size: Kw<"auto" | "cover" | "contain"> | string[] | PGlobal;
    block_size: Kw<"auto" | "max-content" | "min-content" | "fit-content"> | PGlobal;
    border: BorderValue | BorderValue[] | PGlobal;
    border_block: BorderValue | BorderValue[] | PGlobal;
    border_block_color: string | string[] | PGlobal;
    border_block_end: BorderValue | BorderValue[] | PGlobal;
    border_block_end_color: string | PGlobal;
    border_block_end_style: BorderStyleValue | PGlobal;
    border_block_end_width: BorderWidthValue | PGlobal;
    border_block_start: BorderValue | BorderValue[] | PGlobal;
    border_block_start_color: string | PGlobal;
    border_block_start_style: BorderStyleValue | PGlobal;
    border_block_start_width: BorderWidthValue | PGlobal;
    border_block_style: BorderStyleValue | PGlobal;
    border_block_width: BorderWidthValue | PGlobal;
    border_bottom: BorderValue | BorderValue[] | PGlobal;
    border_bottom_color: string | PGlobal;
    border_bottom_left_radius: string | string[] | PGlobal;
    border_bottom_right_radius: string | string[] | PGlobal;
    border_bottom_style: BorderStyleValue | PGlobal;
    border_bottom_width: BorderWidthValue | PGlobal;
    border_collapse: "collapse" | "separate" | PGlobal;
    border_color: string | string[] | PGlobal;
    border_end_end_radius: string | string[] | PGlobal;
    border_end_start_radius: string | string[] | PGlobal;
    border_image: string | string[] | PGlobal;
    border_image_outset: string | string[] | PGlobal;
    border_image_repeat: Multi<"stretch" | "repeat" | "round" | "space"> | PGlobal;
    border_image_slice: string | string[] | PGlobal;
    border_image_source: Kw<"none"> | PGlobal;
    border_image_width: string | string[] | PGlobal;
    border_inline: BorderValue | BorderValue[] | PGlobal;
    border_inline_color: string | string[] | PGlobal;
    border_inline_end: BorderValue | BorderValue[] | PGlobal;
    border_inline_end_color: string | PGlobal;
    border_inline_end_style: BorderStyleValue | PGlobal;
    border_inline_end_width: BorderWidthValue | PGlobal;
    border_inline_start: BorderValue | BorderValue[] | PGlobal;
    border_inline_start_color: string | PGlobal;
    border_inline_start_style: BorderStyleValue | PGlobal;
    border_inline_start_width: BorderWidthValue | PGlobal;
    border_inline_style: BorderStyleValue | PGlobal;
    border_inline_width: BorderWidthValue | PGlobal;
    border_left: BorderValue | BorderValue[] | PGlobal;
    border_left_color: string | PGlobal;
    border_left_style: BorderStyleValue | PGlobal;
    border_left_width: BorderWidthValue | PGlobal;
    border_radius: string | string[] | PGlobal;
    border_right: BorderValue | BorderValue[] | PGlobal;
    border_right_color: string | PGlobal;
    border_right_style: BorderStyleValue | PGlobal;
    border_right_width: BorderWidthValue | PGlobal;
    border_spacing: string | string[] | PGlobal;
    border_start_end_radius: string | string[] | PGlobal;
    border_start_start_radius: string | string[] | PGlobal;
    border_style: BorderStyleValue | BorderStyleValue[] | PGlobal;
    border_top: BorderValue | BorderValue[] | PGlobal;
    border_top_color: string | PGlobal;
    border_top_left_radius: string | string[] | PGlobal;
    border_top_right_radius: string | string[] | PGlobal;
    border_top_style: BorderStyleValue | PGlobal;
    border_top_width: BorderWidthValue | PGlobal;
    border_width: BorderWidthValue | BorderWidthValue[] | PGlobal;
    bottom: Kw<"auto"> | PGlobal;
    box_decoration_break: "slice" | "clone" | PGlobal;
    box_reflect: Kw<"none" | "above" | "below" | "left" | "right"> | string[] | PGlobal;
    box_shadow: Kw<"none"> | string[] | PGlobal;
    box_sizing: "content-box" | "border-box" | PGlobal;
    break_after:
        | "auto"
        | "avoid"
        | "always"
        | "all"
        | "avoid-page"
        | "page"
        | "left"
        | "right"
        | "recto"
        | "verso"
        | "avoid-column"
        | "column"
        | "avoid-region"
        | "region"
        | PGlobal;
    break_before:
        | "auto"
        | "avoid"
        | "always"
        | "all"
        | "avoid-page"
        | "page"
        | "left"
        | "right"
        | "recto"
        | "verso"
        | "avoid-column"
        | "column"
        | "avoid-region"
        | "region"
        | PGlobal;
    break_inside: "auto" | "avoid" | "avoid-page" | "avoid-column" | "avoid-region" | PGlobal;

    // C
    caption_side: "top" | "bottom" | "block-start" | "block-end" | "inline-start" | "inline-end" | PGlobal;
    caret_color: Kw<"auto"> | PColorGlobal;
    clear: "none" | "left" | "right" | "both" | "inline-start" | "inline-end" | PGlobal;
    clip: Kw<"auto"> | PGlobal;
    clip_path: Kw<"none"> | string[] | PGlobal;
    color: string | PColorGlobal;
    color_scheme: Kw<"normal" | "light" | "dark" | "only"> | string[] | PGlobal;
    column_count: Kw<"auto"> | PGlobal;
    column_fill: "auto" | "balance" | "balance-all" | PGlobal;
    column_gap: Kw<"normal"> | PGlobal;
    column_rule: BorderValue | BorderValue[] | PGlobal;
    column_rule_color: string | PGlobal;
    column_rule_style: BorderStyleValue | PGlobal;
    column_rule_width: BorderWidthValue | PGlobal;
    column_span: "none" | "all" | PGlobal;
    column_width: Kw<"auto"> | PGlobal;
    columns: string | string[] | PGlobal;
    contain: Multi<"none" | "strict" | "content" | "size" | "inline-size" | "layout" | "style" | "paint"> | PGlobal;
    contain_intrinsic_block_size: Kw<"none"> | string[] | PGlobal;
    contain_intrinsic_height: Kw<"none"> | string[] | PGlobal;
    contain_intrinsic_inline_size: Kw<"none"> | string[] | PGlobal;
    contain_intrinsic_size: Kw<"none"> | string[] | PGlobal;
    contain_intrinsic_width: Kw<"none"> | string[] | PGlobal;
    content: Kw<"normal" | "none"> | string[] | PGlobal;
    content_visibility: "visible" | "auto" | "hidden" | PGlobal;
    counter_increment: Kw<"none"> | string[] | PGlobal;
    counter_reset: Kw<"none"> | string[] | PGlobal;
    counter_set: Kw<"none"> | string[] | PGlobal;
    cursor: Kw<CursorValue> | string[] | PGlobal;

    // D
    direction: "ltr" | "rtl" | PGlobal;
    display: DisplayMultiValue | PGlobal;

    // E
    empty_cells: "show" | "hide" | PGlobal;

    // F
    filter: Kw<"none"> | string[] | PGlobal;
    flex: Kw<"auto" | "none" | "content"> | string[] | PGlobal;
    flex_basis: Kw<"auto" | "fill" | "max-content" | "min-content" | "fit-content" | "content"> | PGlobal;
    flex_direction: FlexDirectionValue | PGlobal;
    flex_flow: FlexFlowMultiValue | PGlobal;
    flex_grow: string | PGlobal;
    flex_shrink: string | PGlobal;
    flex_wrap: FlexWrapValue | PGlobal;
    float: "left" | "right" | "none" | "inline-start" | "inline-end" | PGlobal;
    font: FontValue | PFontGlobal;
    font_family: string | string[] | PFontGlobal;
    font_feature_settings: Kw<"normal"> | string[] | PFontGlobal;
    font_kerning: "auto" | "normal" | "none" | PFontGlobal;
    font_language_override: Kw<"normal"> | PFontGlobal;
    font_optical_sizing: "auto" | "none" | PFontGlobal;
    font_size: FontSizeValue | PFontGlobal;
    font_size_adjust: Kw<"none" | "from-font"> | string[] | PFontGlobal;
    font_stretch:
        | Kw<
              | "normal"
              | "ultra-condensed"
              | "extra-condensed"
              | "condensed"
              | "semi-condensed"
              | "semi-expanded"
              | "expanded"
              | "extra-expanded"
              | "ultra-expanded"
          >
        | PFontGlobal;
    font_style: FontStyleValue | PFontGlobal;
    font_synthesis: Multi<"none" | "weight" | "style" | "small-caps" | "position"> | PFontGlobal;
    font_variant: Kw<"normal" | "none"> | string[] | PFontGlobal;
    font_variant_alternates: Kw<"normal"> | string[] | PFontGlobal;
    font_variant_caps: "normal" | "small-caps" | "all-small-caps" | "petite-caps" | "all-petite-caps" | "unicase" | "titling-caps" | PFontGlobal;
    font_variant_east_asian: Kw<"normal"> | string[] | PFontGlobal;
    font_variant_ligatures: Kw<"normal" | "none"> | string[] | PFontGlobal;
    font_variant_numeric: Kw<"normal"> | string[] | PFontGlobal;
    font_variant_position: "normal" | "sub" | "super" | PFontGlobal;
    font_variation_settings: Kw<"normal"> | string[] | PFontGlobal;
    font_weight: FontWeightValue | PFontGlobal;

    // G
    gap: Kw<"normal"> | string[] | PGlobal;
    grid: string | string[] | PGlobal;
    grid_area: string | PGlobal;
    grid_auto_columns: Kw<"auto" | "max-content" | "min-content"> | string[] | PGlobal;
    grid_auto_flow: Multi<"row" | "column" | "dense"> | PGlobal;
    grid_auto_rows: Kw<"auto" | "max-content" | "min-content"> | string[] | PGlobal;
    grid_column: Kw<"auto"> | string[] | PGlobal;
    grid_column_end: Kw<"auto"> | PGlobal;
    grid_column_gap: Kw<"normal"> | PGlobal;
    grid_column_start: Kw<"auto"> | PGlobal;
    grid_gap: Kw<"normal"> | string[] | PGlobal;
    grid_row: Kw<"auto"> | string[] | PGlobal;
    grid_row_end: Kw<"auto"> | PGlobal;
    grid_row_gap: Kw<"normal"> | PGlobal;
    grid_row_start: Kw<"auto"> | PGlobal;
    grid_template: GridTemplateValue | PGlobal;
    grid_template_areas: GridTemplateAreasValue | PGlobal;
    grid_template_columns: GridTemplateColumnsValue | PGlobal;
    grid_template_rows: GridTemplateRowsValue | PGlobal;

    // H
    hanging_punctuation: Multi<"none" | "first" | "last" | "force-end" | "allow-end"> | PGlobal;
    height: Kw<"auto" | "max-content" | "min-content" | "fit-content"> | PGlobal;
    hyphenate_character: Kw<"auto"> | PGlobal;
    hyphens: "none" | "manual" | "auto" | PGlobal;

    // I
    image_orientation: Kw<"none" | "from-image"> | PGlobal;
    image_rendering: "auto" | "crisp-edges" | "pixelated" | PGlobal;
    image_resolution: string | string[] | PGlobal;
    initial_letter: Kw<"normal"> | string[] | PGlobal;
    inline_size: Kw<"auto" | "max-content" | "min-content" | "fit-content"> | PGlobal;
    inset: Kw<"auto"> | string[] | PGlobal;
    inset_block: Kw<"auto"> | string[] | PGlobal;
    inset_block_end: Kw<"auto"> | PGlobal;
    inset_block_start: Kw<"auto"> | PGlobal;
    inset_inline: Kw<"auto"> | string[] | PGlobal;
    inset_inline_end: Kw<"auto"> | PGlobal;
    inset_inline_start: Kw<"auto"> | PGlobal;
    isolation: "auto" | "isolate" | PGlobal;

    // J
    justify_content: JustifyContentValue | PGlobal;
    justify_items:
        | "normal"
        | "stretch"
        | "baseline"
        | "start"
        | "end"
        | "center"
        | "self-start"
        | "self-end"
        | "flex-start"
        | "flex-end"
        | "left"
        | "right"
        | PGlobal;
    justify_self:
        | "auto"
        | "normal"
        | "stretch"
        | "baseline"
        | "start"
        | "end"
        | "center"
        | "self-start"
        | "self-end"
        | "flex-start"
        | "flex-end"
        | "left"
        | "right"
        | PGlobal;

    // L
    left: Kw<"auto"> | PGlobal;
    letter_spacing: Kw<"normal"> | PGlobal;
    line_break: "auto" | "loose" | "normal" | "strict" | "anywhere" | PGlobal;
    line_height: LineHeightValue | PGlobal;
    list_style: string | string[] | PGlobal;
    list_style_image: Kw<"none"> | PGlobal;
    list_style_position: "inside" | "outside" | PGlobal;
    list_style_type:
        | Kw<
              | "none"
              | "disc"
              | "circle"
              | "square"
              | "decimal"
              | "decimal-leading-zero"
              | "lower-roman"
              | "upper-roman"
              | "lower-alpha"
              | "upper-alpha"
              | "lower-latin"
              | "upper-latin"
              | "lower-greek"
          >
        | PGlobal;

    // M
    margin: Kw<"auto"> | string[] | PBoxModelGlobal;
    margin_block: Kw<"auto"> | string[] | PBoxModelGlobal;
    margin_block_end: Kw<"auto"> | PBoxModelGlobal;
    margin_block_start: Kw<"auto"> | PBoxModelGlobal;
    margin_bottom: Kw<"auto"> | PBoxModelGlobal;
    margin_inline: Kw<"auto"> | string[] | PBoxModelGlobal;
    margin_inline_end: Kw<"auto"> | PBoxModelGlobal;
    margin_inline_start: Kw<"auto"> | PBoxModelGlobal;
    margin_left: Kw<"auto"> | PBoxModelGlobal;
    margin_right: Kw<"auto"> | PBoxModelGlobal;
    margin_top: Kw<"auto"> | PBoxModelGlobal;
    marker: Kw<"none"> | PGlobal;
    marker_end: Kw<"none"> | PGlobal;
    marker_mid: Kw<"none"> | PGlobal;
    marker_start: Kw<"none"> | PGlobal;
    mask: Kw<"none"> | string[] | PGlobal;
    mask_border: string | string[] | PGlobal;
    mask_border_mode: "luminance" | "alpha" | PGlobal;
    mask_border_outset: string | string[] | PGlobal;
    mask_border_repeat: Multi<"stretch" | "repeat" | "round" | "space"> | PGlobal;
    mask_border_slice: string | string[] | PGlobal;
    mask_border_source: Kw<"none"> | PGlobal;
    mask_border_width: Kw<"auto"> | string[] | PGlobal;
    mask_clip: Multi<"content-box" | "padding-box" | "border-box" | "margin-box" | "fill-box" | "stroke-box" | "view-box" | "no-clip"> | PGlobal;
    mask_composite: Multi<"add" | "subtract" | "intersect" | "exclude"> | PGlobal;
    mask_image: Kw<"none"> | string[] | PGlobal;
    mask_mode: Multi<"alpha" | "luminance" | "match-source"> | PGlobal;
    mask_origin: Multi<"content-box" | "padding-box" | "border-box" | "margin-box" | "fill-box" | "stroke-box" | "view-box"> | PGlobal;
    mask_position: string | string[] | PGlobal;
    mask_repeat: Multi<"repeat" | "repeat-x" | "repeat-y" | "space" | "round" | "no-repeat"> | PGlobal;
    mask_size: Kw<"auto" | "cover" | "contain"> | string[] | PGlobal;
    mask_type: "luminance" | "alpha" | PGlobal;
    max_block_size: Kw<"none" | "max-content" | "min-content" | "fit-content"> | PGlobal;
    max_height: Kw<"none" | "max-content" | "min-content" | "fit-content"> | PGlobal;
    max_inline_size: Kw<"none" | "max-content" | "min-content" | "fit-content"> | PGlobal;
    max_width: Kw<"none" | "max-content" | "min-content" | "fit-content"> | PGlobal;
    min_block_size: Kw<"auto" | "max-content" | "min-content" | "fit-content"> | PGlobal;
    min_height: Kw<"auto" | "max-content" | "min-content" | "fit-content"> | PGlobal;
    min_inline_size: Kw<"auto" | "max-content" | "min-content" | "fit-content"> | PGlobal;
    min_width: Kw<"auto" | "max-content" | "min-content" | "fit-content"> | PGlobal;
    mix_blend_mode: BlendModeValue | "plus-darker" | "plus-lighter" | PGlobal;

    // O
    object_fit: "fill" | "contain" | "cover" | "none" | "scale-down" | PGlobal;
    object_position: string | string[] | PGlobal;
    offset: string | string[] | PGlobal;
    offset_anchor: Kw<"auto"> | string[] | PGlobal;
    offset_distance: string | PGlobal;
    offset_path: Kw<"none"> | PGlobal;
    offset_position: Kw<"auto" | "normal"> | string[] | PGlobal;
    offset_rotate: Kw<"auto" | "reverse"> | string[] | PGlobal;
    opacity: string | PGlobal;
    order: string | PGlobal;
    orphans: string | PGlobal;
    outline: BorderValue | BorderValue[] | PGlobal;
    outline_color: Kw<"invert"> | PGlobal;
    outline_offset: string | PGlobal;
    outline_style: BorderStyleValue | "auto" | PGlobal;
    outline_width: BorderWidthValue | PGlobal;
    overflow: OverflowValue | OverflowMultiValue | PGlobal;
    overflow_anchor: "auto" | "none" | PGlobal;
    overflow_block: OverflowValue | PGlobal;
    overflow_clip_margin: Kw<"content-box" | "padding-box" | "border-box"> | PGlobal;
    overflow_inline: OverflowValue | PGlobal;
    overflow_wrap: "normal" | "break-word" | "anywhere" | PGlobal;
    overflow_x: OverflowValue | PGlobal;
    overflow_y: OverflowValue | PGlobal;
    overscroll_behavior: Multi<"auto" | "contain" | "none"> | PGlobal;
    overscroll_behavior_block: "auto" | "contain" | "none" | PGlobal;
    overscroll_behavior_inline: "auto" | "contain" | "none" | PGlobal;
    overscroll_behavior_x: "auto" | "contain" | "none" | PGlobal;
    overscroll_behavior_y: "auto" | "contain" | "none" | PGlobal;

    // P
    padding: string | string[] | PBoxModelGlobal;
    padding_block: string | string[] | PBoxModelGlobal;
    padding_block_end: string | PBoxModelGlobal;
    padding_block_start: string | PBoxModelGlobal;
    padding_bottom: string | PBoxModelGlobal;
    padding_inline: string | string[] | PBoxModelGlobal;
    padding_inline_end: string | PBoxModelGlobal;
    padding_inline_start: string | PBoxModelGlobal;
    padding_left: string | PBoxModelGlobal;
    padding_right: string | PBoxModelGlobal;
    padding_top: string | PBoxModelGlobal;
    page_break_after: "auto" | "always" | "avoid" | "left" | "right" | PGlobal;
    page_break_before: "auto" | "always" | "avoid" | "left" | "right" | PGlobal;
    page_break_inside: "auto" | "avoid" | PGlobal;
    paint_order: Multi<"normal" | "fill" | "stroke" | "markers"> | PGlobal;
    perspective: Kw<"none"> | PGlobal;
    perspective_origin: string | string[] | PGlobal;
    place_content: string | string[] | PGlobal;
    place_items: string | string[] | PGlobal;
    place_self: string | string[] | PGlobal;
    pointer_events: "auto" | "none" | "visiblePainted" | "visibleFill" | "visibleStroke" | "visible" | "painted" | "fill" | "stroke" | "all" | PGlobal;
    position: PositionValue | PPositionGlobal;

    // Q
    quotes: Kw<"none" | "auto"> | string[] | PGlobal;

    // R
    resize: "none" | "both" | "horizontal" | "vertical" | "block" | "inline" | PGlobal;
    right: Kw<"auto"> | PGlobal;
    rotate: Kw<"none"> | string[] | PGlobal;
    row_gap: Kw<"normal"> | PGlobal;

    // S
    scale: Kw<"none"> | string[] | PGlobal;
    scroll_behavior: "auto" | "smooth" | PGlobal;
    scroll_margin: string | string[] | PGlobal;
    scroll_margin_block: string | string[] | PGlobal;
    scroll_margin_block_end: string | PGlobal;
    scroll_margin_block_start: string | PGlobal;
    scroll_margin_bottom: string | PGlobal;
    scroll_margin_inline: string | string[] | PGlobal;
    scroll_margin_inline_end: string | PGlobal;
    scroll_margin_inline_start: string | PGlobal;
    scroll_margin_left: string | PGlobal;
    scroll_margin_right: string | PGlobal;
    scroll_margin_top: string | PGlobal;
    scroll_padding: Kw<"auto"> | string[] | PGlobal;
    scroll_padding_block: Kw<"auto"> | string[] | PGlobal;
    scroll_padding_block_end: Kw<"auto"> | PGlobal;
    scroll_padding_block_start: Kw<"auto"> | PGlobal;
    scroll_padding_bottom: Kw<"auto"> | PGlobal;
    scroll_padding_inline: Kw<"auto"> | string[] | PGlobal;
    scroll_padding_inline_end: Kw<"auto"> | PGlobal;
    scroll_padding_inline_start: Kw<"auto"> | PGlobal;
    scroll_padding_left: Kw<"auto"> | PGlobal;
    scroll_padding_right: Kw<"auto"> | PGlobal;
    scroll_padding_top: Kw<"auto"> | PGlobal;
    scroll_snap_align: Multi<"none" | "start" | "end" | "center"> | PGlobal;
    scroll_snap_stop: "normal" | "always" | PGlobal;
    scroll_snap_type: Multi<"none" | "x" | "y" | "block" | "inline" | "both" | "mandatory" | "proximity"> | PGlobal;
    scrollbar_color: Kw<"auto"> | string[] | PGlobal;
    scrollbar_width: "auto" | "thin" | "none" | PGlobal;
    shape_image_threshold: string | PGlobal;
    shape_margin: string | PGlobal;
    shape_outside: Kw<"none" | "margin-box" | "content-box" | "border-box" | "padding-box"> | string[] | PGlobal;
    tab_size: string | PGlobal;
    table_layout: "auto" | "fixed" | PGlobal;
    text_align: TextAlignValue | PGlobal;
    text_align_last: TextAlignValue | "auto" | PGlobal;
    text_combine_upright: Kw<"none" | "all" | "digits"> | string[] | PGlobal;
    text_decoration: TextDecorationMultiValue | PGlobal;
    text_decoration_color: string | PGlobal;
    text_decoration_line: TextDecorationLineValue | TextDecorationLineValue[] | PGlobal;
    text_decoration_skip: Multi<"none" | "objects" | "spaces" | "leading-spaces" | "trailing-spaces" | "edges" | "box-decoration"> | PGlobal;
    text_decoration_skip_ink: "auto" | "none" | "all" | PGlobal;
    text_decoration_style: TextDecorationStyleValue | PGlobal;
    text_decoration_thickness: Kw<"auto" | "from-font"> | PGlobal;
    text_emphasis: string | string[] | PGlobal;
    text_emphasis_color: string | PGlobal;
    text_emphasis_position: Kw<"over" | "under" | "left" | "right"> | string[] | PGlobal;
    text_emphasis_style: Kw<"none" | "filled" | "open" | "dot" | "circle" | "double-circle" | "triangle" | "sesame"> | string[] | PGlobal;
    text_indent: string | string[] | PGlobal;
    text_justify: "auto" | "inter-character" | "inter-word" | "none" | PGlobal;
    text_orientation: "mixed" | "upright" | "sideways" | PGlobal;
    text_overflow: Kw<"clip" | "ellipsis"> | string[] | PGlobal;
    text_rendering: "auto" | "optimizeSpeed" | "optimizeLegibility" | "geometricPrecision" | PGlobal;
    text_shadow: Kw<"none"> | string[] | PGlobal;
    text_size_adjust: Kw<"none" | "auto"> | PGlobal;
    text_transform: TextTransformValue | PGlobal;
    text_underline_offset: Kw<"auto"> | PGlobal;
    text_underline_position: Multi<"auto" | "from-font" | "under" | "left" | "right"> | PGlobal;
    top: Kw<"auto"> | PGlobal;
    touch_action: Multi<"auto" | "none" | "pan-x" | "pan-y" | "pan-left" | "pan-right" | "pan-up" | "pan-down" | "pinch-zoom" | "manipulation"> | PGlobal;
    transform: TransformValue | PGlobal;
    transform_box: "content-box" | "border-box" | "fill-box" | "stroke-box" | "view-box" | PGlobal;
    transform_origin: string | string[] | PGlobal;
    transform_style: "flat" | "preserve-3d" | PGlobal;
    transition: TransitionValue | PTransitionGlobal;
    transition_delay: string | string[] | PTransitionGlobal;
    transition_duration: string | string[] | PTransitionGlobal;
    transition_property: TransitionPropertyValue | TransitionPropertyValue[] | PTransitionGlobal;
    transition_timing_function: TransitionTimingFunctionValue | TransitionTimingFunctionValue[] | PTransitionGlobal;
    translate: Kw<"none"> | string[] | PGlobal;

    // U
    unicode_bidi: "normal" | "embed" | "isolate" | "bidi-override" | "isolate-override" | "plaintext" | PGlobal;
    user_select: "auto" | "none" | "text" | "contain" | "all" | PGlobal;

    // V
    vertical_align: Kw<"baseline" | "sub" | "super" | "text-top" | "text-bottom" | "middle" | "top" | "bottom"> | PGlobal;
    visibility: "visible" | "hidden" | "collapse" | PGlobal;

    // W
    white_space: "normal" | "nowrap" | "pre" | "pre-wrap" | "pre-line" | "break-spaces" | PGlobal;
    widows: string | PGlobal;
    width: Kw<"auto" | "max-content" | "min-content" | "fit-content"> | PGlobal;
    will_change: Kw<"auto" | "scroll-position" | "contents"> | string[] | PGlobal;
    word_break: "normal" | "break-all" | "keep-all" | "break-word" | PGlobal;
    word_spacing: Kw<"normal"> | PGlobal;
    word_wrap: "normal" | "break-word" | PGlobal;
    writing_mode: "horizontal-tb" | "vertical-rl" | "vertical-lr" | "sideways-rl" | "sideways-lr" | PGlobal;

    // Z
    z_index: Kw<"auto"> | PGlobal;
    zoom: Kw<"normal" | "reset"> | PGlobal;

    // CSS変数
    [key: `--${string}`]: string;
}>;

// --- property_names と Properties の同期をコンパイル時に検証する ---
// CSS のサニタイズ（css.ts の validatePropertyName）は property_names を許可リストとして使う。
// 型と配列がずれると「型は通るのに実行時に弾かれる」「補完が効かない」不具合になるため、
// 両者が一致していることを以下の型でビルド時に強制する（ずれると該当キーがエラーに現れる）。
type PropertiesKey = Exclude<Extract<keyof Properties, string>, `--${string}`>;

// すべての Properties のキーが property_names に登録されていること（実行時バリデーション漏れ防止）。
type UnregisteredKeys = Exclude<PropertiesKey, PropertyName>;
const _assertNoUnregisteredKeys: UnregisteredKeys extends never ? true : ["Unregistered property keys", UnregisteredKeys] = true;

// すべての property_names に型定義があること（補完漏れ防止）。
type UntypedNames = Exclude<PropertyName, PropertiesKey>;
const _assertNoUntypedNames: UntypedNames extends never ? true : ["Untyped property names", UntypedNames] = true;
