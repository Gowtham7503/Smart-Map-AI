import { useState, useEffect } from "react";

const PlaceHoverCard = ({
  detailMode = false,
  error,
  loading = false,
  onViewMore,
  place,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const images = place.images || [];

  // 🔥 Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedIndex === null) return;

      if (e.key === "Escape") {
        setSelectedIndex(null);
      }

      if (e.key === "ArrowRight") {
        setSelectedIndex((prev) =>
          prev === images.length - 1 ? 0 : prev + 1
        );
      }

      if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) =>
          prev === 0 ? images.length - 1 : prev - 1
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, images.length]);

  return (
    <>
      <div className={detailMode ? "hover-card detail-card" : "hover-card"}>
        <h4>{place.name}</h4>

        {detailMode ? (
          <>
            <p>{loading ? "Loading..." : place.description}</p>

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
            <p>{place.category || "Location"}</p>
            <button onClick={onViewMore}>View More →</button>
          </>
        )}
      </div>

      {/* 🔥 POPUP WITH SLIDER */}
      {selectedIndex !== null && (
        <div
          className="image-popup"
          onClick={() => setSelectedIndex(null)}
        >
          {/* Close */}
          <span className="close-btn">×</span>

          {/* Prev */}
          <button
            className="nav-btn left"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex(
                selectedIndex === 0
                  ? images.length - 1
                  : selectedIndex - 1
              );
            }}
          >
            ‹
          </button>

          {/* Image */}
          <img
            src={images[selectedIndex]}
            alt="preview"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          <button
            className="nav-btn right"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex(
                selectedIndex === images.length - 1
                  ? 0
                  : selectedIndex + 1
              );
            }}
          >
            ›
          </button>
        </div>
      )}
    </>
  );
};

export default PlaceHoverCard;