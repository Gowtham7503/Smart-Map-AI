import { useEffect, useState } from "react";

const ArrowIcon = ({ direction = "right" }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={`slider-icon slider-icon-${direction}`}
    fill="none"
  >
    <path
      d={
        direction === "left"
          ? "M14.5 5.5L8 12l6.5 6.5"
          : "M9.5 5.5L16 12l-6.5 6.5"
      }
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="slider-icon" fill="none">
    <path
      d="M6.75 6.75L17.25 17.25M17.25 6.75L6.75 17.25"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

const PlaceHoverCard = ({
  detailMode = false,
  error,
  loading = false,
  onClose,
  onViewMore,
  place,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const images = place?.images || [];
  const title = place?.name || "Selected place";
  const description =
    place?.description?.trim() || "Place details are not available right now.";

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedIndex === null) return;

      if (e.key === "Escape") setSelectedIndex(null);

      if (e.key === "ArrowRight") {
        setSelectedIndex((prev) =>
          prev === images.length - 1 ? 0 : prev + 1,
        );
      }

      if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) =>
          prev === 0 ? images.length - 1 : prev - 1,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, images.length]);

  return (
    <>
      <div className={detailMode ? "hover-card detail-card" : "hover-card"}>
        {detailMode && onClose && (
          <button
            type="button"
            className="detail-card-back-btn"
            onClick={onClose}
          >
            <ArrowIcon direction="left" />
            Back To Route
          </button>
        )}

        <h4>{title}</h4>

        {detailMode ? (
          <>
            <p>{loading ? "Loading..." : description}</p>

            {error && <p className="detail-card-error">{error}</p>}

            {place?.wiki_link && (
              <a
                className="detail-card-link"
                href={place.wiki_link}
                target="_blank"
                rel="noreferrer"
              >
                Read more on wikipedia
              </a>
            )}

            {!loading && images.length > 0 && (
              <div className="detail-card-gallery">
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    onClick={() => setSelectedIndex(i)}
                    alt=""
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <p>{place?.category || "Location"}</p>
            <button className="hover-card-action" onClick={onViewMore}>
              View More
            </button>
          </>
        )}
      </div>

      {selectedIndex !== null && images[selectedIndex] && (
        <div className="image-popup" onClick={() => setSelectedIndex(null)}>
          <button
            type="button"
            className="close-btn"
            aria-label="Close image preview"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex(null);
            }}
          >
            <CloseIcon />
          </button>

          <button
            type="button"
            className="nav-btn left"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex(
                selectedIndex === 0 ? images.length - 1 : selectedIndex - 1,
              );
            }}
          >
            <ArrowIcon direction="left" />
          </button>

          <img
            src={images[selectedIndex]}
            alt="preview"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            className="nav-btn right"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex(
                selectedIndex === images.length - 1 ? 0 : selectedIndex + 1,
              );
            }}
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      )}
    </>
  );
};

export default PlaceHoverCard;
