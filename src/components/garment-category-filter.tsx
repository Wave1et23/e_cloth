"use client";

import { usePathname, useRouter } from "next/navigation";

type Props = {
  categories: string[];
  selected: string[];
};

export function GarmentCategoryFilter({ categories, selected }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isAll = selected.length === 0;

  function apply(nextSelected: string[]) {
    const params = new URLSearchParams();
    for (const category of nextSelected) {
      params.append("category", category);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function toggle(category: string) {
    const active = selected.includes(category);
    const next = categories.filter((item) =>
      item === category ? !active : selected.includes(item),
    );
    apply(next);
  }

  return (
    <nav className="category-scroll" aria-label="按类别筛选">
      <button
        type="button"
        className={`category-chip${isAll ? " is-active" : ""}`}
        aria-pressed={isAll}
        onClick={() => apply([])}
      >
        全部
      </button>
      {categories.map((category) => {
        const active = selected.includes(category);
        return (
          <button
            key={category}
            type="button"
            className={`category-chip${active ? " is-active" : ""}`}
            aria-pressed={active}
            onClick={() => toggle(category)}
          >
            {category}
          </button>
        );
      })}
    </nav>
  );
}
