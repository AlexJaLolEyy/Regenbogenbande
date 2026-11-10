import { describe, expect, it } from "vitest";
import { assertAllowedUrl, readLimited } from "./safe-fetch";

describe("assertAllowedUrl", () => {
  it("accepts medal.tv and its subdomains over https", () => {
    expect(assertAllowedUrl("https://medal.tv/clip/abc").hostname).toBe("medal.tv");
    expect(assertAllowedUrl("https://cdn.medal.tv/x.mp4").hostname).toBe("cdn.medal.tv");
  });

  it("rejects other hosts, including look-alikes", () => {
    expect(() => assertAllowedUrl("https://evil.com/")).toThrow();
    expect(() => assertAllowedUrl("https://medal.tv.evil.com/")).toThrow();
    expect(() => assertAllowedUrl("https://notmedal.tv/")).toThrow();
  });

  it("rejects non-https, credentials, internal addresses and garbage", () => {
    expect(() => assertAllowedUrl("http://medal.tv/")).toThrow();
    expect(() => assertAllowedUrl("https://user:pw@medal.tv/")).toThrow();
    expect(() => assertAllowedUrl("https://169.254.169.254/")).toThrow();
    expect(() => assertAllowedUrl("https://localhost/")).toThrow();
    expect(() => assertAllowedUrl("not a url")).toThrow();
  });
});

describe("readLimited", () => {
  it("returns small bodies", async () => {
    const buf = await readLimited(new Response("hello"), 100);
    expect(buf.toString()).toBe("hello");
  });

  it("aborts bodies over the limit", async () => {
    await expect(readLimited(new Response("x".repeat(50)), 10)).rejects.toThrow("too large");
  });
});
