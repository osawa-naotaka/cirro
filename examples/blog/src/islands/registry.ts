import { Disclosure } from "./Disclosure";
import { ScrollTop } from "./ScrollTop";

// 島の単一の真実。ここに登録した名前を <Island name="..."> とクライアントの両方が参照する。
export default {
    disclosure: Disclosure,
    scrollTop: ScrollTop,
} as const;
