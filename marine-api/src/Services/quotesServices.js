export const calculatePremium = (classType, cargoValue, classARate, classBRate) => {
  const rate = classType === "A" ? classARate : classBRate;
  return cargoValue * rate;
};
