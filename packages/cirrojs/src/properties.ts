export type PropertyName = keyof typeof property_names;

export const property_names = [
    "accent_color",
    "align_content",
    "align_items",
    "align_self",
    "all",
    "animation",
    "animation_delay",
    "animation_direction",
    "animation_duration",
    "animation_fill_mode",
    "animation_iteration_count",
    "animation_name",
    "animation_play_state",
    "animation_timing_function",
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
    "@charset",
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
    "@container",
    "content",
    "counter_increment",
    "counter_reset",
    "counter_set",
    "@counter_style",
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
    "@font_face",
    "font_family",
    "font_feature_settings",
    "font_kerning",
    "font_language_override",
    "@font_palette_values",
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
    "font_weight",
    "gap",
    "grid",
    "grid_area",
    "grid_auto_columns",
    "grid_auto_flow",
    "grid_auto_rows",
    "grid_column",
    "grid_column_end",
    "grid_column_start",
    "grid_row",
    "grid_row_end",
    "grid_row_start",
    "grid_template",
    "grid_template_areas",
    "grid_template_columns",
    "grid_template_rows",
    "hanging_punctuation",
    "height",
    "hyphens",
    "hypenate_character",
    "image_rendering",
    "@import",
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
    "@keyframes",
    "@layer",
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
    "mask_clip",
    "mask_composite",
    "mask_image",
    "mask_mode",
    "mask_origin",
    "mask_position",
    "mask_repeat",
    "mask_size",
    "mask_type",
    "max_height",
    "max_width",
    "@media",
    "max_block_size",
    "max_inline_size",
    "min_block_size",
    "min_inline_size",
    "min_height",
    "min_width",
    "mix_blend_mode",
    "@namespace",
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
    "@page",
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
    "@property",
    "quotes",
    "resize",
    "right",
    "rotate",
    "row_gap",
    "scale",
    "@scope",
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
    "shape_outside",
    "@starting_style",
    "@supports",
    "tab_size",
    "table_layout",
    "text_align",
    "text_align_last",
    "text_combine_upright",
    "text_decoration",
    "text_decoration_color",
    "text_decoration_line",
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
    "text_shadow",
    "text_transform",
    "text_underline_offset",
    "text_underline_position",
    "top",
    "transform",
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
    "word_break",
    "word_spacing",
    "word_wrap",
    "writing_mode",
    "z_index",
    "zoom",
] as const;

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

export type AlignContentKeyword =
    | AlignContentBaseKeyword
    | ["safe", AlignContentBaseKeyword]
    | ["unsafe", AlignContentBaseKeyword];

// Background position values
export type BackgroundPositionKeyword = "left" | "center" | "right" | "top" | "bottom";
export type BackgroundPositionValue = BackgroundPositionKeyword | string;

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
export type DisplayValue =
    | DisplayOutsideValue
    | DisplayInsideValue
    | DisplayListItemValue
    | DisplayInternalValue
    | DisplayBoxValue
    | DisplayLegacyValue
    | "table" // 特殊なケース
    | "inline-block"
    | "inline-flex"
    | "inline-grid";

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
export type JustifyContentValue =
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly"
    | "start"
    | "end"
    | "left"
    | "right";

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

export type AlignmentBaselineValue =
    | "baseline"
    | "text-bottom"
    | "alphabetic"
    | "ideographic"
    | "middle"
    | "central"
    | "mathematical"
    | "text-top";

// Text align values
export type TextAlignValue = "left" | "right" | "center" | "justify" | "start" | "end";

// Overflow values
export type OverflowValue = "visible" | "hidden" | "scroll" | "auto" | "clip";

// 複数値を取るOverflow型（シンプル化）
export type OverflowMultiValue = OverflowValue | [OverflowValue, OverflowValue];

// Text decoration values
export type TextDecorationLineValue = "none" | "underline" | "overline" | "line-through";

// Text decoration style values
export type TextDecorationStyleValue = "solid" | "double" | "dotted" | "dashed" | "wavy";

// Text decoration color values
export type TextDecorationColorValue = string;

// Text decoration全ての値のユニオン型
export type TextDecorationValue = TextDecorationLineValue | TextDecorationStyleValue | TextDecorationColorValue;

// Text decoration multi values（配列型を使用してシンプル化）
export type TextDecorationMultiValue = TextDecorationValue | TextDecorationValue[];

// Text transform values
export type TextTransformValue = "none" | "capitalize" | "uppercase" | "lowercase" | "full-width";

// Border style values
export type BorderStyleValue =
    | "none"
    | "hidden"
    | "dotted"
    | "dashed"
    | "solid"
    | "double"
    | "groove"
    | "ridge"
    | "inset"
    | "outset";

// Border幅値
export type BorderWidthValue = "thin" | "medium" | "thick" | string;

// Border色値
export type BorderColorValue = string;

// Border全ての値のユニオン型
export type BorderValue = BorderStyleValue | BorderWidthValue | BorderColorValue;

// Cursor values
export type CursorValue =
    | "auto"
    | "default"
    | "pointer"
    | "wait"
    | "text"
    | "move"
    | "not-allowed"
    | "grab"
    | "grabbing"
    | "zoom-in"
    | "zoom-out"
    | "help"
    | "crosshair";

// Animation property 関連の型
export type AnimationNameValue = string;
export type AnimationDurationValue = string;
export type AnimationTimingFunctionValue =
    | "ease"
    | "ease-in"
    | "ease-out"
    | "ease-in-out"
    | "linear"
    | "step-start"
    | "step-end"
    | string;
export type AnimationDelayValue = string;
export type AnimationIterationCountValue = string | "infinite";
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

export type AnimationValue = AnimationValueBase | AnimationValueBase[] | AnimationValueBase[][];

// Font関連の型
export type FontStyleValue = "normal" | "italic" | "oblique" | string;
export type FontWeightValue =
    | "normal"
    | "bold"
    | "bolder"
    | "lighter"
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900";
export type FontSizeValue = string;
export type LineHeightValue = string | "normal";
export type FontFamilyValue = string | string[];

// Font用の全ての値のユニオン型
export type FontValueType = FontStyleValue | FontWeightValue | FontSizeValue | LineHeightValue | FontFamilyValue;

// Font複合型（シンプル化）
export type FontValue = string | string[] | string[];

// Grid Template Areas用の型定義
export type GridTemplateAreasValue = "none" | string | string[]; // 複数行のグリッド定義

// Grid関連の複合プロパティのためのカンマと空白区切り型
export type GridTemplateValue = string | string[] | string[][];
export type GridTemplateColumnsValue = string | string[] | string[][] | "none";
export type GridTemplateRowsValue = string | string[] | string[][] | "none";

// Transform関数の型
export type TransformFunctionValue = string;

// Transform複合型（シンプル化）
export type TransformValue = "none" | TransformFunctionValue | TransformFunctionValue[] | string[];

// Transition property 関連の型
export type TransitionPropertyValue = string | "none" | "all";
export type TransitionDurationValue = string;
export type TransitionTimingFunctionValue =
    | "ease"
    | "ease-in"
    | "ease-out"
    | "ease-in-out"
    | "linear"
    | "step-start"
    | "step-end"
    | string;
export type TransitionDelayValue = string;

// Transition複合型
export type TransitionValue =
    | string
    | string[] // 空白区切りの値
    | string[][]; // カンマと空白区切りの値

// Main CSS Properties type
export type Properties = Partial<{
    // A
    align_content: AlignContentKeyword | PGlobal;
    align_items: AlignItemsValue | PGlobal;
    align_self: AlignSelfValue | PGlobal;
    alignment_baseline: AlignmentBaselineValue | PGlobal;
    all: PGlobal;
    anchor_name: string | string[][];
    animation: AnimationValue | PAnimationGlobal;
    animation_composition: AnimationCompositionValue | AnimationCompositionValue[] | PAnimationGlobal;
    animation_delay: string | string[][] | PAnimationGlobal;
    animation_direction: AnimationDirectionValue | AnimationDirectionValue[][] | PAnimationGlobal;
    animation_duration: string | string[][] | PAnimationGlobal;
    animation_fill_mode: AnimationFillModeValue | AnimationFillModeValue[][] | PAnimationGlobal;
    animation_iteration_count: AnimationIterationCountValue | AnimationIterationCountValue[][] | PAnimationGlobal;
    animation_name: string | string[][] | PAnimationGlobal;
    animation_play_state: AnimationPlayStateValue | AnimationPlayStateValue[][] | PAnimationGlobal;
    animation_range: string | string[] | string[][] | PAnimationGlobal;
    animation_range_end: string | string[] | string[][] | PAnimationGlobal;
    animation_range_start: string | string[] | string[][] | PAnimationGlobal;
    animation_timeline: string | string[][] | PAnimationGlobal;
    animation_timing_function: AnimationTimingFunctionValue | AnimationTimingFunctionValue[][] | PAnimationGlobal;
    appearance: "none" | "auto" | PGlobal;
    aspect_ratio: "auto" | string | [string, "/", string];

    // B
    backdrop_filter: string | string[] | PGlobal;
    backface_visibility: "visible" | "hidden" | PGlobal;
    background: string | string[] | string[][] | PGlobal;
    background_attachment: "scroll" | "fixed" | "local" | string | string[] | string[][] | PGlobal;
    background_blend_mode: string | string[] | string[][] | PGlobal;
    background_clip: "border-box" | "padding-box" | "content-box" | "text" | string | string[] | string[][] | PGlobal;
    background_color: string | PColorGlobal;
    background_image: string | string[] | string[][] | PGlobal;
    background_origin: "border-box" | "padding-box" | "content-box" | string | string[] | string[][] | PGlobal;
    background_position: BackgroundPositionValue | BackgroundPositionValue[] | BackgroundPositionValue[][] | PGlobal;
    background_repeat:
        | "repeat"
        | "repeat-x"
        | "repeat-y"
        | "no-repeat"
        | "space"
        | "round"
        | string
        | string[]
        | string[][]
        | PGlobal;
    background_size: string | string[] | string[][] | PGlobal;
    block_size: string | "auto" | PGlobal;
    border: BorderValue | BorderValue[] | PGlobal;
    border_block: string | PGlobal;
    border_block_color: string | PGlobal;
    border_block_end: BorderValue | BorderValue[] | PGlobal;
    border_block_end_color: string | PGlobal;
    border_block_end_style: BorderStyleValue | PGlobal;
    border_block_end_width: string | PGlobal;
    border_block_start: string | PGlobal;
    border_block_start_color: string | PGlobal;
    border_block_start_style: BorderStyleValue | PGlobal;
    border_block_start_width: string | PGlobal;
    border_block_style: BorderStyleValue | PGlobal;
    border_block_width: string | PGlobal;
    border_bottom: string | PGlobal;
    border_bottom_color: string | PGlobal;
    border_bottom_left_radius: string | PGlobal;
    border_bottom_right_radius: string | PGlobal;
    border_bottom_style: BorderStyleValue | PGlobal;
    border_bottom_width: string | PGlobal;
    border_collapse: "collapse" | "separate" | PGlobal;
    border_color: string | string[] | PGlobal;
    border_end_end_radius: string | PGlobal;
    border_end_start_radius: string | PGlobal;
    border_image: string | PGlobal;
    border_image_outset: string | string[] | PGlobal;
    border_image_repeat: "stretch" | "repeat" | "round" | "space" | string | string[] | PGlobal;
    border_image_slice: string | string[] | PGlobal;
    border_image_source: string | PGlobal;
    border_image_width: string | string[] | PGlobal;
    border_inline: string | PGlobal;
    border_inline_color: string | PGlobal;
    border_inline_end: string | PGlobal;
    border_inline_end_color: string | PGlobal;
    border_inline_end_style: BorderStyleValue | PGlobal;
    border_inline_end_width: string | PGlobal;
    border_inline_start: BorderValue | BorderValue[] | PGlobal;
    border_inline_start_color: string | PGlobal;
    border_inline_start_style: BorderStyleValue | PGlobal;
    border_inline_start_width: string | PGlobal;
    border_inline_style: BorderStyleValue | PGlobal;
    border_inline_width: string | PGlobal;
    border_left: string | PGlobal;
    border_left_color: string | PGlobal;
    border_left_style: BorderStyleValue | PGlobal;
    border_left_width: string | PGlobal;
    border_radius: string | string[] | PGlobal;
    border_right: string | PGlobal;
    border_right_color: string | PGlobal;
    border_right_style: BorderStyleValue | PGlobal;
    border_right_width: string | PGlobal;
    border_spacing: string | string[] | PGlobal;
    border_start_end_radius: string | PGlobal;
    border_start_start_radius: string | PGlobal;
    border_style: BorderStyleValue | string | string[] | PGlobal;
    border_top: string | PGlobal;
    border_top_color: string | PGlobal;
    border_top_left_radius: string | PGlobal;
    border_top_right_radius: string | PGlobal;
    border_top_style: BorderStyleValue | PGlobal;
    border_top_width: string | PGlobal;
    border_width: string | string[] | PGlobal;
    bottom: string | "auto" | PGlobal;
    box_decoration_break: "slice" | "clone" | PGlobal;
    box_shadow: string | string[] | string[][] | PGlobal;
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
    caption_side: "top" | "bottom" | PGlobal;
    caret_color: string | "auto" | PGlobal;
    clear: "none" | "left" | "right" | "both" | "inline-start" | "inline-end" | PGlobal;
    clip: string | "auto" | PGlobal;
    clip_path: string | PGlobal;
    color: string | PColorGlobal;
    color_scheme: string | string[] | PGlobal;
    column_count: string | "auto" | PGlobal;
    column_fill: "auto" | "balance" | "balance-all" | PGlobal;
    column_gap: string | "normal" | PGlobal;
    column_rule: string | PGlobal;
    column_rule_color: string | PGlobal;
    column_rule_style: BorderStyleValue | PGlobal;
    column_rule_width: string | PGlobal;
    column_span: "none" | "all" | PGlobal;
    column_width: string | "auto" | PGlobal;
    columns: string | string[] | PGlobal;
    contain: "none" | "strict" | "content" | "size" | "layout" | "style" | "paint" | string | string[] | PGlobal;
    contain_intrinsic_block_size: string | "none" | PGlobal;
    contain_intrinsic_height: string | "none" | PGlobal;
    contain_intrinsic_inline_size: string | "none" | PGlobal;
    contain_intrinsic_size: string | string[] | "none" | PGlobal;
    contain_intrinsic_width: string | "none" | PGlobal;
    content: string | "normal" | "none" | PGlobal;
    content_visibility: "visible" | "auto" | "hidden" | PGlobal;
    counter_increment: string | string[] | "none" | PGlobal;
    counter_reset: string | string[] | "none" | PGlobal;
    counter_set: string | string[] | "none" | PGlobal;
    cursor: CursorValue | string | string[] | PGlobal;

    // D
    direction: "ltr" | "rtl" | PGlobal;
    display: DisplayValue | DisplayMultiValue | PGlobal;

    // E
    empty_cells: "show" | "hide" | PGlobal;

    // F
    filter: string | string[] | PGlobal;
    flex: string | string[] | "auto" | "none" | PGlobal;
    flex_basis: string | "auto" | "fill" | "max-content" | "min-content" | "fit-content" | PGlobal;
    flex_direction: FlexDirectionValue | PGlobal;
    flex_flow: FlexFlowMultiValue | PGlobal;
    flex_grow: string | PGlobal;
    flex_shrink: string | PGlobal;
    flex_wrap: FlexWrapValue | PGlobal;
    float: "left" | "right" | "none" | "inline-start" | "inline-end" | PGlobal;
    font: FontValue | PFontGlobal;
    // その他のカンマ区切りと空白区切りの組み合わせが可能なプロパティ
    font_family: string | string[] | string[][] | PFontGlobal;
    font_feature_settings: string | string[] | "normal" | PFontGlobal;
    font_kerning: "auto" | "normal" | "none" | PFontGlobal;
    font_language_override: string | "normal" | PFontGlobal;
    font_optical_sizing: "auto" | "none" | PFontGlobal;
    font_size: string | PFontGlobal;
    font_size_adjust: string | "none" | PFontGlobal;
    font_stretch: string | PFontGlobal;
    font_style: "normal" | "italic" | "oblique" | string | PFontGlobal;
    font_synthesis: "none" | "weight" | "style" | string | string[] | PFontGlobal;
    font_variant: string | string[] | "normal" | "none" | PFontGlobal;
    font_variant_alternates: string | "normal" | PFontGlobal;
    font_variant_caps:
        | "normal"
        | "small-caps"
        | "all-small-caps"
        | "petite-caps"
        | "all-petite-caps"
        | "unicase"
        | "titling-caps"
        | PFontGlobal;
    font_variant_east_asian: string | string[] | "normal" | PFontGlobal;
    font_variant_ligatures: string | string[] | "normal" | "none" | PFontGlobal;
    font_variant_numeric: string | string[] | "normal" | PFontGlobal;
    font_variant_position: "normal" | "sub" | "super" | PFontGlobal;
    font_variation_settings: string | string[] | "normal" | PFontGlobal;
    font_weight: FontWeightValue | PFontGlobal;

    // G
    gap: string | string[] | PGlobal;
    grid: string | string[] | string[][] | PGlobal;
    grid_area: string | PGlobal;
    grid_auto_columns: string | string[] | PGlobal;
    grid_auto_flow: "row" | "column" | "dense" | string | string[] | PGlobal;
    grid_auto_rows: string | string[] | PGlobal;
    grid_column: string | string[] | "auto" | PGlobal;
    grid_column_end: string | "auto" | PGlobal;
    grid_column_gap: string | PGlobal;
    grid_column_start: string | "auto" | PGlobal;
    grid_gap: string | string[] | PGlobal;
    grid_row: string | string[] | "auto" | PGlobal;
    grid_row_end: string | "auto" | PGlobal;
    grid_row_gap: string | PGlobal;
    grid_row_start: string | "auto" | PGlobal;
    grid_template: GridTemplateValue | PGlobal;
    grid_template_areas: GridTemplateAreasValue | PGlobal;
    grid_template_columns: GridTemplateColumnsValue | PGlobal;
    grid_template_rows: GridTemplateRowsValue | PGlobal;

    // H
    hanging_punctuation: "none" | "first" | "last" | "force-end" | "allow-end" | string | string[] | PGlobal;
    height: string | "auto" | "max-content" | "min-content" | "fit-content" | PGlobal;
    hyphens: "none" | "manual" | "auto" | PGlobal;

    // I
    image_orientation: string | "none" | "from-image" | PGlobal;
    image_rendering: "auto" | "crisp-edges" | "pixelated" | PGlobal;
    image_resolution: string | PGlobal;
    inline_size: string | "auto" | PGlobal;
    inset: string | string[] | "auto" | PGlobal;
    inset_block: string | string[] | "auto" | PGlobal;
    inset_block_end: string | "auto" | PGlobal;
    inset_block_start: string | "auto" | PGlobal;
    inset_inline: string | string[] | "auto" | PGlobal;
    inset_inline_end: string | "auto" | PGlobal;
    inset_inline_start: string | "auto" | PGlobal;
    isolation: "auto" | "isolate" | PGlobal;

    // J
    justify_content: JustifyContentValue | PGlobal;
    justify_items:
        | "start"
        | "end"
        | "center"
        | "stretch"
        | "self-start"
        | "self-end"
        | "flex-start"
        | "flex-end"
        | "left"
        | "right"
        | string
        | PGlobal;
    justify_self:
        | "auto"
        | "start"
        | "end"
        | "center"
        | "stretch"
        | "self-start"
        | "self-end"
        | "flex-start"
        | "flex-end"
        | "left"
        | "right"
        | PGlobal;

    // L
    left: string | "auto" | PGlobal;
    letter_spacing: string | "normal" | PGlobal;
    line_break: "auto" | "loose" | "normal" | "strict" | "anywhere" | PGlobal;
    line_height: string | "normal" | PGlobal;
    list_style: string | string[] | PGlobal;
    list_style_image: string | "none" | PGlobal;
    list_style_position: "inside" | "outside" | PGlobal;
    list_style_type: string | "none" | PGlobal;

    // M
    margin: string | string[] | "auto" | PBoxModelGlobal;
    margin_block: string | string[] | "auto" | PBoxModelGlobal;
    margin_block_end: string | "auto" | PBoxModelGlobal;
    margin_block_start: string | "auto" | PBoxModelGlobal;
    margin_bottom: string | "auto" | PBoxModelGlobal;
    margin_inline: string | string[] | "auto" | PBoxModelGlobal;
    margin_inline_end: string | "auto" | PBoxModelGlobal;
    margin_inline_start: string | "auto" | PBoxModelGlobal;
    margin_left: string | "auto" | PBoxModelGlobal;
    margin_right: string | "auto" | PBoxModelGlobal;
    margin_top: string | "auto" | PBoxModelGlobal;
    mask: string | string[] | PGlobal;
    mask_border: string | PGlobal;
    mask_border_mode: "luminance" | "alpha" | PGlobal;
    mask_border_outset: string | string[] | PGlobal;
    mask_border_repeat: string | string[] | PGlobal;
    mask_border_slice: string | string[] | PGlobal;
    mask_border_source: string | "none" | PGlobal;
    mask_border_width: string | string[] | "auto" | PGlobal;
    mask_clip:
        | string
        | string[]
        | "content-box"
        | "padding-box"
        | "border-box"
        | "margin-box"
        | "fill-box"
        | "stroke-box"
        | "view-box"
        | "no-clip"
        | PGlobal;
    mask_composite: string | string[] | PGlobal;
    mask_image: string | string[] | "none" | PGlobal;
    mask_mode: string | string[] | "alpha" | "luminance" | "match-source" | PGlobal;
    mask_origin:
        | string
        | string[]
        | "content-box"
        | "padding-box"
        | "border-box"
        | "margin-box"
        | "fill-box"
        | "stroke-box"
        | "view-box"
        | PGlobal;
    mask_position: string | string[] | string[][] | PGlobal;
    mask_repeat: string | string[] | PGlobal;
    mask_size: string | string[] | "auto" | "cover" | "contain" | PGlobal;
    mask_type: "luminance" | "alpha" | PGlobal;
    max_block_size: string | "none" | PGlobal;
    max_height: string | "none" | "max-content" | "min-content" | "fit-content" | PGlobal;
    max_inline_size: string | "none" | PGlobal;
    max_width: string | "none" | "max-content" | "min-content" | "fit-content" | PGlobal;
    min_block_size: string | "auto" | PGlobal;
    min_height: string | "auto" | "max-content" | "min-content" | "fit-content" | PGlobal;
    min_inline_size: string | "auto" | PGlobal;
    min_width: string | "auto" | "max-content" | "min-content" | "fit-content" | PGlobal;
    mix_blend_mode: string | PGlobal;

    // O
    object_fit: "fill" | "contain" | "cover" | "none" | "scale-down" | PGlobal;
    object_position: string | string[] | PGlobal;
    offset: string | string[] | PGlobal;
    offset_anchor: string | string[] | "auto" | PGlobal;
    offset_distance: string | PGlobal;
    offset_path: string | "none" | PGlobal;
    offset_rotate: string | "auto" | "reverse" | PGlobal;
    opacity: string | PGlobal;
    order: string | PGlobal;
    orphans: string | PGlobal;
    outline: string | string[] | PGlobal;
    outline_color: string | "invert" | PGlobal;
    outline_offset: string | PGlobal;
    outline_style: BorderStyleValue | "auto" | PGlobal;
    outline_width: string | PGlobal;
    overflow: OverflowValue | OverflowMultiValue | PGlobal;
    overflow_anchor: "auto" | "none" | PGlobal;
    overflow_block: OverflowValue | PGlobal;
    overflow_clip_margin: string | "content-box" | PGlobal;
    overflow_inline: OverflowValue | PGlobal;
    overflow_wrap: "normal" | "break-word" | "anywhere" | PGlobal;
    overflow_x: OverflowValue | PGlobal;
    overflow_y: OverflowValue | PGlobal;
    overscroll_behavior: "auto" | "contain" | "none" | string | string[] | PGlobal;
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
    paint_order: "normal" | "fill" | "stroke" | "markers" | string | string[] | PGlobal;
    perspective: string | "none" | PGlobal;
    perspective_origin: string | string[] | PGlobal;
    place_content: string | string[] | PGlobal;
    place_items: string | string[] | PGlobal;
    place_self: string | string[] | PGlobal;
    pointer_events:
        | "auto"
        | "none"
        | "visiblePainted"
        | "visibleFill"
        | "visibleStroke"
        | "visible"
        | "painted"
        | "fill"
        | "stroke"
        | "all"
        | PGlobal;
    position: PositionValue | PPositionGlobal;

    // Q
    quotes: string | string[] | "auto" | "none" | PGlobal;

    // R
    resize: "none" | "both" | "horizontal" | "vertical" | "block" | "inline" | PGlobal;
    right: string | "auto" | PGlobal;
    rotate: string | "none" | PGlobal;
    row_gap: string | "normal" | PGlobal;

    // S
    scale: string | string[] | "none" | PGlobal;
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
    scroll_padding: string | string[] | "auto" | PGlobal;
    scroll_padding_block: string | string[] | "auto" | PGlobal;
    scroll_padding_block_end: string | "auto" | PGlobal;
    scroll_padding_block_start: string | "auto" | PGlobal;
    scroll_padding_bottom: string | "auto" | PGlobal;
    scroll_padding_inline: string | string[] | "auto" | PGlobal;
    scroll_padding_inline_end: string | "auto" | PGlobal;
    scroll_padding_inline_start: string | "auto" | PGlobal;
    scroll_padding_left: string | "auto" | PGlobal;
    scroll_padding_right: string | "auto" | PGlobal;
    scroll_padding_top: string | "auto" | PGlobal;
    scroll_snap_align: "none" | "start" | "end" | "center" | string | string[] | PGlobal;
    scroll_snap_stop: "normal" | "always" | PGlobal;
    scroll_snap_type: "none" | "x" | "y" | "block" | "inline" | "both" | string | string[] | PGlobal;
    scrollbar_color: string | string[] | "auto" | PGlobal;
    scrollbar_width: "auto" | "thin" | "none" | PGlobal;
    shape_image_threshold: string | PGlobal;
    shape_margin: string | PGlobal;
    shape_outside: "none" | "margin-box" | "content-box" | "border-box" | "padding-box" | string | PGlobal;
    tab_size: string | PGlobal;
    table_layout: "auto" | "fixed" | PGlobal;
    text_align: TextAlignValue | PGlobal;
    text_align_last: TextAlignValue | "auto" | PGlobal;
    text_combine_upright: "none" | "all" | string | PGlobal;
    text_decoration: TextDecorationMultiValue | PGlobal;
    text_decoration_color: string | PGlobal;
    text_decoration_line: TextDecorationLineValue | string | string[] | PGlobal;
    text_decoration_skip:
        | "none"
        | "objects"
        | "spaces"
        | "ink"
        | "edges"
        | "box-decoration"
        | string
        | string[]
        | PGlobal;
    text_decoration_skip_ink: "auto" | "none" | "all" | PGlobal;
    text_decoration_style: "solid" | "double" | "dotted" | "dashed" | "wavy" | PGlobal;
    text_decoration_thickness: string | "auto" | "from-font" | PGlobal;
    text_emphasis: string | string[] | PGlobal;
    text_emphasis_color: string | PGlobal;
    text_emphasis_position: string | string[] | PGlobal;
    text_emphasis_style:
        | "none"
        | "filled"
        | "open"
        | "dot"
        | "circle"
        | "double-circle"
        | "triangle"
        | "sesame"
        | string
        | PGlobal;
    text_indent: string | PGlobal;
    text_justify: "auto" | "inter-character" | "inter-word" | "none" | PGlobal;
    text_orientation: "mixed" | "upright" | "sideways" | PGlobal;
    text_overflow: "clip" | "ellipsis" | string | PGlobal;
    text_rendering: "auto" | "optimizeSpeed" | "optimizeLegibility" | "geometricPrecision" | PGlobal;
    text_shadow: string | string[] | string[][] | "none" | PGlobal;
    text_size_adjust: "none" | "auto" | string | PGlobal;
    text_transform: TextTransformValue | PGlobal;
    text_underline_offset: string | "auto" | PGlobal;
    text_underline_position: "auto" | "from-font" | "under" | "left" | "right" | string | string[] | PGlobal;
    top: string | "auto" | PGlobal;
    touch_action:
        | "auto"
        | "none"
        | "pan-x"
        | "pan-y"
        | "pan-left"
        | "pan-right"
        | "pan-up"
        | "pan-down"
        | "pinch-zoom"
        | "manipulation"
        | string
        | string[]
        | PGlobal;
    transform: TransformValue | PGlobal;
    transform_box: "content-box" | "border-box" | "fill-box" | "stroke-box" | "view-box" | PGlobal;
    transform_origin: string | string[] | string[][] | PGlobal;
    transform_style: "flat" | "preserve-3d" | PGlobal;
    transition: TransitionValue | PTransitionGlobal;
    transition_delay: string | string[] | string[][] | PTransitionGlobal;
    transition_duration: string | string[] | string[][] | PTransitionGlobal;
    transition_property:
        | TransitionPropertyValue
        | TransitionPropertyValue[]
        | TransitionPropertyValue[][]
        | PTransitionGlobal;
    transition_timing_function:
        | TransitionTimingFunctionValue
        | TransitionTimingFunctionValue[]
        | TransitionTimingFunctionValue[][]
        | PTransitionGlobal;
    translate: string | string[] | "none" | PGlobal;

    // U
    unicode_bidi: "normal" | "embed" | "isolate" | "bidi-override" | "isolate-override" | "plaintext" | PGlobal;
    user_select: "auto" | "none" | "text" | "contain" | "all" | PGlobal;

    // V
    vertical_align:
        | "baseline"
        | "sub"
        | "super"
        | "text-top"
        | "text-bottom"
        | "middle"
        | "top"
        | "bottom"
        | string
        | PGlobal;
    visibility: "visible" | "hidden" | "collapse" | PGlobal;

    // W
    white_space: "normal" | "nowrap" | "pre" | "pre-wrap" | "pre-line" | "break-spaces" | PGlobal;
    widows: string | PGlobal;
    width: string | "auto" | "max-content" | "min-content" | "fit-content" | PGlobal;
    will_change: string | string[] | "auto" | PGlobal;
    word_break: "normal" | "break-all" | "keep-all" | "break-word" | PGlobal;
    word_spacing: string | "normal" | PGlobal;
    word_wrap: "normal" | "break-word" | PGlobal;
    writing_mode: "horizontal-tb" | "vertical-rl" | "vertical-lr" | "sideways-rl" | "sideways-lr" | PGlobal;

    // Z
    z_index: string | "auto" | PGlobal;

    // // ベンダープレフィックスなしでウェブキット特有のプロパティ
    // webkit_appearance: string | "none" | "auto" | PGlobal;
    // webkit_font_smoothing: "auto" | "none" | "antialiased" | "subpixel-antialiased" | PGlobal;
    // webkit_line_clamp: string | "none" | PGlobal;
    // webkit_overflow_scrolling: "auto" | "touch" | PGlobal;
    // webkit_tap_highlight_color: string | PGlobal;
    // webkit_text_fill_color: string | PGlobal;
    // webkit_text_stroke: string | string[] | PGlobal;
    // webkit_text_stroke_color: string | PGlobal;
    // webkit_text_stroke_width: string | PGlobal;

    // // moz特有のプロパティ
    // moz_appearance: string | "none" | "auto" | PGlobal;
    // moz_osx_font_smoothing: "auto" | "grayscale" | PGlobal;

    // CSS変数
    [key: `--${string}`]: string;
}>;
