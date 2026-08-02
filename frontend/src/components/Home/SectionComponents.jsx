import { useEffect, useRef, useState } from "react";

export const SectionHeading = ({ eyebrow, title, description, align = "left" }) => {
  return (
    <div className={`section-heading ${align === "center" ? "section-heading-center" : ""}`}>
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {description ? <p className="section-description">{description}</p> : null}
    </div>
  );
};

export const AnimatedSection = ({ children, className = "", animation = "fade-up", delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${animation} ${className}`.trim()}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export const StatItem = ({ value, label, detail }) => {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <p className="stat-detail">{detail}</p>
    </div>
  );
};

export const TechCard = ({ title, accent }) => {
  return (
    <div className="tech-card">
      <div className="tech-icon" style={{ background: accent }} />
      <span>{title}</span>
    </div>
  );
};
