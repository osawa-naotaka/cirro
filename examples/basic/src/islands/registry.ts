import { Counter } from "./Counter";

// 島の単一の真実。ここに登録した名前を <Island name="..."> とクライアントの両方が参照する。
export default {
    counter: Counter,
} as const;
