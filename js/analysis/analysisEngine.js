(function () {
  window.BinanceAnalyzer = window.BinanceAnalyzer || {};

  const rules = window.BinanceAnalyzer.AnalysisRules;
  const { calculateEMA } = window.BinanceAnalyzer.EMAIndicator;
  const { calculateRSI } = window.BinanceAnalyzer.RSIIndicator;
  const { calculateAverageVolume } = window.BinanceAnalyzer.VolumeIndicator;
  const { detectSupportAndResistance } = window.BinanceAnalyzer.LevelsIndicator;
  const { formatPrice } = window.BinanceAnalyzer.Format;

  function getLatestValue(series) {
    for (let index = series.length - 1; index >= 0; index -= 1) {
      if (series[index] !== null) {
        return series[index];
      }
    }
    return 0;
  }

  function describeRsiState(rsi) {
    if (rsi > rules.rsiBands.overbought) {
      return "Sobrecompra";
    }
    if (rsi >= rules.rsiBands.bullishMin && rsi <= rules.rsiBands.bullishMax) {
      return "Impulso alcista";
    }
    if (rsi >= rules.rsiBands.neutralMin && rsi <= rules.rsiBands.neutralMax) {
      return "Neutral";
    }
    if (rsi >= rules.rsiBands.bearishMin && rsi <= rules.rsiBands.bearishMax) {
      return "Impulso bajista";
    }
    return "Sobreventa";
  }

  function determineBias(currentPrice, indicators) {
    const currentRsi = indicators.rsi14;
    const conditions = {
      priceAboveEma21: currentPrice > indicators.ema21,
      priceBelowEma21: currentPrice < indicators.ema21,
      emaBullStack:
        indicators.ema21 > indicators.ema50 && indicators.ema50 > indicators.ema180,
      emaBearStack:
        indicators.ema21 < indicators.ema50 && indicators.ema50 < indicators.ema180,
      volumeAboveAverage: indicators.volumeAboveAverage,
      rsiBullishZone:
        currentRsi >= rules.rsiBands.bullishMin && currentRsi <= rules.rsiBands.bullishMax,
      rsiBearishZone:
        currentRsi >= rules.rsiBands.bearishMin && currentRsi <= rules.rsiBands.bearishMax,
      rsiOverbought: currentRsi > rules.rsiBands.overbought,
      rsiOversold: currentRsi < rules.rsiBands.oversold,
    };

    const bullishSetup =
      conditions.priceAboveEma21 &&
      conditions.emaBullStack &&
      conditions.rsiBullishZone &&
      conditions.volumeAboveAverage;

    const bearishSetup =
      conditions.priceBelowEma21 &&
      conditions.emaBearStack &&
      conditions.rsiBearishZone &&
      conditions.volumeAboveAverage;

    const bias = bullishSetup ? "ALCISTA" : bearishSetup ? "BAJISTA" : "NEUTRAL";

    return {
      bias,
      conditions,
      rsiStateLabel: describeRsiState(currentRsi),
    };
  }

  function generateExplanation(bias, currentPrice, indicators, conditions) {
    const supportText = indicators.support
      ? `Hay soporte cercano en ${formatPrice(indicators.support)} USDT; conviene vigilar si sostiene.`
      : "No aparece un soporte cercano claro en esta muestra.";

    const resistanceText = indicators.resistance
      ? `Hay resistencia cercana en ${formatPrice(indicators.resistance)} USDT; conviene esperar confirmación.`
      : "No aparece una resistencia cercana clara en esta muestra.";

    if (bias === "ALCISTA") {
      return [
        "Sesgo alcista moderado.",
        "El precio está sobre EMA21 y la estructura EMA21 > EMA50 > EMA180 sigue ordenada.",
        "El RSI se mantiene en impulso alcista y el volumen está por encima del promedio.",
        resistanceText,
      ].join(" ");
    }

    if (bias === "BAJISTA") {
      return [
        "Sesgo bajista moderado.",
        "El precio está por debajo de EMA21 y la estructura EMA21 < EMA50 < EMA180 sigue ordenada.",
        "El RSI muestra impulso bajista y el volumen acompaña la caída.",
        supportText,
      ].join(" ");
    }

    const missingSignals = [];
    if (!conditions.priceAboveEma21 && !conditions.priceBelowEma21) {
      missingSignals.push("el precio no define relación clara con EMA21");
    }
    if (!conditions.emaBullStack && !conditions.emaBearStack) {
      missingSignals.push("las EMAs no están alineadas");
    }
    if (!conditions.volumeAboveAverage) {
      missingSignals.push("el volumen está bajo");
    }
    if (!conditions.rsiBullishZone && !conditions.rsiBearishZone) {
      missingSignals.push("el RSI está fuera de zona de impulso");
    }

    return [
      "NO HAY SETUP CLARO. ESPERAR.",
      `Las señales son contradictorias: ${missingSignals.join(", ")}.`,
      currentPrice > indicators.ema21 && currentPrice < indicators.ema50
        ? "El precio quedó entre EMA21 y EMA50."
        : "La estructura actual no confirma un solo sesgo.",
      "No conviene forzar una lectura LONG o SHORT.",
    ].join(" ");
  }

  function buildSymbolAnalysis(symbol, timeframe, candles, currentPrice) {
    const closes = candles.map((candle) => candle.close);
    const ema21Series = calculateEMA(closes, rules.emaPeriods.fast);
    const ema50Series = calculateEMA(closes, rules.emaPeriods.medium);
    const ema180Series = calculateEMA(closes, rules.emaPeriods.slow);
    const rsi14Series = calculateRSI(closes, rules.rsiPeriod);
    const averageVolume10 = calculateAverageVolume(candles, rules.volumeAveragePeriod);
    const supportResistance = detectSupportAndResistance(
      candles,
      currentPrice,
      rules.levelLookback,
      rules.swingWindow,
    );

    const indicators = {
      ema21: getLatestValue(ema21Series),
      ema50: getLatestValue(ema50Series),
      ema180: getLatestValue(ema180Series),
      rsi14: getLatestValue(rsi14Series),
      currentVolume: candles[candles.length - 1] ? candles[candles.length - 1].volume : 0,
      averageVolume10,
      support: supportResistance.support,
      resistance: supportResistance.resistance,
      volumeAboveAverage:
        (candles[candles.length - 1] ? candles[candles.length - 1].volume : 0) > averageVolume10,
    };

    const { bias, conditions, rsiStateLabel } = determineBias(currentPrice, indicators);

    return {
      symbol,
      timeframe,
      currentPrice,
      candles,
      ema21Series,
      ema50Series,
      ema180Series,
      rsi14Series,
      indicators,
      bias,
      rsiStateLabel,
      conditions,
      explanation: generateExplanation(bias, currentPrice, indicators, conditions),
      lastUpdated: Date.now(),
    };
  }

  window.BinanceAnalyzer.AnalysisEngine = {
    buildSymbolAnalysis,
    determineBias,
    generateExplanation,
  };
})();
