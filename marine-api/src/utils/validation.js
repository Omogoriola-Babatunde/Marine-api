const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value) => typeof value === "string" && UUID_RE.test(value);

export const validateQuoteInput = (data) => {
  const errors = [];

  if (!data.classType || typeof data.classType !== "string") {
    errors.push("classType is required and must be a string");
  } else if (!["A", "B"].includes(data.classType)) {
    errors.push("classType must be A or B");
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

const ALLOWED_MODES = ["SEA", "AIR"];
const ALLOWED_CURRENCIES = ["USD", "GBP", "JPY", "EUR"];

const isIsoDate = (v) => {
  if (typeof v !== "string" || !v) return false;
  const d = new Date(v);
  return Number.isFinite(d.getTime());
};

export const validatePolicyInput = (data) => {
  const errors = [];

  if (!isUuid(data.quoteId)) {
    errors.push("quoteId is required and must be a valid UUID");
  }

  if (
    !data.customerName ||
    typeof data.customerName !== "string" ||
    data.customerName.length > 100
  ) {
    errors.push("customerName is required (max 100 characters)");
  }

  if (
    !data.proformaInvoice ||
    typeof data.proformaInvoice !== "string" ||
    data.proformaInvoice.length > 200
  ) {
    errors.push("proformaInvoice is required (max 200 characters)");
  }

  if (
    !data.mode ||
    typeof data.mode !== "string" ||
    !ALLOWED_MODES.includes(data.mode.toUpperCase())
  ) {
    errors.push(`mode is required and must be one of ${ALLOWED_MODES.join(", ")}`);
  }

  if (
    !data.currency ||
    typeof data.currency !== "string" ||
    !ALLOWED_CURRENCIES.includes(data.currency.toUpperCase())
  ) {
    errors.push(`currency is required and must be one of ${ALLOWED_CURRENCIES.join(", ")}`);
  }

  if (!Number.isFinite(data.invoiceValue) || data.invoiceValue <= 0) {
    errors.push("invoiceValue is required and must be a positive number");
  }

  if (!Number.isFinite(data.exchangeRate) || data.exchangeRate <= 0) {
    errors.push("exchangeRate is required and must be a positive number");
  }

  if (!isIsoDate(data.startDate)) {
    errors.push("startDate is required and must be a valid date");
  }

  if (!isIsoDate(data.endDate)) {
    errors.push("endDate is required and must be a valid date");
  }

  if (isIsoDate(data.startDate) && isIsoDate(data.endDate)) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) {
      errors.push("endDate must be on or after startDate");
    }
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
