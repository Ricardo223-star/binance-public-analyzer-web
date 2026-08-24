(function () {
  window.BinanceAnalyzer = window.BinanceAnalyzer || {};

  window.BinanceAnalyzer.AnalysisRules = {
    emaPeriods: {
      fast: 21,
      medium: 50,
      slow: 180,
    },
    rsiPeriod: 14,
    volumeAveragePeriod: 10,
    candlesLimit: 220,
    chartVisibleCandles: 60,
    levelLookback: 80,
    swingWindow: 2,
    refreshMs: {
      home: 5000,
      analysis: 15000,
    },
    trendWeights: {
      emaStack: 3,
      priceVsEma21: 1.5,
      rsiImpulse: 1.5,
      rsiExtreme: 1,
      minimumDirectionalEdge: 1.5,
      minimumDirectionalScore: 4,
    },
    setupThresholds: {
      minVolumeDeltaPct: 0,
      breakoutVolumeDeltaPct: 12,
      nearResistancePct: 1.2,
      nearSupportPct: 1.2,
      minimumRoomLongPct: 1.4,
      minimumRoomShortPct: 1.4,
      longRsiCeiling: 70,
      shortRsiFloor: 30,
    },
    rsiBands: {
      overbought: 70,
      bullishMin: 55,
      bullishMax: 70,
      neutralMin: 45,
      neutralMax: 55,
      bearishMin: 30,
      bearishMax: 45,
      oversold: 30,
    },
    timeframeLabels: {
      "15m": "15m",
      "1h": "1h",
      "4h": "4h",
      "1d": "1d",
    },
  };
})();
