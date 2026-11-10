import { describe, expect, it } from "vitest";
import {
  canDelete,
  canEdit,
  canPublish,
  canUpload,
  getEffectiveRole,
  isGuest,
} from "./auth-utils-shared";

const session = (role: string, isAnonymous = false) => ({ user: { id: "u1", role, isAnonymous } });

describe("getEffectiveRole", () => {
  it("treats missing and anonymous sessions as guest", () => {
    expect(getEffectiveRole(null)).toBe("guest");
    expect(getEffectiveRole({ user: null })).toBe("guest");
    expect(getEffectiveRole(session("owner", true))).toBe("guest");
    expect(isGuest(null)).toBe(true);
  });

  it("returns the DB role for real users and defaults to member", () => {
    expect(getEffectiveRole(session("admin"))).toBe("admin");
    expect(getEffectiveRole(session("owner"))).toBe("owner");
    expect(getEffectiveRole({ user: { id: "u1" } })).toBe("member");
  });
});

describe("permissions", () => {
  it("only non-guests can upload", () => {
    expect(canUpload("guest")).toBe(false);
    expect(canUpload("member")).toBe(true);
  });

  it("members can edit/delete only their own content", () => {
    for (const fn of [canEdit, canDelete]) {
      expect(fn("member", true)).toBe(true);
      expect(fn("member", false)).toBe(false);
      expect(fn("guest", true)).toBe(false);
      expect(fn("admin", false)).toBe(true);
      expect(fn("owner", false)).toBe(true);
    }
  });

  it("only the owner can publish", () => {
    expect(canPublish("owner")).toBe(true);
    expect(canPublish("admin")).toBe(false);
  });
});
