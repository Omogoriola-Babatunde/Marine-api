export const calculatePremium = (classType, cargoValue) => {
    let rate = 0.005;

    if (classType === "A") rate = 0.1;
    if (classType === "B") rate = 0.007;
    if (classType === "C") rate = 0.005;

    return cargoValue * rate;
}