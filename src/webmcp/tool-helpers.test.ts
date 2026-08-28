import { describe, expect, it } from "vitest";

import {
  assertBoolean,
  assertClosedObject,
  assertEnum,
  assertFiniteNumber,
  assertString,
  safeToolExecute,
} from "./tool-helpers";

describe("assertClosedObject", () => {
  it("accepts allowed own keys and rejects invalid shapes", () => {
    expect(
      assertClosedObject({ category: "all" }, ["category"], "test_tool"),
    ).toEqual({ category: "all" });

    for (const input of [null, [], true, 42, "value", { unexpected: true }]) {
      expect(() =>
        assertClosedObject(input, ["category"], "test_tool"),
      ).toThrow("test_tool received invalid input.");
    }
  });

  it("accepts null-prototype records and only own enumerable string keys", () => {
    const input = Object.create(null) as Record<string, unknown>;
    input.category = "all";

    expect(assertClosedObject(input, ["category"], "test_tool")).toBe(input);
  });

  it("rejects inherited allowed and unknown keys", () => {
    const inheritedAllowed = Object.create({ category: "all" }) as Record<
      string,
      unknown
    >;
    const inheritedUnknown = Object.create({ unexpected: true }) as Record<
      string,
      unknown
    >;

    expect(() =>
      assertClosedObject(inheritedAllowed, ["category"], "test_tool"),
    ).toThrow("test_tool received invalid input.");
    expect(() =>
      assertClosedObject(inheritedUnknown, ["category"], "test_tool"),
    ).toThrow("test_tool received invalid input.");
  });

  it("rejects objects with non-plain prototypes", () => {
    class Input {
      category = "all";
    }

    const invalidInputs = [
      new Input(),
      new Date(),
      new Map(),
      new Set(),
      Object.create({}),
      () => undefined,
    ];

    for (const input of invalidInputs) {
      expect(() =>
        assertClosedObject(input, ["category"], "test_tool"),
      ).toThrow("test_tool received invalid input.");
    }
  });

  it("does not echo rejected values in its fixed error", () => {
    const secret = "sk-live-secret-value";

    expect(() => assertClosedObject({ secret }, [], "test_tool")).toThrow(
      new TypeError("test_tool received invalid input."),
    );
    expect(() => assertClosedObject({ secret }, [], "test_tool")).not.toThrow(
      secret,
    );
  });
});

describe("field assertions", () => {
  it("accepts non-empty strings without coercion", () => {
    const value = "  kept whitespace around value  ";

    expect(assertString(value, "test_tool")).toBe(value);
  });

  it("rejects empty and whitespace-only strings", () => {
    for (const value of ["", " ", "\n\t"]) {
      expect(() => assertString(value, "test_tool")).toThrow(
        "test_tool received invalid input.",
      );
    }
  });

  it("accepts finite numbers without coercion", () => {
    expect(assertFiniteNumber(-3.5, "test_tool")).toBe(-3.5);
  });

  it("rejects non-numbers and non-finite numbers", () => {
    for (const value of ["3", Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => assertFiniteNumber(value, "test_tool")).toThrow(
        "test_tool received invalid input.",
      );
    }
  });

  it("accepts only literal booleans", () => {
    expect(assertBoolean(false, "test_tool")).toBe(false);

    for (const value of ["false", 0, null]) {
      expect(() => assertBoolean(value, "test_tool")).toThrow(
        "test_tool received invalid input.",
      );
    }
  });

  it("accepts only exact enum members", () => {
    const allowed = ["all", "open"] as const;

    expect(assertEnum("open", allowed, "test_tool")).toBe("open");
    for (const value of ["OPEN", "closed", "all "]) {
      expect(() => assertEnum(value, allowed, "test_tool")).toThrow(
        "test_tool received invalid input.",
      );
    }
  });
});

describe("safeToolExecute", () => {
  it("returns capability results unchanged when execution succeeds", () => {
    const result = {
      ok: true as const,
      status: "read" as const,
      summary: "done",
      data: { count: 1 },
    };

    expect(safeToolExecute(() => result)).toBe(result);
  });

  it("contains unexpected failures behind a stable result", () => {
    const result = safeToolExecute(() => {
      throw new Error("private internal detail: sk-live-secret-value");
    });

    expect(result).toEqual({
      ok: false,
      status: "error",
      error: {
        code: "STALE_STATE",
        message: "The demo could not complete that action.",
        recovery: "Refresh or reset the demo and try again.",
      },
    });
    expect(JSON.stringify(result)).not.toContain("private internal detail");
    expect(JSON.stringify(result)).not.toContain("sk-live-secret-value");
  });
});
