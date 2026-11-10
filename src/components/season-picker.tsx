"use client";

import { SEASON_OPTIONS } from "@/lib/garment-fields";
import { SEASON_OTHER } from "@/lib/season";

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
};

/** 春/夏/秋/冬 多选；「其他」表示空数组（未填写）。 */
export function SeasonPicker({ value, onChange }: Props) {
  const isOther = value.length === 0;

  function toggle(season: string) {
    onChange(
      SEASON_OPTIONS.filter((item) =>
        item === season ? !value.includes(item) : value.includes(item),
      ),
    );
  }

  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
      role="group"
      aria-label="季节（可多选）"
    >
      {SEASON_OPTIONS.map((season) => {
        const active = value.includes(season);
        return (
          <button
            key={season}
            type="button"
            className={`category-chip${active ? " is-active" : ""}`}
            aria-pressed={active}
            onClick={() => toggle(season)}
          >
            {season}
          </button>
        );
      })}
      <button
        type="button"
        className={`category-chip${isOther ? " is-active" : ""}`}
        aria-pressed={isOther}
        onClick={() => onChange([])}
      >
        {SEASON_OTHER}
      </button>
    </div>
  );
}
