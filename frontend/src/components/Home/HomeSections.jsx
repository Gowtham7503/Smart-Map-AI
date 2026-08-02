import {
  FaBrain,
  FaShieldAlt,
  FaTrafficLight,
  FaLeaf,
  FaMapMarkedAlt,
  FaCloudSun,
  FaTemperatureHigh,
  FaRoute,
  FaChartLine,
  FaMobileAlt,
  FaUsers,
  FaArrowRight,
  FaChevronDown,
  FaGithub,
  FaLinkedin,
  FaGlobe,
  FaCompass,
  FaDatabase,
  FaServer,
  FaBolt,
  FaCheckCircle,
  FaMap,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaRocket,
} from "react-icons/fa";
import { SectionHeading, AnimatedSection, StatItem, TechCard } from "./SectionComponents";

const whySmartMaps = [
  {
    icon: <FaBrain />,
    title: "AI-Powered Route Optimization",
    description: "Models traffic, weather, and safety signals to guide every route decision.",
  },
  {
    icon: <FaShieldAlt />,
    title: "Safety-Based Navigation",
    description: "Prioritizes secure destinations and lower-risk travel patterns.",
  },
  {
    icon: <FaTrafficLight />,
    title: "Real-Time Traffic Analysis",
    description: "Continuously evaluates current road conditions to avoid delays.",
  },
  {
    icon: <FaLeaf />,
    title: "Pollution-Aware Routing",
    description: "Helps minimize exposure to polluted corridors and unnecessary emissions.",
  },
  {
    icon: <FaChartLine />,
    title: "Smart Urban Insights",
    description: "Uncovers neighborhood patterns to support better city planning.",
  },
];

const features = [
  { icon: <FaShieldAlt />, title: "Safe Route Recommendation", description: "Find calmer, better-protected routes with confidence." },
  { icon: <FaTrafficLight />, title: "Traffic Monitoring", description: "Stay ahead of congestion with live network insights." },
  { icon: <FaCloudSun />, title: "Weather Integration", description: "Adapt journey plans around rain, heat, and changing conditions." },
  { icon: <FaTemperatureHigh />, title: "Pollution Monitoring", description: "Track AQI and reduce exposure along the way." },
  { icon: <FaMapMarkedAlt />, title: "Nearby Essential Services", description: "Discover hospitals, fuel stations, and convenience stops quickly." },
  { icon: <FaMap />, title: "Interactive Maps", description: "Explore routes with a polished, fluid mapping experience." },
  { icon: <FaRoute />, title: "Alternative Routes", description: "Compare multiple path options before setting off." },
  { icon: <FaChartLine />, title: "Safety Score", description: "Understand route quality through one transparent metric." },
  { icon: <FaMobileAlt />, title: "Responsive Design", description: "Use SmartMaps seamlessly on any device." },
];

const workflowSteps = [
  { icon: <FaUsers />, title: "User" },
  { icon: <FaGlobe />, title: "Frontend" },
  { icon: <FaServer />, title: "Backend" },
  { icon: <FaDatabase />, title: "APIs" },
  { icon: <FaBrain />, title: "AI Decision Engine" },
  { icon: <FaCompass />, title: "Best Route" },
];

const testimonials = [
  {
    name: "Ava Patel",
    role: "Urban Mobility Lead",
    review: "The experience feels premium and incredibly thoughtful. It makes route decisions effortless.",
  },
  {
    name: "Marcus Chen",
    role: "City Planner",
    review: "The insights are polished and practical. It offers a modern lens for safer urban navigation.",
  },
  {
    name: "Nadia Brooks",
    role: "Daily Commuter",
    review: "I trust the recommendations now more than ever. The interface is intuitive and calm.",
  },
];

const faqItems = [
  { question: "What is SmartMaps?", answer: "SmartMaps is an AI-powered navigation experience designed to recommend routes that balance speed, safety, weather, traffic, and pollution." },
  { question: "How is Safety Score calculated?", answer: "Safety Score blends route reliability, traffic pressure, environmental conditions, and awareness of high-risk areas to produce a clear recommendation." },
  { question: "What APIs are used?", answer: "The platform combines mapping, weather, air quality, and routing services to create richer journey insights." },
  { question: "How is AI involved?", answer: "AI evaluates multiple route candidates and ranks them based on real-time conditions and user-focused priorities." },
  { question: "Is pollution considered?", answer: "Yes. Pollution and AQI are part of the decision process to support healthier and more sustainable travel." },
  { question: "Can I compare routes?", answer: "Absolutely. Users can review alternative pathways and choose the option that best fits their needs." },
];

export const HomeSections = () => {
  return (
    <div className="home-sections">
      <section className="content-section about-section" id="about">
        <AnimatedSection>
          <SectionHeading
            eyebrow="About SmartMaps"
            title="Who We Are"
            description="SmartMaps is an AI-powered navigation platform that helps modern cities move with more clarity, protection, and sustainability."
          />
        </AnimatedSection>

        <div className="about-grid">
          <AnimatedSection animation="fade-left" delay={80}>
            <div className="about-card">
              <h3>Our story</h3>
              <p>
                We believe great navigation should feel intelligent and human. SmartMaps combines live traffic data, weather awareness, air quality signals, and AI reasoning to suggest routes that are safer, smoother, and more responsible.
              </p>
              <ul className="values-list">
                <li><FaCheckCircle /> <span>AI-powered navigation</span></li>
                <li><FaCheckCircle /> <span>Safer route planning</span></li>
                <li><FaCheckCircle /> <span>Traffic intelligence</span></li>
                <li><FaCheckCircle /> <span>Pollution awareness</span></li>
              </ul>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fade-right" delay={120}>
            <div className="about-card">
              <h3>Mission & Vision</h3>
              <div className="about-story">
                <div>
                  <strong>Mission</strong>
                  <p>Make every journey more informed, secure, and sustainable through thoughtful route intelligence.</p>
                </div>
                <div>
                  <strong>Vision</strong>
                  <p>Create a smarter urban mobility experience grounded in safety, environmental awareness, and better city planning.</p>
                </div>
                <div>
                  <strong>Core Values</strong>
                  <p>Clarity, reliability, innovation, and respect for the people who move through the city every day.</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="content-section why-section">
        <AnimatedSection>
          <SectionHeading
            eyebrow="Why SmartMaps?"
            title="A premium navigation layer for modern cities"
            description="Designed for people who expect intelligence, clarity, and confidence in every journey."
          />
        </AnimatedSection>

        <div className="why-grid">
          <AnimatedSection animation="fade-left" delay={100}>
            <div className="why-copy-card">
              <h3>Built to make every route feel smarter.</h3>
              <p>
                SmartMaps blends AI decision-making with live data streams so users can move through dense urban environments with more assurance and less friction.
              </p>
              <div className="bullet-list">
                <div><FaCheckCircle /> <span>Adaptive routing with context-aware intelligence</span></div>
                <div><FaCheckCircle /> <span>Cleaner, healthier travel decisions</span></div>
                <div><FaCheckCircle /> <span>Beautiful, responsive route exploration</span></div>
              </div>
            </div>
          </AnimatedSection>

          <div className="why-cards-grid">
            {whySmartMaps.map((item, index) => (
              <AnimatedSection key={item.title} animation="fade-right" delay={120 + index * 60}>
                <div className="mini-card">
                  <div className="mini-icon">{item.icon}</div>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section features-section" id="features">
        <AnimatedSection>
          <SectionHeading
            eyebrow="Platform Features"
            title="Everything you need to navigate with confidence"
            description="A feature-rich experience designed for commuters, planners, and city-focused teams."
            align="center"
          />
        </AnimatedSection>

        <div className="feature-grid">
          {features.map((feature, index) => (
            <AnimatedSection key={feature.title} animation="fade-up" delay={80 + index * 40}>
              <div className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <section className="content-section how-section">
        <AnimatedSection>
          <SectionHeading
            eyebrow="How It Works"
            title="From origin to recommendation in six thoughtful steps"
            description="A clear path from route input to intelligent decision-making."
          />
        </AnimatedSection>

        <div className="timeline">
          {workflowSteps.map((step, index) => (
            <div key={step.title} className="timeline-step">
              <div className="timeline-card">
                <div className="timeline-icon">{step.icon}</div>
                <h4>{step.title}</h4>
                {index === 0 ? <p>Enter source and destination</p> : null}
                {index === 1 ? <p>Fetch multiple route options</p> : null}
                {index === 2 ? <p>Gather traffic, weather, and AQI</p> : null}
                {index === 3 ? <p>Analyze route quality</p> : null}
                {index === 4 ? <p>Calculate safety score</p> : null}
                {index === 5 ? <p>Recommend the best path</p> : null}
              </div>
              {index < workflowSteps.length - 1 ? <div className="timeline-line"><FaArrowRight /></div> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="content-section stats-section">
        <AnimatedSection>
          <SectionHeading
            eyebrow="Performance at a glance"
            title="Trusted by ambitious teams and commuters alike"
            description="Metrics that reflect reliability, insight, and a premium experience."
            align="center"
          />
        </AnimatedSection>

        <div className="stats-grid">
          <StatItem value="1000+" label="Routes Analysed" detail="Every day, smarter travel decisions are being made." />
          <StatItem value="95%" label="Route Accuracy" detail="A strong balance of relevance and real-world precision." />
          <StatItem value="24/7" label="Navigation Support" detail="Continuous guidance for changing urban conditions." />
          <StatItem value="Live" label="Traffic Monitoring" detail="Instant awareness for smooth, responsive routes." />
        </div>
      </section>

      <section className="content-section vision-section">
        <div className="vision-illustration">
          <div className="vision-orb" />
          <div className="vision-grid" />
          <div className="vision-card">
            <FaBolt />
            <span>Connected Intelligence</span>
          </div>
        </div>

        <div className="vision-copy">
          <SectionHeading
            eyebrow="Smart City Vision"
            title="Creating safer, smarter, more sustainable urban movement"
            description="SmartMaps is a foundation for modern city ecosystems built around resilience, transparency, and better public experience."
          />
          <div className="vision-list">
            <div><FaCheckCircle /> <span>Smarter Cities</span></div>
            <div><FaCheckCircle /> <span>Safer Navigation</span></div>
            <div><FaCheckCircle /> <span>Sustainable Transportation</span></div>
            <div><FaCheckCircle /> <span>Better Urban Planning</span></div>
          </div>
        </div>
      </section>

      <section className="content-section tech-section">
        <AnimatedSection>
          <SectionHeading
            eyebrow="Technology Stack"
            title="Built with modern tools for a polished experience"
            description="The stack balances performance, flexibility, and forward-looking design."
            align="center"
          />
        </AnimatedSection>

        <div className="tech-grid">
          <TechCard title="React" accent="linear-gradient(135deg, #00e676, #00b96b)" />
          <TechCard title="Vite" accent="linear-gradient(135deg, #7c4dff, #5c34c7)" />
          <TechCard title="Python" accent="linear-gradient(135deg, #4fc3f7, #0288d1)" />
          <TechCard title="Flask" accent="linear-gradient(135deg, #ffca28, #ffa000)" />
          <TechCard title="Leaflet" accent="linear-gradient(135deg, #ff7043, #e64a19)" />
          <TechCard title="OpenRouteService" accent="linear-gradient(135deg, #66bb6a, #2e7d32)" />
          <TechCard title="Weather API" accent="linear-gradient(135deg, #29b6f6, #0277bd)" />
          <TechCard title="Air Quality API" accent="linear-gradient(135deg, #ab47bc, #7b1fa2)" />
          <TechCard title="JavaScript" accent="linear-gradient(135deg, #ffd54f, #ffb300)" />
          <TechCard title="CSS" accent="linear-gradient(135deg, #26c6da, #00838f)" />
        </div>
      </section>

      <section className="content-section workflow-section">
        <AnimatedSection>
          <SectionHeading
            eyebrow="Project Workflow"
            title="A clear pipeline from user input to route recommendation"
            description="Each stage contributes to a more intelligent and reliable journey outcome."
            align="center"
          />
        </AnimatedSection>

        <div className="workflow-horizontal">
          {workflowSteps.map((step, index) => (
            <div key={step.title} className="workflow-item">
              <div className="workflow-icon">{step.icon}</div>
              <span>{step.title}</span>
              {index < workflowSteps.length - 1 ? <FaArrowRight className="workflow-arrow" /> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="content-section testimonial-section">
        <AnimatedSection>
          <SectionHeading
            eyebrow="Voices from the experience"
            title="People value clarity, calm, and confidence"
            description="A modern product experience that feels both polished and practical."
            align="center"
          />
        </AnimatedSection>

        <div className="testimonial-carousel">
          {testimonials.map((testimonial, index) => (
            <AnimatedSection key={testimonial.name} animation="fade-up" delay={80 + index * 50}>
              <div className="testimonial-card">
                <div className="avatar">{testimonial.name.charAt(0)}</div>
                <h4>{testimonial.name}</h4>
                <p className="testimonial-role">{testimonial.role}</p>
                <p className="testimonial-review">“{testimonial.review}”</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <section className="content-section contact-section" id="contact">
        <AnimatedSection>
          <SectionHeading
            eyebrow="Contact"
            title="Let’s build smarter journeys together"
            description="Connect with the SmartMaps team for product questions, partnerships, or feedback."
          />
        </AnimatedSection>

        <div className="contact-grid">
          <AnimatedSection animation="fade-left" delay={80}>
            <div className="contact-card">
              <form className="contact-form">
                <input type="text" placeholder="Name" aria-label="Name" />
                <input type="email" placeholder="Email" aria-label="Email" />
                <input type="text" placeholder="Subject" aria-label="Subject" />
                <textarea placeholder="Message" aria-label="Message" />
                <div className="contact-actions">
                  <button type="button" className="hero-btn">Send Message</button>
                  <button type="button" className="ghost-btn">Learn More</button>
                </div>
              </form>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fade-right" delay={120}>
            <div className="contact-card">
              <ul className="contact-details-list">
                <li><FaEnvelope /> <a href="mailto:hello@smartmaps.ai">hello@smartmaps.ai</a></li>
                <li><FaPhone /> <a href="tel:+1234567890">+1 (234) 567-890</a></li>
                <li><FaMapMarkerAlt /> <span>123 Urban Avenue, Smart City, CA</span></li>
                <li><FaGithub /> <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a></li>
                <li><FaLinkedin /> <a href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a></li>
              </ul>
              <div className="map-placeholder">
                <FaMap />
                <span>Google Maps location placeholder</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="content-section faq-section">
        <AnimatedSection>
          <SectionHeading
            eyebrow="Frequently Asked Questions"
            title="Everything you might want to know"
            description="A straightforward overview of the experience, intelligence, and value behind SmartMaps."
          />
        </AnimatedSection>

        <div className="faq-list">
          {faqItems.map((item, index) => (
            <details key={item.question} className="faq-item" open={index === 0}>
              <summary>
                <span>{item.question}</span>
                <FaChevronDown />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="content-section cta-section">
        <AnimatedSection animation="scale">
          <div className="cta-banner">
            <h3>Start Your Smarter Journey Today</h3>
            <p>Explore a new kind of route intelligence built for modern cities.</p>
            <div className="cta-actions">
              <button className="hero-btn" onClick={() => window.location.assign("/dashboard")}>Explore Maps</button>
              <button className="ghost-btn">Learn More</button>
            </div>
          </div>
        </AnimatedSection>
      </section>

      <footer className="home-footer">
        <div>
          <h4>SmartMaps</h4>
          <p>Premium navigation intelligence for a cleaner, safer commute.</p>
        </div>
        <div className="footer-links">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#contact">Technology</a>
          <a href="#contact">Contact</a>
          <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
        <div className="footer-socials">
          <a href="https://github.com" target="_blank" rel="noreferrer"><FaGithub /></a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer"><FaLinkedin /></a>
          <a href="https://www.google.com" target="_blank" rel="noreferrer"><FaGlobe /></a>
        </div>
        <p className="copyright">© 2026 SmartMaps. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomeSections;
