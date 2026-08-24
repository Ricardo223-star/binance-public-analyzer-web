(function () {
  window.BinanceAnalyzer = window.BinanceAnalyzer || {};

  function getClosedCandles(candles) {
    if (!candles.length) {
      return [];
    }

    return candles.length > 1 ? candles.slice(0, -1) : candles.slice();
  }

  function getLastClosedCandle(candles) {
    const closedCandles = getClosedCandles(candles);
    return closedCandles.length ? closedCandles[closedCandles.length - 1] : null;
  }

  function calculateAverageVolume(candles, period) {
    const closedCandles = getClosedCandles(candles);
    if (!closedCandles.length) {
      return 0;
    }

    const previousClosedCandles = closedCandles.slice(0, -1);
    const reference = previousClosedCandles.slice(-period);

    if (!reference.length) {
      return closedCandles[closedCandles.length - 1].volume;
    }

    const total = reference.reduce((sum, candle) => sum + candle.volume, 0);
    return total / reference.length;
  }

  function calculateVolumeDeltaPercent(lastClosedVolume, averageVolume) {
    if (!averageVolume) {
      return 0;
    }

    return ((lastClosedVolume - averageVolume) / averageVolume) * 100;
  }

  window.BinanceAnalyzer.VolumeIndicator = {
    getClosedCandles,
    getLastClosedCandle,
    calculateAverageVolume,
    calculateVolumeDeltaPercent,
  };
})();
