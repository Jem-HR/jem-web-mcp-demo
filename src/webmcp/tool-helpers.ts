import { errorResult, type CapabilityResult } from "../demo/capability-result";

export class ToolInputValidationError extends TypeError {
  constructor(toolName: string) {
    super(`${toolName} received invalid input.`);
    this.name = "ToolInputValidationError";
  }
}

function invalidInput(toolName: string): never {
  throw new ToolInputValidationError(toolName);
}

export function throwToolInputValidationError(toolName: string): never {
  return invalidInput(toolName);
}

export function assertClosedObject(
  input: unknown,
  allowedKeys: readonly string[],
  toolName: string,
): Record<string, unknown> {
  if (typeof input !== "object" || input === null) {
    return invalidInput(toolName);
  }

  let prototype: object | null;
  let keys: (string | symbol)[];

  try {
    prototype = Object.getPrototypeOf(input);
    keys = Reflect.ownKeys(input);
  } catch {
    return invalidInput(toolName);
  }

  if (prototype !== Object.prototype && prototype !== null) {
    return invalidInput(toolName);
  }

  const allowedKeySet = new Set(allowedKeys);
  try {
    for (const key of keys) {
      if (typeof key !== "string" || !allowedKeySet.has(key)) {
        return invalidInput(toolName);
      }

      const descriptor = Object.getOwnPropertyDescriptor(input, key);
      if (!descriptor?.enumerable) {
        return invalidInput(toolName);
      }
    }
  } catch {
    return invalidInput(toolName);
  }

  return input as Record<string, unknown>;
}

export function assertString(value: unknown, toolName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return invalidInput(toolName);
  }

  return value;
}

export function assertFiniteNumber(value: unknown, toolName: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return invalidInput(toolName);
  }

  return value;
}

export function assertBoolean(value: unknown, toolName: string): boolean {
  if (typeof value !== "boolean") {
    return invalidInput(toolName);
  }

  return value;
}

export function assertEnum<const T extends readonly string[]>(
  value: unknown,
  allowedValues: T,
  toolName: string,
): T[number] {
  if (!allowedValues.some((allowedValue) => allowedValue === value)) {
    return invalidInput(toolName);
  }

  return value as T[number];
}

export function safeToolExecute<T>(
  execute: () => CapabilityResult<T>,
): CapabilityResult<T>;
export function safeToolExecute<T>(
  execute: () => T,
): T | CapabilityResult<never>;
export function safeToolExecute<T>(
  execute: () => T,
): T | CapabilityResult<never> {
  try {
    return execute();
  } catch (error) {
    if (error instanceof ToolInputValidationError) {
      return errorResult(
        "INVALID_INPUT",
        "The tool input is invalid.",
        "Use the tool schema and provide only documented fields.",
      );
    }

    return errorResult(
      "STALE_STATE",
      "The demo could not complete that action.",
      "Refresh or reset the demo and try again.",
    );
  }
}
