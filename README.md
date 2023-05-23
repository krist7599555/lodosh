# @krist7599555/lodosh

[![npm @krist7599555/lodosh](https://img.shields.io/npm/v/@krist7599555/lodosh)](https://www.npmjs.com/package/@krist7599555/lodosh)

fp typescript utility function with data first + data last

```bash
pnpm i @krist7599555/lodosh
```

all function can be call in datafirst or datalast to make `pipe` function able to infer type correctly

```typescript
func(data, ...args); // data first
func(...args)(data); // data last
```

## example

```typescript
const out1 = pipe(
  movies,
  sort_by((it) => [
    ["desc", it.rate],
    ["acs", it.name],
  ])
);
const out2 = pipe(
  students,
  group_by_with(
    (it) => it.course,
    (its) => ({
      course_name: its[0].cource,
      average_grade: avg_by(its, (it) => it.grade),
      students: sort_by(its, (it) => [["asc", it.id]]),
      students_boys: arr_filter(its, is_match({ gender: "male" })),
    })
  )
);
```

## functions

```typescript
export const arr_filter_map:
export const arr_filter:
export const arr_flatmap:
export const arr_map:
export const arr_max:
export const arr_min:
export const arr_reduce:
export const arr_sum:
export const avg_by:
export const count_by:
export const ensure_nonempty_array:
export const ensure_notnil:
export const find_match:
export const group_by_with:
export const group_by:
export const is_match:
export const is_nil:
export const is_nonempty_array:
export const is_notnil:
export const max_by:
export const min_by:
export const noop:
export const promise_all:
export const range:
export const range2:
export const sort_by:
export const sum_by:
export const to_array:
export const to_jsmap:
export const zip_with:
export const zip:
```
