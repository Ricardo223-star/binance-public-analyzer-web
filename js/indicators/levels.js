(function () {
  window.BinanceAnalyzer = window.BinanceAnalyzer || {};

  function isLocalLow(candles, index, swingWindow) {
    const currentLow = candles[index].low;
    for (let offset = 1; offset <= swingWindow; offset += 1) {
      if (candles[index - offset].low < currentLow || candles[index + offset].low < currentLow) {
        return false;
      }
    }
    return true;
  }

  function isLocalHigh(candles, index, swingWindow) {
    const currentHigh = candles[index].high;
    for (let offset = 1; offset <= swingWindow; offset += 1) {
      if (
        candles[index - offset].high > currentHigh ||
        candles[index + offset].high > currentHigh
      ) {
        return false;
      }
    }
    return true;
  }

  function detectSupportAndResistance(candles, currentPrice, lookback, swingWindow) {
    const windowCandles = candles.slice(-lookback);
    if (!windowCandles.length) {
      return { support: null, resistance: null };
    }

    const supportCandidates = [];
    const resistanceCandidates = [];

    for (
      let index = swingWindow;
      index < windowCandles.length - swingWindow;
      index += 1
    ) {
      if (isLocalLow(windowCandles, index, swingWindow)) {
        supportCandidates.push(windowCandles[index].low);
      }

      if (isLocalHigh(windowCandles, index, swingWindow)) {
        resistanceCandidates.push(windowCandles[index].high);
      }
    }

    const lowerSupports = supportCandidates.filter((level) => level < currentPrice);
    const higherResistances = resistanceCandidates.filter((level) => level > currentPrice);

    const support =
      lowerSupports.length > 0
        ? Math.max(...lowerSupports)
        : Math.min(...windowCandles.map((candle) => candle.low));
    const resistance =
      higherResistances.length > 0
        ? Math.min(...higherResistances)
        : Math.max(...windowCandles.map((candle) => candle.high));

    return {
      support: support < currentPrice ? support : null,
      resistance: resistance > currentPrice ? resistance : null,
    };
  }

  window.BinanceAnalyzer.LevelsIndicator = {
    detectSupportAndResistance,
  };
})();
