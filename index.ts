import * as Arr from "@effect/data/ReadonlyArray";
import { dual, pipe } from "@effect/data/Function";

export { constant, pipe } from "@effect/data/Function";
export { omit, pick } from "@effect/data/Struct";

type TNonEmptyArray<T> = [T, ...T[]];

export const arr_sum = (arr: readonly number[]): number =>
  arr.reduce((acc, it) => acc + it, 0);
export const arr_max = (arr: readonly number[]): number =>
  arr.reduce((acc, it) => Math.max(acc, it), 0);
export const arr_min = (arr: readonly number[]): number =>
  arr.reduce((acc, it) => Math.min(acc, it), 0);

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
        for (const [[dirl, l], [dirr, r]] of Arr.zip(ll, rr)) {
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

export const zip_with: {
  <A, B, C>(as: readonly A[], bs: readonly B[], fn: (a: A, b: B) => C): C[];
  <A, B, C>(bs: readonly B[], fn: (a: A, b: B) => C): (as: readonly A[]) => C[];
} = dual(
  3,
  <A, B, C>(as: readonly A[], bs: readonly B[], fn: (a: A, b: B) => C): C[] =>
    pipe(
      zip(as, bs),
      arr_map(([a, b]) => fn(a, b))
    )
);

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
export const ensure_notnil = <T>(data: T): Exclude<T, null | undefined> => {
  if (is_notnil(data)) {
    return data;
  } else {
    throw new Error("ensure_notnil");
  }
};
