import { useState } from "react";
import callImage from "../assets/interview-call.jpg";

const QUESTIONS = [
    {
        q: "What are some critical things that the citizens of Washington PNW need to know about water quality?",
        a: [
            "For recreational WQ, harmful bacteria such as E. coli and freshwater algae (mainly cyanobacteria) are the main issues that can impact recreational uses. Local health departments often monitor for these during the swimming season. It's important for the public to know where to find monitoring information at their city or county website (or through social media, email subscriptions, etc.), in order to make water body use decisions and reduce recreational exposure risk.",
        ],
    },
    {
        q: "Approximately how many lakes/water bodies have algae blooms?",
        a: [
            "This is difficult to say. There's more than 4,000 lakes and 74,000 miles of rivers and streams statewide. For Ecology’s algae toxin testing program, hundreds of lakes have been tested since the program began in 2007.",
        ],
    },
    {
        q: "What variables specifically in Washington lakes are most correlated with algae blooms?",
        a: [
            "I would say that nutrient levels, such as phosphorus and nitrogen (but especially phosphorus), are important to consider. Chlorophyll-a levels and lake transparency are also important factors to understand the trophic state (biological productivity) of lakes. These are often measured in lake monitoring programs to understand the general health of lakes.",
        ],
    },
    {
        q: "How is climate change, and warming weather impacting Washington's lake water quality?",
        a: [
            "Climate change can create conditions that are ideal for algae blooms to thrive under. This includes more sunlight and warmer air temperatures that can lead to warmer water temperatures. In addition, reduced rainfall and snowpack can lower water levels in lakes and make them warmer due to being more shallow. Conversely, more frequent or intense rainstorms can wash nutrients into water bodies and also trigger blooms. Warmer waters also hold less dissolved oxygen, which can negatively impact lake biota.",
        ],
    },
    {
        q: "How do you decide what lakes need the most attention, and what is that lake?",
        a: [
            "Ecology assesses WQ at lakes and river segments and decides if they should be categorized as impaired or not. This means they may not be meeting WQ standards for certain designated uses (such as for drinking water or recreational use). Ecology recently added HABs as an impairment category.",
            "Under the Freshwater Algae Control Program, lakes that receive grant funding are often dealing with chronic HAB issues and are prioritized. Water bodies that are tested and come back with high algae toxin levels are also noted as higher priority. Ecology may also work with local jurisdictions to understand the problems their lakes are going through.",
        ],
    },
    {
        q: "What would make a predictive model useful to environmentalists other than accuracy?",
        a: [
            "In addition to accuracy, models can help fill the time gap left by WQ lab analysis, allowing us to quickly assess risk and make decisions to protect our health when recreating in our lakes.",
            "Models can also help us understand what water bodies to watch out for, or those that may need more attention/resources. Scientists at EPA and USGS are currently using satellite imagery and learning models to predict the onset of blooms.",
        ],
    },
    {
        q: "What are some predictions for the future state of Washington's lakes?",
        a: [
            "There are definitely challenges ahead for Washington’s lakes, due to factors like nutrient pollution, a warming climate, aging infrastructure, etc. While these factors may threaten water quality and quantity in the state, I’m hopeful that the advancement of different technologies can help us meet these challenges. We can also work to reach more communities through public education/outreach to better understand the health of our lakes and our role in protecting them. It will also take curious, driven people to learn how these systems work, how they will deal with change, and the best way to protect these natural resources.",
        ],
    },
];

function InsideTheIssue() {
    const [openIndex, setOpenIndex] = useState(null);

    return (
        <main>
            <section className="banner banner-sm">
                <div className="banner-box">
                    <h1>Inside the Issue: The Interview</h1>

                    <p>
                        We asked a local professional for their take on the state of our
                        waterways today and what's really driving the problem, while
                        sharing some of our own findings along the way.
                    </p>
                </div>
            </section>

            <section className="content-section content-section-wide interview-section">
                <figure className="interview-photo">
                    <img src={callImage} alt="Video call during the water quality interview" />
                </figure>

                <div className="interview-head">
                    <h2 className="interview-heading">Interview Questions and Answers</h2>
                    <p className="interview-intro">
                        We put these questions to Joey Teresi, a staff member at the Washington State Department of
                        Ecology. Over a 30 minute call, we discussed the major causes of algae blooms, their impacts,
                        how accessible water quality information is to local communities, and the future of technology
                        and AI. Below are 7 of the main questions we asked, along with his recorded responses.
                    </p>
                </div>

                <div className="qa-list">
                    {QUESTIONS.map((item, i) => {
                        const open = openIndex === i;
                        return (
                            <div className={"qa-item" + (open ? " qa-item-open" : "")} key={item.q}>
                                <button
                                    type="button"
                                    className="qa-bar"
                                    onClick={() => setOpenIndex(open ? null : i)}
                                    aria-expanded={open}
                                    aria-controls={`qa-panel-${i}`}
                                >
                                    <span className="qa-question">{item.q}</span>
                                    <span className="qa-icon" aria-hidden="true">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                            <line x1="2" y1="8" x2="14" y2="8" />
                                            <line className="qa-icon-v" x1="8" y1="2" x2="8" y2="14" />
                                        </svg>
                                    </span>
                                </button>
                                <div className="qa-panel" id={`qa-panel-${i}`}>
                                    <div className="qa-panel-inner">
                                        <div className="qa-answer">
                                            {item.a.map((para) => <p key={para}>{para}</p>)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}

export default InsideTheIssue;
