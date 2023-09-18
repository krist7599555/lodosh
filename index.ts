import * as Arr from "@effect/data/ReadonlyArray";
import { dual, pipe, constant } from "@effect/data/Function";
import { omit, pick } from "@effect/data/Struct";

export { dual, pipe, constant, omit, pick };

type TNonEmptyArray<T> = [T, ...T[]];

export const arr_sum = (arr: readonly number[]): number =>
  arr.reduce((acc, it) => acc + it, 0);
export const arr_max = (arr: readonly number[]): number => {
  return Math.max(...ensure_nonempty_array(arr));
}
export const arr_min = (arr: readonly number[]): number => {
  return Math.min(...ensure_nonempty_array(arr));
}

export const max_by: {
  <T>(arr: readonly T[], fn: (it: T) => number): T;
  <T>(fn: (it: T) => number): (arr: readonly T[]) => T;
} = dual(
  2,
  <T>(arr: readonly T[], fn: (it: T) => number): T =>
    arr_reduce(arr.slice(1), ensure_nonempty_array(arr)[0], (acc, it) =>
      fn(it) > fn(acc) ? it : acc
    )
);

export const min_by: {
  <T>(arr: readonly T[], fn: (it: T) => number): T;
  <T>(fn: (it: T) => number): (arr: readonly T[]) => T;
} = dual(
  2,
  <T>(arr: readonly T[], fn: (it: T) => number): T =>
    arr_reduce(arr.slice(1), ensure_nonempty_array(arr)[0], (acc, it) =>
      fn(it) < fn(acc) ? it : acc
    )
);

export const count_by: {
  <T>(arr: readonly T[], fn: (it: T) => boolean): number;
  <T>(fn: (it: T) => boolean): (arr: readonly T[]) => number;
} = dual(2, <T>(arr: readonly T[], fn: (it: T) => boolean): number =>
  arr_sum(arr.map((it) => (fn(it) ? 1 : 0)))
);
export const sum_by: {
  <T>(arr: readonly T[], fn: (it: T) => number): number;
  <T>(fn: (it: T) => number): (arr: readonly T[]) => number;
} = dual(2, <T>(arr: readonly T[], fn: (it: T) => number): number =>
  arr_sum(arr.map(fn))
);
export const avg_by: {
  <T>(arr: readonly T[], fn: (it: T) => number): number;
  <T>(fn: (it: T) => number): (arr: readonly T[]) => number;
} = dual(2, <T>(arr: readonly T[], fn: (it: T) => number): number => {
  return arr.length > 0 ? arr_sum(arr.map(fn)) / arr.length : 0;
});

export const to_jsmap = <Row extends { id: string }>(
  arr: readonly Row[]
): Map<Row["id"], Row> => {
  return new Map(arr.map((row) => [row.id, row] as const));
};

export const sort_by: {
  <T>(
    arr: readonly T[],
    fn: (it: T) => ["asc" | "desc", number | string][]
  ): T[];
  <T>(fn: (it: T) => ["asc" | "desc", number | string][]): (
    arr: readonly T[]
  ) => T[];
} = dual(
  2,
  <T>(
    arr: readonly T[],
    fn: (it: T) => ["asc" | "desc", number | string][]
  ): T[] => {
    const res = Arr.sort(arr, {
      compare(lhs: T, rhs: T) {
        const ll = fn(lhs);
        const rr = fn(rhs);
        for (const [[dirl, l], [dirr, r]] of zip(ll, rr)) {
          if (dirl != "asc" && dirl != "desc")
            throw new Error(
              `can not unknow sort order. expect asc|desc, got ${dirl}`
            );
          if (dirl != dirr)
            throw new Error(
              `can not sort inconsisitency sort order asc|desc l, r`
            );
          const dir = dirl;
          if (typeof l != typeof r)
            throw new Error(
              `can not sort inconsisitency type compare(${typeof l}, ${typeof r})`
            );
          if (l < r) return dir == "asc" ? -1 : 1;
          if (l > r) return dir == "asc" ? 1 : -1;
        }
        return 0;
      },
    });
    return res;
  }
);

export function is_non_empty_array<T>(arr: readonly T[]): arr is [T, ...T[]] {
  return arr.length > 0;
}

export const arr_map: {
  <I, O>(fn: (it: I) => O): (arr: readonly I[]) => O[];
  <I, O>(arr: readonly I[], fn: (it: I) => O): O[];
} = dual(2, <I, O>(arr: readonly I[], fn: (it: I) => O): O[] => {
  return arr.map(fn);
});
export const arr_filter_map: {
  <I, O>(fn: (it: I) => O | null): (arr: readonly I[]) => O[];
  <I, O>(arr: readonly I[], fn: (it: I) => O | null): O[];
} = dual(2, <I, O>(arr: readonly I[], fn: (it: I) => O | null): O[] => {
  return arr
    .map(fn)
    .filter((it): it is Exclude<typeof it, null> => it !== null);
});
export const arr_filter: {
  <I>(fn: (it: I) => boolean): (arr: readonly I[]) => I[];
  <I>(arr: readonly I[], fn: (it: I) => boolean): I[];
  <I, O extends I>(fn: (it: I) => it is O): (arr: readonly I[]) => O[];
  <I, O extends I>(arr: readonly I[], fn: (it: I) => it is O): O[];
} = dual(2, <I>(arr: readonly I[], fn: (it: I) => boolean): I[] => {
  return arr.filter(fn);
});

export const arr_flatmap: {
  <I, O>(fn: (it: I) => O[]): (arr: readonly I[]) => O[];
  <I, O>(arr: readonly I[], fn: (it: I) => O[]): O[];
} = dual(2, <I, O>(arr: readonly I[], fn: (it: I) => O[]): O[] => {
  return arr.flatMap(fn);
});

export const arr_reduce: {
  <I, O>(init: O, fn: (acc: O, it: I) => O): (arr: readonly I[]) => O;
  <I, O>(arr: readonly I[], init: O, fn: (acc: O, it: I) => O): O;
} = dual(3, <I, O>(arr: readonly I[], init: O, fn: (acc: O, it: I) => O): O => {
  return arr.reduce(fn, init);
});

export const arr_cross: {
  <A, B>(as: readonly A[], bs: readonly B[]): (readonly [A, B])[];
  <B>(bs: readonly B[]): <A>(as: readonly A[]) => (readonly [A, B])[];
} = dual(2, <A, B>(as: readonly A[], bs: readonly B[]): (readonly [A, B])[] => {
  return as.flatMap((a) => bs.map((b) => [a, b]));
});
export const arr_cross3: {
  <A, B, C>(as: readonly A[], bs: readonly B[], cs: readonly C[]): (readonly [
    A,
    B,
    C
  ])[];
  <B, C>(bs: readonly B[], cs: readonly C[]): <A>(
    as: readonly A[]
  ) => (readonly [A, B, C])[];
} = dual(
  3,
  <A, B, C>(
    as: readonly A[],
    bs: readonly B[],
    cs: readonly C[]
  ): (readonly [A, B, C])[] => {
    return as.flatMap((a) => bs.flatMap((b) => cs.map((c) => [a, b, c])));
  }
);

export const group_by: {
  <T, K>(arr: readonly T[], get_key: (it: T) => K): [K, TNonEmptyArray<T>][];
  <T, K>(get_key: (it: T) => K): (
    arr: readonly T[]
  ) => [K, TNonEmptyArray<T>][];
} = dual(
  2,
  <T, K>(
    arr: readonly T[],
    get_key: (it: T) => K
  ): [K, TNonEmptyArray<T>][] => {
    const res: [K, TNonEmptyArray<T>][] = [];
    for (const it of arr) {
      const key = get_key(it);
      const group = res.find((it) => it[0] === key);
      if (group) {
        group[1].push(it);
      } else {
        res.push([key, [it]]);
      }
    }
    return res;
  }
);
export const group_by_with: {
  <T, K extends string, O>(
    arr: readonly T[],
    get_key: (it: T) => K,
    fn: (it: TNonEmptyArray<T>) => O
  ): (readonly [K, O])[];
  <T, K extends string, O>(
    get_key: (it: T) => K,
    fn: (it: TNonEmptyArray<T>) => O
  ): (arr: readonly T[]) => (readonly [K, O])[];
} = dual(
  3,
  <T, K extends string, O>(
    arr: readonly T[],
    get_key: (it: T) => K,
    fn: (it: TNonEmptyArray<T>) => O
  ): (readonly [K, O])[] => {
    return pipe(
      group_by(arr, get_key),
      arr_map(([k, v]) => [k, fn(v)] as const)
    );
  }
);

export const to_record = <K extends string, V>(
  arr: readonly (readonly [K, V])[]
): Record<K, V> => {
  // @ts-ignore stricker type
  return Object.fromEntries(arr);
};
export const to_entries = <K extends string, V>(
  arr: Record<K, V>
): [K, V][] => {
  // @ts-ignore stricker type
  return Object.entries(arr);
};

export const promise_all = <T>(arr: readonly T[]): Promise<Awaited<T>[]> => {
  return Promise.all(arr);
};

type TPartialMatch<T extends Record<string, unknown>> = {
  [key in keyof T as T[key] extends string | number ? key : never]?: T[key];
};

export const is_match: {
  <T extends Record<string, unknown>>(data: T, find: TPartialMatch<T>): boolean;
  <T extends Record<string, unknown>>(find: TPartialMatch<T>): (
    data: T
  ) => boolean;
} = dual(
  2,
  <T extends Record<string, unknown>>(
    data: T,
    find: TPartialMatch<T>
  ): boolean => {
    return to_entries(find).every(([k, v]) => data[k] === v);
  }
);

export const find_match: {
  <T extends Record<string, unknown>>(
    arr: readonly T[],
    find: TPartialMatch<T>
  ): T | undefined;
  <T extends Record<string, unknown>>(find: TPartialMatch<T>): (
    arr: readonly T[]
  ) => T | undefined;
} = dual(
  2,
  <T extends Record<string, unknown>>(
    arr: readonly T[],
    find: TPartialMatch<T>
  ): T | undefined => {
    return arr.find((it) => is_match(it, find));
  }
);

export const range = (n: number): number[] =>
  Array.from({ length: n }).map((_, i) => i);

export const range2 = (s: number, t: number): number[] =>
  Array.from({ length: t - s }).map((_, i) => s + i);

export const zip: {
  <A, B>(as: readonly A[], bs: readonly B[]): (readonly [A, B])[];
  <B>(bs: readonly B[]): <A>(as: readonly A[]) => (readonly [A, B])[];
} = dual(2, <A, B>(as: readonly A[], bs: readonly B[]): (readonly [A, B])[] =>
  pipe(
    range(Math.min(as.length, bs.length)),
    arr_map((i) => [as[i], bs[i]] as const)
  )
);

export const zip3: {
  <A, B, C>(as: readonly A[], bs: readonly B[], cs: readonly C[]): (readonly [
    A,
    B,
    C
  ])[];
  <B, C>(bs: readonly B[], cs: readonly C[]): <A>(
    as: readonly A[]
  ) => (readonly [A, B, C])[];
} = dual(
  3,
  <A, B, C>(
    as: readonly A[],
    bs: readonly B[],
    cs: readonly C[]
  ): (readonly [A, B, C])[] =>
    pipe(
      range(arr_min([as.length, bs.length, cs.length])),
      arr_map((i) => [as[i], bs[i], cs[i]] as const)
    )
);

export const zip_with: {
  <A, B, O>(as: readonly A[], bs: readonly B[], fn: (a: A, b: B) => O): O[];
  <A, B, O>(bs: readonly B[], fn: (a: A, b: B) => O): (as: readonly A[]) => O[];
} = dual(
  3,
  <A, B, O>(as: readonly A[], bs: readonly B[], fn: (a: A, b: B) => O): O[] =>
    pipe(
      zip(as, bs),
      arr_map(([a, b]) => fn(a, b))
    )
);

export const zip3_with: {
  <A, B, C, O>(
    as: readonly A[],
    bs: readonly B[],
    cs: readonly C[],
    fn: (a: A, b: B, c: C) => O
  ): O[];
  <A, B, C, O>(
    bs: readonly B[],
    cs: readonly C[],
    fn: (a: A, b: B, c: C) => O
  ): (as: readonly A[]) => O[];
} = dual(
  4,
  <A, B, C, O>(
    as: readonly A[],
    bs: readonly B[],
    cs: readonly C[],
    fn: (a: A, b: B, c: C) => O
  ): O[] =>
    pipe(
      zip3(as, bs, cs),
      arr_map(([a, b, c]) => fn(a, b, c))
    )
);

export const record_map: {
  <K extends string, I, O>(data: Record<K, I>, fn: (it: I) => O): Record<K, O>;
  <K extends string, I, O>(fn: (it: I) => O): (
    data: Record<K, I>
  ) => Record<K, O>;
} = dual(
  2,
  <K extends string, I, O>(
    data: Record<K, I>,
    fn: (it: I, key: K) => O
  ): Record<K, O> =>
    pipe(
      to_entries(data),
      arr_map(([k, v]) => [k, fn(v, k)] as const),
      to_record
    )
);

export const record_map_key: {
  <KI extends string, KO extends string, V>(
    data: Record<KI, V>,
    fn: (it: KI) => KO
  ): Record<KO, V>;
  <KI extends string, KO extends string, V>(fn: (it: KI) => KO): (
    data: Record<KI, V>
  ) => Record<KO, V>;
} = dual(
  2,
  <KI extends string, KO extends string, V>(
    data: Record<KI, V>,
    fn: (it: KI) => KO
  ): Record<KO, V> =>
    pipe(
      to_entries(data),
      arr_map(([k, v]) => [fn(k), v] as const),
      to_record
    )
);

export const record_keys = <T extends Record<string, any>>(
  data: T
): Extract<keyof T, string>[] =>
  // @ts-ignore
  Object.keys(data).filter(it => typeof it === 'string')

export const record_values = <K extends string, V>(data: Record<K, V>): V[] =>
  Object.values<V>(data);

export const is_empty_array = <T>(arr: readonly T[]): arr is [] => {
  return arr.length == 0;
};
export const is_nonempty_array = <T>(arr: readonly T[]): arr is [T, ...T[]] => {
  return arr.length > 0;
};
export const is_nil = <T>(arr: T): arr is Extract<T, null | undefined> => {
  return arr === null || arr === undefined;
};
export const is_notnil = <T>(arr: T): arr is Exclude<T, null | undefined> => {
  return arr !== null && arr !== undefined;
};

export const to_array = <T>(it: Iterable<T>): T[] => {
  return [...it];
};
export const noop = (..._args: unknown[]): void => {
  return;
};
export const ensure_nonempty_array = <T>(arr: readonly T[]): [T, ...T[]] => {
  if (is_nonempty_array(arr)) {
    return arr;
  } else {
    throw new Error("ensure_nonempty_array");
  }
};
export const ensure_integer = <T>(num: number): number => {
  if (Number.isInteger(num)) {
    return num;
  } else {
    throw new Error("ensure_integer");
  }
};
export const ensure_notnil = <T>(data: T): Exclude<T, null | undefined> => {
  if (is_notnil(data)) {
    return data;
  } else {
    throw new Error("ensure_notnil");
  }
};

export const wait = (duration_ms: number) => new Promise<void>(resolve => {
  return setTimeout(() => resolve(), duration_ms)
})

export const str_split: {
  (str: string, separator: string | RegExp): [string, ...string[]],
  (separator: string | RegExp): (str: string) => [string, ...string[]],
} = dual(
  2,
  (str: string, separator: string | RegExp): [string, ...string[]] =>
    // @ts-ignore only way to produce an empty array when a string is passed as separator https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split#description
    str.split(separator)
);

export const str_join: {
  (arr_str: string[], separator: string): string,
  (separator: string): (arr_str: string[]) => string,
} = dual(
  2,
  (arr_str: string[], separator: string): string =>
    arr_str.join(separator)
);

export const math_ceil = (num: number): number => Math.ceil(num)

export const math_floor = (num: number): number => Math.floor(num)

export const math_max: {
  (a: number, b: number): number,
  (a: number): (b: number) => number,
} = dual(2, Math.max);

export const math_min: {
  (a: number, b: number): number,
  (a: number): (b: number) => number,
} = dual(2, Math.min);

export const math_clamp: {
  (num: number, min_val: number, max_val: number): number,
  (min_val: number, max_val: number): (num: number) => number,
} = dual(3, 
  (num: number, min_val: number, max_val: number): number => pipe(
    num,
    math_max(min_val),
    math_min(max_val),
  )
)

export const math_divmod = (num: number, mod: number): [number, number] => {
  if (!Number.isInteger(num) && num > 0) throw new Error(`Expect positive integer got ${num}`)
  if (!Number.isInteger(mod) && num > 0) throw new Error(`Expect positive integer got ${num}`)
  return [Math.floor(num / mod), num % mod]
}