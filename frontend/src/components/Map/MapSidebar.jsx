const MapSidebar = ({
  fetchRoute,
  filters,
  from,
  onClearFilters,
  onFilterToggle,
  onSwapLocations,
  setFrom,
  setTo,
  showSidebar,
  sidebarWidth,
  to,
}) => {
  if (!showSidebar) {
    return null;
  }

  return (
    <div className="sidebar" style={{ width: sidebarWidth }}>
      <div className="logo">
        <h2>
          Smart<span>Maps</span>
        </h2>
        <p>Safe • Smart • Sustainable</p>
      </div>

      <form
        className="route-box"
        onSubmit={(e) => {
          e.preventDefault();
          fetchRoute();
        }}
      >
        <div className="route-field">
          <div className="icon green-dot"></div>

          <div className="field-content">
            <label>From</label>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="My Location"
            />
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={() => setFrom("My Location")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M19.14 12.94a7.49 7.49 0 000-1.88l2.03-1.58a.5.5 0 00.12-.65l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.28 7.28 0 00-1.63-.95l-.36-2.54a.5.5 0 00-.5-.42h-3.84a.5.5 0 00-.5.42l-.36 2.54c-.58.23-1.12.54-1.63.95l-2.39-.96a.5.5 0 00-.6.22L2.71 8.83a.5.5 0 00.12.65l2.03 1.58a7.49 7.49 0 000 1.88l-2.03 1.58a.5.5 0 00-.12.65l1.92 3.32c.14.24.43.34.7.22l2.39-.96c.51.41 1.05.73 1.63.95l.36 2.54c.05.26.26.42.5.42h3.84c.24 0 .45-.16.5-.42l.36-2.54c.58-.23 1.12-.54 1.63-.95l2.39.96c.27.12.56.02.7-.22l1.92-3.32a.5.5 0 00-.12-.65l-2.03-1.58zM12 15.5A3.5 3.5 0 1112 8a3.5 3.5 0 010 7.5z"
              />
            </svg>
          </button>
        </div>

        <div className="divider"></div>

        <div className="route-field">
          <div className="icon red-dot"></div>

          <div className="field-content">
            <label>To</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Enter destination"
            />
          </div>

          <button
            type="button"
            className="icon-btn swap-btn"
            onClick={onSwapLocations}
          >
            ⇅
          </button>
        </div>

        <button type="submit" className="directions-btn">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="currentColor" d="M3 11l18-8-8 18-2-7-8-3z" />
          </svg>
          Get Directions
        </button>
      </form>

      <div className="filters-section">
        <div className="filters-header">
          <h4>Quick Filters</h4>
          <span className="clear-btn" onClick={onClearFilters}>
            Clear
          </span>
        </div>

        <div
          className={`filter-item ${filters.safest ? "active" : ""}`}
          onClick={() => onFilterToggle("safest")}
        >
          <div className="filter-left">
            <div className="filter-icon green">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M12 2L4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3z"
                />
              </svg>
            </div>
            <div>
              <p>Safest Route</p>
              <span>Well-lit, secure roads</span>
            </div>
          </div>

          <input type="checkbox" checked={filters.safest} readOnly />
        </div>

        <div
          className={`filter-item ${filters.pollution ? "active" : ""}`}
          onClick={() => onFilterToggle("pollution")}
        >
          <div className="filter-left">
            <div className="filter-icon green">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M6 21c8-2 12-8 12-16C10 5 6 13 6 21z"
                />
              </svg>
            </div>
            <div>
              <p>Low Pollution</p>
              <span>Eco-friendly paths</span>
            </div>
          </div>

          <input type="checkbox" checked={filters.pollution} readOnly />
        </div>

        <div
          className={`filter-item ${filters.traffic ? "active" : ""}`}
          onClick={() => onFilterToggle("traffic")}
        >
          <div className="filter-left">
            <div className="filter-icon gray">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
                />
              </svg>
            </div>
            <div>
              <p>Avoid Traffic</p>
              <span>Live traffic routes</span>
            </div>
          </div>

          <input type="checkbox" checked={filters.traffic} readOnly />
        </div>
      </div>

      <div className="user-section">
        <div className="user-card" onClick={() => alert("Redirect to Login Page")}>
          <div className="user-left">
            <div className="user-avatar">G</div>

            <div>
              <p>Guest User</p>
              <span>Sign in for personalized routes</span>
            </div>
          </div>

          <div className="user-arrow">›</div>
        </div>
      </div>
    </div>
  );
};

export default MapSidebar;
