(function () {
  window.BinanceAnalyzer = window.BinanceAnalyzer || {};

  const rules = window.BinanceAnalyzer.AnalysisRules;
  const { calculateEMA } = window.BinanceAnalyzer.EMAIndicator;
  const { calculateRSI } = window.BinanceAnalyzer.RSIIndicator;
  const {
    getClosedCandles,
    getLastClosedCandle,
    calculateAverageVolume,
    calculateVolumeDeltaPercent,
  } = window.BinanceAnalyzer.VolumeIndicator;
  const { detectSupportAndResistance } = window.BinanceAnalyzer.LevelsIndicator;
  const { formatPrice, formatPercent } = window.BinanceAnalyzer.Format;

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

  function calculateDistancePercent(currentPrice, level) {
    if (!level) {
      return null;
    }

    return ((level - currentPrice) / currentPrice) * 100;
  }

  function determineTrend(currentPrice, indicators) {
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

    let bullishScore = 0;
    let bearishScore = 0;

    if (conditions.emaBullStack) {
      bullishScore += rules.trendWeights.emaStack;
    }
    if (conditions.emaBearStack) {
      bearishScore += rules.trendWeights.emaStack;
    }
    if (conditions.priceAboveEma21) {
      bullishScore += rules.trendWeights.priceVsEma21;
    }
    if (conditions.priceBelowEma21) {
      bearishScore += rules.trendWeights.priceVsEma21;
    }
    if (conditions.rsiBullishZone) {
      bullishScore += rules.trendWeights.rsiImpulse;
    } else if (conditions.rsiOverbought) {
      bullishScore += rules.trendWeights.rsiExtreme;
    }
    if (conditions.rsiBearishZone) {
      bearishScore += rules.trendWeights.rsiImpulse;
    } else if (conditions.rsiOversold) {
      bearishScore += rules.trendWeights.rsiExtreme;
    }

    const trend =
      conditions.emaBullStack &&
      bullishScore >= rules.trendWeights.minimumDirectionalScore &&
      bullishScore >= bearishScore + rules.trendWeights.minimumDirectionalEdge
        ? "ALCISTA"
        : conditions.emaBearStack &&
            bearishScore >= rules.trendWeights.minimumDirectionalScore &&
            bearishScore >= bullishScore + rules.trendWeights.minimumDirectionalEdge
          ? "BAJISTA"
          : "NEUTRAL";

    return {
      trend,
      conditions,
      rsiStateLabel: describeRsiState(currentRsi),
      bullishScore,
      bearishScore,
    };
  }

  function determineSetup(trend, indicators, conditions) {
    const setupReasons = [];
    const resistanceDistancePct = indicators.resistanceDistancePct;
    const supportDistancePct = indicators.supportDistancePct;
    const volumeOkay = indicators.volumeDeltaPercent >= rules.setupThresholds.minVolumeDeltaPct;
    const breakoutVolume =
      indicators.volumeDeltaPercent >= rules.setupThresholds.breakoutVolumeDeltaPct;
    const resistanceNear =
      resistanceDistancePct !== null &&
      resistanceDistancePct <= rules.setupThresholds.nearResistancePct;
    const supportNear =
      supportDistancePct !== null &&
      Math.abs(supportDistancePct) <= rules.setupThresholds.nearSupportPct;
    const enoughRoomLong =
      resistanceDistancePct === null ||
      resistanceDistancePct >= rules.setupThresholds.minimumRoomLongPct;
    const enoughRoomShort =
      supportDistancePct === null ||
      Math.abs(supportDistancePct) >= rules.setupThresholds.minimumRoomShortPct;

    if (trend === "ALCISTA") {
      if (!volumeOkay) {
        setupReasons.push("volumen bajo");
      }
      if (resistanceNear || !enoughRoomLong) {
        setupReasons.push("resistencia cercana");
      }
      if (conditions.rsiOverbought) {
        setupReasons.push("RSI en sobrecompra");
      } else if (!conditions.rsiBullishZone) {
        setupReasons.push("RSI sin impulso alcista claro");
      }

      const breakoutConfirmed = resistanceDistancePct === null && breakoutVolume;
      const possibleLong =
        !conditions.rsiOverbought &&
        volumeOkay &&
        (conditions.rsiBullishZone || breakoutConfirmed) &&
        (enoughRoomLong || breakoutConfirmed);

      return [
        possibleLong ? "POSIBLE LONG" : "ESPERAR",
        setupReasons,
      ];
    }

    if (trend === "BAJISTA") {
      if (!volumeOkay) {
        setupReasons.push("volumen bajo");
      }
      if (supportNear || !enoughRoomShort) {
        setupReasons.push("soporte cercano");
      }
      if (conditions.rsiOversold) {
        setupReasons.push("RSI en sobreventa");
      } else if (!conditions.rsiBearishZone) {
        setupReasons.push("RSI sin impulso bajista claro");
      }

      const breakdownConfirmed = supportDistancePct === null && breakoutVolume;
      const possibleShort =
        !conditions.rsiOversold &&
        volumeOkay &&
        (conditions.rsiBearishZone || breakdownConfirmed) &&
        (enoughRoomShort || breakdownConfirmed);

      return [
        possibleShort ? "POSIBLE SHORT" : "ESPERAR",
        setupReasons,
      ];
    }

    if (!conditions.emaBullStack && !conditions.emaBearStack) {
      setupReasons.push("estructura de medias contradictoria");
    }
    if (!conditions.rsiBullishZone && !conditions.rsiBearishZone) {
      setupReasons.push("RSI sin impulso claro");
    }
    if (!volumeOkay) {
      setupReasons.push("volumen bajo");
    }
    return ["ESPERAR", setupReasons];
  }

  function generateExplanation(trend, setup, indicators, conditions, setupReasons) {
    const resistanceText =
      indicators.resistanceDistancePct !== null
        ? `La resistencia está a ${formatPercent(indicators.resistanceDistancePct)} del precio actual.`
        : "No aparece una resistencia inmediata por encima del precio.";
    const supportText =
      indicators.supportDistancePct !== null
        ? `El soporte está a ${formatPercent(indicators.supportDistancePct)} del precio actual.`
        : "No aparece un soporte inmediato por debajo del precio.";

    if (trend === "ALCISTA" && setup === "POSIBLE LONG") {
      return [
        "Tendencia alcista.",
        "El precio se mantiene sobre EMA21, EMA50 y EMA180 y el RSI conserva impulso alcista.",
        `El volumen de la última vela cerrada está ${formatPercent(indicators.volumeDeltaPercent)} vs promedio 10 velas.`,
        "SETUP: POSIBLE LONG.",
      ].join(" ");
    }

    if (trend === "ALCISTA") {
      const reasonText = setupReasons.length
        ? `Sin embargo, ${setupReasons.join(" y ")}.`
        : "Todavía falta confirmación para una entrada limpia.";
      return [
        "Tendencia alcista.",
        "La estructura de medias sigue favorable y el RSI mantiene sesgo positivo.",
        reasonText,
        `${resistanceText} SETUP: ESPERAR.`,
      ].join(" ");
    }

    if (trend === "BAJISTA" && setup === "POSIBLE SHORT") {
      return [
        "Tendencia bajista confirmada por la estructura de medias y el RSI.",
        `El volumen de la última vela cerrada está ${formatPercent(indicators.volumeDeltaPercent)} vs promedio 10 velas.`,
        `${supportText} SETUP: POSIBLE SHORT.`,
      ].join(" ");
    }

    if (trend === "BAJISTA") {
      const reasonText = setupReasons.length
        ? `Sin embargo, ${setupReasons.join(" y ")}.`
        : "Todavía falta confirmación para una entrada SHORT clara.";
      return [
        "Tendencia bajista.",
        "La presión sigue bajista por debajo de EMA21, EMA50 y EMA180.",
        reasonText,
        `${supportText} SETUP: ESPERAR.`,
      ].join(" ");
    }

    return [
      "Tendencia neutral.",
      "Las señales son contradictorias entre precio, medias y RSI.",
      setupReasons.length ? `Además, ${setupReasons.join(" y ")}.` : "No existe ventaja estadística clara.",
      "SETUP: ESPERAR.",
    ].join(" ");
  }

  function buildSymbolAnalysis(symbol, timeframe, candles, currentPrice) {
    const closedCandles = getClosedCandles(candles);
    const closes = closedCandles.map((candle) => candle.close);
    const ema21Series = calculateEMA(closes, rules.emaPeriods.fast);
    const ema50Series = calculateEMA(closes, rules.emaPeriods.medium);
    const ema180Series = calculateEMA(closes, rules.emaPeriods.slow);
    const rsi14Series = calculateRSI(closes, rules.rsiPeriod);
    const lastClosedCandle = getLastClosedCandle(candles);
    const averageVolume10 = calculateAverageVolume(candles, rules.volumeAveragePeriod);
    const lastClosedVolume = lastClosedCandle ? lastClosedCandle.volume : 0;
    const volumeDeltaPercent = calculateVolumeDeltaPercent(lastClosedVolume, averageVolume10);
    const supportResistance = detectSupportAndResistance(
      closedCandles,
      currentPrice,
      rules.levelLookback,
      rules.swingWindow,
    );

    const indicators = {
      ema21: getLatestValue(ema21Series),
      ema50: getLatestValue(ema50Series),
      ema180: getLatestValue(ema180Series),
      rsi14: getLatestValue(rsi14Series),
      currentVolume: lastClosedVolume,
      averageVolume10,
      volumeDeltaPercent,
      support: supportResistance.support,
      resistance: supportResistance.resistance,
      supportDistancePct: calculateDistancePercent(currentPrice, supportResistance.support),
      resistanceDistancePct: calculateDistancePercent(currentPrice, supportResistance.resistance),
      volumeAboveAverage: lastClosedVolume > averageVolume10,
      lastClosedCandleTime: lastClosedCandle ? lastClosedCandle.closeTime : null,
    };

    const { trend, conditions, rsiStateLabel } = determineTrend(currentPrice, indicators);
    const [setup, setupReasons] = determineSetup(trend, indicators, conditions);

    return {
      symbol,
      timeframe,
      currentPrice,
      candles: closedCandles,
      ema21Series,
      ema50Series,
      ema180Series,
      rsi14Series,
      indicators,
      trend,
      setup,
      rsiStateLabel,
      conditions,
      setupReasons,
      explanation: generateExplanation(trend, setup, indicators, conditions, setupReasons),
      lastUpdated: Date.now(),
    };
  }

  window.BinanceAnalyzer.AnalysisEngine = {
    buildSymbolAnalysis,
    determineTrend,
    determineSetup,
    generateExplanation,
  };
})();
