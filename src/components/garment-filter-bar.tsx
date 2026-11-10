"use client";

import { usePathname, useRouter } from "next/navigation";

type Props = {
  param: "category" | "season";
  label: string;
  options: string[];
  selected: string[];
};

/** 两排筛选共用：只改自己的参数，保留另一组筛选。 */
export function GarmentFilterBar({ param, label, options, selected }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isAll = selected.length === 0;

  function apply(nextSelected: string[]) {
    const params = new URLSearchParams(window.location.search);
    params.delete(param);
    for (const value of nextSelected) {
      params.append(param, value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function toggle(value: string) {
    const active = selected.includes(value);
    const next = options.filter((item) =>
      item === value ? !active : selected.includes(item),
    );
    apply(next);
  }

  return (
    <nav className="category-scroll" aria-label={label}>
      <button
        type="button"
        className={`category-chip${isAll ? " is-active" : ""}`}
        aria-pressed={isAll}
        onClick={() => apply([])}
      >
        全部
      </button>
      {options.map((value) => {
        const active = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            className={`category-chip${active ? " is-active" : ""}`}
            aria-pressed={active}
            onClick={() => toggle(value)}
          >
            {value}
          </button>
        );
      })}
    </nav>
  );
}
