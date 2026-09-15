export const calculateMarkupPrice = (cost: number, markupPercent: number): number => {
  if (cost <= 0) return 0;
  const rawPrice = cost * (1 + (markupPercent / 100));
  return Math.round(rawPrice / 1000) * 1000;
};

export const calculateMarginPrice = (cost: number, targetMarginPercent: number): number => {
  if (cost <= 0 || targetMarginPercent >= 100) return 0;
  const rawPrice = cost / (1 - (targetMarginPercent / 100));
  return Math.round(rawPrice / 1000) * 1000;
};

export const calculateActualMargin = (cost: number, sellingPrice: number): number => {
  if (cost <= 0 || sellingPrice <= 0) return 0;
  return Number((((sellingPrice - cost) / sellingPrice) * 100).toFixed(2));
};

export const calculateActualMarkup = (cost: number, sellingPrice: number): number => {
  if (cost <= 0 || sellingPrice <= 0) return 0;
  return Number((((sellingPrice - cost) / cost) * 100).toFixed(2));
};

export const checkMinimumMargin = (cost: number, sellingPrice: number, minMarginThreshold = 15) => {
  const actualMargin = calculateActualMargin(cost, sellingPrice);
  return {
    actualMargin,
    isBelowMin: actualMargin < minMarginThreshold,
    minMarginThreshold
  };
};
