import { describe, expect, it } from "vitest";
import { fillSeries, parseRangeKey, resolveRange } from "./range";

describe("parseRangeKey", () => {
  it("falls back to 30d for unknown values", () => {
    expect(parseRangeKey("7d")).toBe("7d");
    expect(parseRangeKey("nonsense")).toBe("30d");
    expect(parseRangeKey(undefined)).toBe("30d");
  });
});

describe("resolveRange", () => {
  const now = new Date("2026-11-10T12:00:00Z");

  it("builds an equally long previous period", () => {
    const r = resolveRange("7d", now);
    expect(r.prev).not.toBeNull();
    expect(r.prev!.to.getTime()).toBe(r.from.getTime());
    expect(r.from.getTime() - r.prev!.from.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("has no previous period for all time", () => {
    expect(resolveRange("all", now).prev).toBeNull();
  });
});

describe("fillSeries", () => {
  it("fills missing days with zeros", () => {
    const range = resolveRange("7d");
    const today = new Date().toISOString().slice(0, 10);
    const out = fillSeries([{ date: today, views: 5 }], ["views"], range);
    expect(out.length).toBeGreaterThanOrEqual(7);
    expect(out.find((p) => p.date === today)?.views).toBe(5);
    expect(out.filter((p) => p.views === 0).length).toBe(out.length - 1);
  });

  it("returns nothing for empty all-time data", () => {
    expect(fillSeries([], ["views"], resolveRange("all"))).toEqual([]);
  });
});
