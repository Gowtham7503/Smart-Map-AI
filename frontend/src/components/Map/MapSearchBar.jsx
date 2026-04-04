const MapSearchBar = ({
  onDirectionsClick,
  onSearch,
  onSearchChange,
  searchLoading,
  searchQuery,
  showSidebar,
}) => {
  return (
    <div className={`search-bar ${!showSidebar ? "top-left" : ""}`}>
      <form className="search-box" onSubmit={onSearch}>
        <button
          type="submit"
          className="search-submit-btn"
          aria-label="Search location"
          disabled={searchLoading}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="16.65"
              y1="16.65"
              x2="21"
              y2="21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search location, place..."
        />

        <span className="mic-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <rect
              x="9"
              y="3"
              width="6"
              height="11"
              rx="3"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M5 11a7 7 0 0 0 14 0"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="12"
              y1="18"
              x2="12"
              y2="22"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </span>

        <button
          type="button"
          className="search-directions-btn"
          onClick={onDirectionsClick}
          aria-label="Toggle directions panel"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path
              d="M14 5l5 5-5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19 10H9a3 3 0 0 0-3 3v6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default MapSearchBar;
