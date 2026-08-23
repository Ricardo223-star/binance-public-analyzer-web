(function () {
  window.BinanceAnalyzer = window.BinanceAnalyzer || {};

  function calculateAverageVolume(candles, period) {
    if (!candles.length) {
      return 0;
    }

    const completedCandles = candles.length > 1 ? candles.slice(0, -1) : candles;
    const reference = completedCandles.slice(-period);

    if (!reference.length) {
      return candles[candles.length - 1].volume;
    }

    const total = reference.reduce((sum, candle) => sum + candle.volume, 0);
    return total / reference.length;
  }

  window.BinanceAnalyzer.VolumeIndicator = {
    calculateAverageVolume,
  };
})();
