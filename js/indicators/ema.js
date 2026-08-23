(function () {
  window.BinanceAnalyzer = window.BinanceAnalyzer || {};

  function calculateEMA(values, period) {
    const result = new Array(values.length).fill(null);
    if (values.length < period) {
      return result;
    }

    const seedAverage =
      values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
    const multiplier = 2 / (period + 1);

    result[period - 1] = seedAverage;

    let previous = seedAverage;
    for (let index = period; index < values.length; index += 1) {
      previous = (values[index] - previous) * multiplier + previous;
      result[index] = previous;
    }

    return result;
  }

  window.BinanceAnalyzer.EMAIndicator = {
    calculateEMA,
  };
})();
