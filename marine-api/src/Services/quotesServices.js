export const calculatePremium = (classType, cargoValue) => {
  let rate ;

  if (classType === "A") {rate = user.classARate;}
  else {rate = user.classBRate;};

  return cargoValue * rate;
};
