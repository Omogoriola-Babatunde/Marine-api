const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value) => typeof value === "string" && UUID_RE.test(value);

export const validateQuoteInput = (data) => {
  const errors = [];

  if (!data.classType || typeof data.classType !== "string") {
    errors.push("classType is required and must be a string");
  } else if (!["A", "B", "C"].includes(data.classType)) {
    errors.push("classType must be A, B, or C");
  }

  if (!data.cargoType || typeof data.cargoType !== "string" || data.cargoType.length > 100) {
    errors.push("cargoType is required, must be a string, and max 100 characters");
  }

  if (!Number.isFinite(data.cargoValue) || data.cargoValue <= 0) {
    errors.push("cargoValue is required and must be a positive finite number");
  }

  if (!data.origin || typeof data.origin !== "string" || data.origin.length > 100) {
    errors.push("origin is required, must be a string, and max 100 characters");
  }

  if (!data.destination || typeof data.destination !== "string" || data.destination.length > 100) {
    errors.push("destination is required, must be a string, and max 100 characters");
  }

  return { valid: errors.length === 0, errors };
};

export const validatePolicyInput = (data) => {
  const errors = [];

  if (!isUuid(data.quoteId)) {
    errors.push("quoteId is required and must be a valid UUID");
  }

  if (
    !data.customername ||
    typeof data.customername !== "string" ||
    data.customername.length > 100
  ) {
    errors.push("customername is required, must be a string, and max 100 characters");
  }

  return { valid: errors.length === 0, errors };
};

const HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

export const escapeHtml = (text) =>
  String(text ?? "").replace(/[&<>"']/g, (m) => HTML_ESCAPE_MAP[m]);
