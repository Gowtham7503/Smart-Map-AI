const formatDuration = (minutes) => {
  if (minutes == null) {
    return "--";
  }

  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);

    if (!remainingHours) {
      return `${days} day${days === 1 ? "" : "s"}`;
    }

    return `${days} day${days === 1 ? "" : "s"} ${remainingHours} hr`;
  }

  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (!remainingMinutes) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
};

const formatDistance = (kilometers) => {
  if (kilometers == null) {
    return "--";
  }

  if (kilometers < 1) {
    return `${Math.round(kilometers * 1000)} m`;
  }

  return `${kilometers.toFixed(1)} km`;
};

const formatSafetyScore = (score) => {
  if (score == null) {
    return "--";
  }

  return `${score.toFixed(1)} / 6`;
};

const getSafetyLabel = (score) => {
  if (score == null) {
    return "Available when Safest Route is on";
  }

  if (score <= 2) {
    return "Safer road mix";
  }

  if (score <= 4) {
    return "Moderate road safety";
  }

  return "Lower safety preference";
};

const getTimeAwareSafetyLabel = (summary) => {
  if (!summary?.safetyContext) {
    return getSafetyLabel(summary?.safetyScore);
  }

  const { time_band: timeBand, evaluated_hour: evaluatedHour } = summary.safetyContext;
  const hourLabel =
    evaluatedHour == null ? "" : ` at ${String(evaluatedHour).padStart(2, "0")}:00`;

  if (timeBand === "late_night") {
    return `Late-night adjustment applied${hourLabel}`;
  }

  if (timeBand === "low_light") {
    return `Low-light adjustment applied${hourLabel}`;
  }

  return `Daytime routing estimate${hourLabel}`;
};

const getCrowdScoreMessage = (summary) => {
  const crowdScore = summary?.safetyContext?.crowd_score;
  const crowdBonus = summary?.safetyContext?.crowd_bonus;

  if (crowdScore == null || crowdBonus == null) {
    return "Nearby place density not available";
  }

  return `${crowdScore} nearby active places reduced the score by ${crowdBonus.toFixed(1)}`;
};

const getTrafficScoreMessage = (summary) => {
  const trafficPenalty = summary?.safetyContext?.traffic_penalty;
  const trafficCongestion = summary?.safetyContext?.traffic_congestion;
  const roadClosures = summary?.safetyContext?.road_closures;

  if (trafficPenalty == null) {
    return "Traffic signal not available";
  }

  if (trafficPenalty === 0 && !roadClosures) {
    return "Live traffic added no extra penalty";
  }

  const congestionPercent = Math.round((trafficCongestion || 0) * 100);
  const closureText =
    roadClosures > 0 ? `, ${roadClosures} closure${roadClosures === 1 ? "" : "s"}` : "";

  return `${congestionPercent}% congestion added ${trafficPenalty.toFixed(1)}${closureText}`;
};

const getLightingScoreMessage = (summary) => {
  const streetLightCount = summary?.safetyContext?.street_light_count;
  const mainRoadRatio = summary?.safetyContext?.main_road_ratio;
  const lightingBonus = summary?.safetyContext?.lighting_bonus;

  if (streetLightCount == null || lightingBonus == null) {
    return "Street-light signal not available";
  }

  const mainRoadPercent = Math.round((mainRoadRatio || 0) * 100);
  return `${streetLightCount} street lights and ${mainRoadPercent}% main-road coverage reduced the score by ${lightingBonus.toFixed(1)}`;
};

const getRouteSelectionMessage = (summary) => {
  const selection = summary?.routeSelection;

  if (!selection?.safestRouteEnabled) {
    return "Safest-route selection is off";
  }

  if (selection.safestRouteFallback) {
    return selection.safestRouteFallback;
  }

  if ((selection.alternativesReturned || 0) <= 1) {
    return "Only one route was returned, so there was nothing safer to switch to";
  }

  if (selection.selectedForSafety) {
    return `Selected the safest route from ${selection.alternativesReturned} returned alternatives`;
  }

  return selection.selectionReason || "Using returned route";
};

const MapBottomPanel = ({
  filters,
  mode,
  onModeChange,
  onResizeStart,
  panelHeight,
  place,
  routeLoading,
  routeSummaries,
  showSidebar,
}) => {
  if (!showSidebar || place) {
    return null;
  }

  const activeSummary = routeSummaries[mode] || null;

  return (
    <div
      className="bottom-panel"
      style={{ height: panelHeight }}
    >
      <div className="panel-resize-handle" onMouseDown={onResizeStart} />
      <div className="bottom-panel-content">
        <div className="vehicle-panel">
          <div
            className={`vehicle-btn ${mode === "car" ? "active" : ""}`}
            onClick={() => onModeChange("car")}
          >
            <svg
              className="car-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              width="24"
              height="24"
              fill="none"
            >
              <path
                d="M3 1L1.667 5H0V8H1V15H3V13H13V15H15V8H16V5H14.333L13 1H3Z"
                className="car-body"
              />
              <path
                d="M4.442 3H11.558L12.892 7H3.108L4.442 3Z"
                className="car-window"
              />
              <circle cx="4" cy="10" r="1" className="car-wheel" />
              <circle cx="12" cy="10" r="1" className="car-wheel" />
            </svg>
            <div className="vehicle-btn-copy">
              <span>Car</span>
              <small>{formatDuration(routeSummaries.car?.durationMinutes)}</small>
            </div>
          </div>

          <div
            className={`vehicle-btn ${mode === "bike" ? "active" : ""}`}
            onClick={() => onModeChange("bike")}
          >
            <svg width="22" height="22" viewBox="0 0 512 512" fill="currentColor">
              <path
                d="M417.975,226.338c-5.966,0-11.764,0.618-17.404,1.684l-33.048-100.841
                c-5.781-17.644-22.258-29.577-40.822-29.577h-45.506v24.414h45.506c8.038-0.008,15.147,5.155,17.636,12.768l6.028,18.433h-60.684
                c-31.084,0-54.424,15.542-54.424,15.542v45.358h135.064l7.064,21.54c-31.579,15.163-53.42,47.345-53.435,84.704
                c0.016,51.936,42.09,94.018,94.026,94.033c51.92-0.015,94.01-42.097,94.025-94.033
                C511.985,268.435,469.895,226.353,417.975,226.338zM461.456,363.844c-11.175,11.144-26.462,18.007-43.48,18.007
                c-17.034,0-32.29-6.862-43.466-18.007c-11.144-11.176-18.008-26.447-18.008-43.481c0-17.026,6.863-32.29,18.008-43.465
                c3.88-3.88,8.409-7.01,13.185-9.754l11.114,33.928c-4.962,4.931-8.037,11.748-8.037,19.29c0,15.032,12.18,27.22,27.204,27.22
                c15.024,0,27.204-12.188,27.204-27.22c0-13.633-10.062-24.809-23.14-26.787l-11.128-33.974c2.35-0.278,4.637-0.711,7.064-0.711
                c17.018,0,32.305,6.855,43.48,18.008c11.144,11.175,17.977,26.439,18.008,43.465
                C479.432,337.397,472.6,352.668,461.456,363.844z"
              />
              <path
                d="M94.01,226.338C42.074,226.353,0.016,268.435,0,320.363
                c0.016,51.936,42.074,94.018,94.01,94.033c51.936-0.015,94.01-42.097,94.026-94.033
                C188.02,268.435,145.946,226.353,94.01,226.338zM137.491,363.844
                c-11.176,11.144-26.447,18.007-43.481,18.007c-17.034,0-32.29-6.862-43.466-18.007
                c-11.16-11.176-18.008-26.447-18.008-43.481c0-17.026,6.848-32.29,18.008-43.465
                C61.72,265.745,76.976,258.89,94.01,258.89c17.034,0,32.306,6.855,43.481,18.008
                c11.144,11.175,17.992,26.439,18.008,43.465
                C155.483,337.397,148.636,352.668,137.491,363.844z"
              />
              <path
                d="M94.01,293.167c-15.024,0-27.204,12.172-27.204,27.196
                c0,15.032,12.18,27.22,27.204,27.22
                c15.025,0,27.22-12.188,27.22-27.22
                C121.23,305.339,109.035,293.167,94.01,293.167z"
              />
              <path
                d="M439.074,207.55v-65.855c-27.854,0-45.583,18.997-45.583,18.997v27.854
                C393.491,188.546,411.22,207.55,439.074,207.55z"
              />
              <rect x="450.868" y="141.68" width="13.525" height="65.847" />
              <path
                d="M70.5,214.119H220.17v-42.762h-45.52
                c-12.212,0-24.345-1.932-35.954-5.742l-16.261-5.34
                c-11.592-3.81-23.742-5.758-35.953-5.758H70.5
                c-8.47,0-15.348,6.886-15.348,15.372v28.858
                C55.151,207.233,62.029,214.119,70.5,214.119z"
              />
              <path
                d="M343.302,232.111v-1.352H167.03
                c26.029,21.161,42.708,53.435,42.708,89.636
                c0,3.246,1.112,9.761,10.433,9.761h69.928
                c8.888,0,12.118-6.515,12.118-9.761
                C302.217,284.998,318.199,253.272,343.302,232.111z"
              />
            </svg>
            <div className="vehicle-btn-copy">
              <span>Bike</span>
              <small>{formatDuration(routeSummaries.bike?.durationMinutes)}</small>
            </div>
          </div>

          <div
            className={`vehicle-btn ${mode === "walk" ? "active" : ""}`}
            onClick={() => onModeChange("walk")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
            >
              <path
                d="M13.3692 5.13905C13.3692 6.00924 12.6638 6.71466 11.7936 6.71466C10.9234 6.71466 10.218 6.00924 10.218 5.13905C10.218 4.26887 10.9234 3.56345 11.7936 3.56345C12.6638 3.56345 13.3692 4.26887 13.3692 5.13905Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path
                d="M11.7782 14.8313H9.48168C9.94681 12.7756 9.94681 11.0994 9.94681 9.42322L12.1943 9.64358C12.1943 11.2195 11.7782 13.0771 11.7782 14.8313Z"
                fill="currentColor"
              />
              <path
                d="M9.48168 14.8313C8.09375 17.284 6.95068 21.1119 6.95068 21.1119M11.7782 14.8313C13.2124 17.284 12.4653 21.1119 12.4653 21.1119"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.6599 9.42322L14.8501 12.9967L17.5324 11.8874"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.80518 9.08887L6.53081 10.0556L8.79988 13.627"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="vehicle-btn-copy">
              <span>Walk</span>
              <small>{formatDuration(routeSummaries.walk?.durationMinutes)}</small>
            </div>
          </div>
        </div>

        <div className="route-summary-card">
          <div className="route-summary-item">
            <p className="route-summary-label">Estimated time</p>
            <strong>{routeLoading ? "Calculating..." : formatDuration(activeSummary?.durationMinutes)}</strong>
          </div>

          <div className="route-summary-item">
            <p className="route-summary-label">Distance</p>
            <strong>{routeLoading ? "Calculating..." : formatDistance(activeSummary?.distanceKm)}</strong>
          </div>

          {filters?.safest && (
            <div className="route-summary-safety">
              <p className="route-summary-label">Risk score</p>
              <strong>{routeLoading ? "Calculating..." : formatSafetyScore(activeSummary?.safetyScore)}</strong>
              <span className="route-summary-meta">
                {routeLoading ? "Checking road profile..." : `Lower is safer. ${getTimeAwareSafetyLabel(activeSummary)}`}
              </span>
              <span className="route-summary-meta">
                {routeLoading ? "Scanning nearby places..." : getCrowdScoreMessage(activeSummary)}
              </span>
              <span className="route-summary-meta">
                {routeLoading ? "Checking live traffic..." : getTrafficScoreMessage(activeSummary)}
              </span>
              <span className="route-summary-meta">
                {routeLoading ? "Checking street lighting..." : getLightingScoreMessage(activeSummary)}
              </span>
              <span className="route-summary-meta route-summary-note">
                {routeLoading ? "Comparing route options..." : getRouteSelectionMessage(activeSummary)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapBottomPanel;


