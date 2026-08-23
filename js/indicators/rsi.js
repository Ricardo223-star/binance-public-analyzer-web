(function () {
  window.BinanceAnalyzer = window.BinanceAnalyzer || {};

  function calculateRSI(values, period) {
    const result = new Array(values.length).fill(null);
    if (values.length <= period) {
      return result;
    }

    let gains = 0;
    let losses = 0;

    for (let index = 1; index <= period; index += 1) {
      const delta = values[index] - values[index - 1];
      if (delta >= 0) {
        gains += delta;
      } else {
        losses += Math.abs(delta);
      }
    }

    let averageGain = gains / period;
    let averageLoss = losses / period;

    result[period] = averageLoss === 0 ? 100 : 100 - 100 / (1 + averageGain / averageLoss);

    for (let index = period + 1; index < values.length; index += 1) {
      const delta = values[index] - values[index - 1];
      const gain = delta > 0 ? delta : 0;
      const loss = delta < 0 ? Math.abs(delta) : 0;

      averageGain = (averageGain * (period - 1) + gain) / period;
      averageLoss = (averageLoss * (period - 1) + loss) / period;

      if (averageLoss === 0) {
        result[index] = 100;
        continue;
      }

      const relativeStrength = averageGain / averageLoss;
      result[index] = 100 - 100 / (1 + relativeStrength);
    }

    return result;
  }

  window.BinanceAnalyzer.RSIIndicator = {
    calculateRSI,
  };
})();
