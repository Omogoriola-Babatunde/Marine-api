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
  
  if (!data.cargoValue || typeof data.cargoValue !== "number" || data.cargoValue <= 0) {
    errors.push("cargoValue is required, must be a positive number");
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
  
  if (!data.Quoteid || typeof data.Quoteid !== "string") {
    errors.push("Quoteid is required and must be a valid UUID");
  }
  
  if (!data.customername || typeof data.customername !== "string" || data.customername.length > 100) {
    errors.push("customername is required, must be a string, and max 100 characters");
  }
  
  return { valid: errors.length === 0, errors };
};

export const escapeHtml = (text) => {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};
