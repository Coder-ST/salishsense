import { Link } from "react-router-dom";
import card1 from "../assets/home-card-1.jpg";
import card2 from "../assets/home-card-2.jpg";
import card3 from "../assets/home-card-3.jpg";
import bannerImage from "../assets/home-banner.jpg";

function HomePage() {
    return (
        <main>
            <section
                className="banner banner-sm banner-photo"
                style={{ backgroundImage: `linear-gradient(rgba(15, 42, 73, 0.62), rgba(15, 42, 73, 0.62)), url(${bannerImage})` }}
            >
                <div className="banner-box">
                    <h1>Washington's Water, By the Numbers</h1>

                    <p>
                        Explore Washington's water quality through interactive maps, data, and research
                        — and use AI-strengthened insights to understand the health of your local waterways.
                    </p>
                </div>
            </section>

            <section className="home-cards">
                {[
                    {
                        image: card1,
                        tone: "home-card-blue",
                        title: "Interactive Graphs",
                        button: { label: "View Graphs", to: "/our-research" },
                        text: "Take a look and play around with the several interactive maps and graphs we built using Plotly and Pandas. They break down key metrics and trends (both historic and current) for Washington's local lakes.",
                    },
                    {
                        image: card2,
                        tone: "home-card-teal",
                        title: "AI Analysis",
                        button: { label: "View Tool", to: "/ai-analysis" },
                        text: "See what our Random Forest model forecasts for chlorophyll-a at Lake Wilderness. We trained it on decades of past samples, and it shows how well we can predict algae levels at the next sampling.",
                    },
                    {
                        image: card3,
                        tone: "home-card-green",
                        title: "External Resources",
                        button: { label: "View Resources", to: "/sources" },
                        text: "Browse the research papers, government data and reports behind our work. Every source we used to build the maps, graphs and model is listed in one place so you can read it for yourself.",
                    },
                ].map((card) => (
                    <div className={`home-card ${card.tone}`} key={card.title}>
                        <img src={card.image} alt="" className="home-card-bg" />
                        <div className="home-card-content">
                            <h3 className="home-card-title">{card.title}</h3>
                            <p className="home-card-text">{card.text}</p>
                            <Link to={card.button.to} className="home-card-button">
                                {card.button.label}
                                <span aria-hidden="true">&rarr;</span>
                            </Link>
                        </div>
                    </div>
                ))}
            </section>

            <section className="home-sources">
                <div className="home-why">
                    <h3>Why We Built This App</h3>
                    <p>
                        Watching a once-lively backyard pond become overtaken by green algae made us want to understand why.
                        We learned that 40 lakes across Washington have suffered harmful algal blooms, fueled by nitrogen and phosphorus runoff from fertilizers. 
                    </p>
                    <p>
                        Finding patterns wasn’t enough:
                        the people responsible for these waterways needed to see what we were seeing. So we created SalishSense.
                    </p>
                    <Link to="/inside-the-issue" className="home-why-link">
                        Learn More Here
                    </Link>
                </div>

                <div className="source-list">
                    {[
                        {
                            title: "King County Small Lakes",
                            tag: "Government",
                            tone: "home-tag-government",
                            text: "Analyzed nutrients and water clarity to assess algae bloom risk.",
                            link: "https://green2.kingcounty.gov/smalllakes/WQData.aspx",
                        },
                        {
                            title: "King County Streams",
                            tag: "Kaggle",
                            tone: "home-tag-kaggle",
                            text: "Analyzed nutrients and chemical levels to identify algae growth factors.",
                            link: "https://www.kaggle.com/datasets/magdas0/king-county-stream-water-quality/data",
                        },
                        {
                            title: "Water Potability Dataset",
                            tag: "Kaggle",
                            tone: "home-tag-kaggle",
                            text: "Applied machine learning to identify chemical patterns and predict seasonal water quality.",
                            link: "https://www.kaggle.com/datasets/adityakadiwal/water-potability",
                        },
                    ].map((entry) => (
                        <a
                            className="source-item"
                            key={entry.title}
                            href={entry.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${entry.title}`}
                        >
                            <div className="source-info">
                                <span className={`home-tag ${entry.tone}`}>{entry.tag}</span>
                                <h3>{entry.title}</h3>
                                <p>{entry.text}</p>
                            </div>

                            <span className="home-source-arrow" aria-hidden="true">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="7" y1="17" x2="17" y2="7" />
                                    <polyline points="7 7 17 7 17 17" />
                                </svg>
                            </span>
                        </a>
                    ))}
                </div>
            </section>

            <section className="home-steps">
                {[
                    {
                        title: "Collect the Data",
                        text: "Gather records from Lake Wilderness and Lake Sawyer to investigate the chemical conditions driving changes in water quality.",
                    },
                    {
                        title: "Find the Patterns",
                        text: "Apply statistical and regression models, including correlation matrices and regression lines, to assess water quality.",
                    },
                    {
                        title: "Share Our Findings",
                        text: "Present findings to the Bellevue Water Department and Michael Pan, and interview a water quality official for context.",
                    },
                    {
                        title: "Build the App",
                        text: "Build an informational hub with AI‑powered anomaly detection and actionable steps to improve water quality.",
                    },
                ].map((step, i) => (
                    <div className={`home-step ${i % 2 === 0 ? "home-step-up" : "home-step-down"}`} key={step.title}>
                        <span className="home-step-circle">{i + 1}</span>
                        <span className="home-step-stem" />
                        <div className="home-step-text">
                            <h4>{step.title}</h4>
                            <p>{step.text}</p>
                        </div>
                    </div>
                ))}
            </section>
        </main>
    );
}

export default HomePage;
