const BADGE_CLASS_BY_CATEGORY = {
  "Research Paper": "source-type-research-paper",
  "Government Data & Monitoring": "source-type-government",
  "University Report": "source-type-university-report",
  "Article": "source-type-article",
  "Guidebook": "source-type-guidebook",
};

function sortByCategory(items) {
  const buckets = new Map();

  for (const item of items) {
    const bucket = buckets.get(item.category) ?? [];
    bucket.push(item);
    buckets.set(item.category, bucket);
  }

  return [...buckets.values()].flat();
}

function SourcesPage() {
  const readingList = [
    {
      title: "DataStream - A Guide to Water Quality",
      summary: "An accessible guidebook to understanding and measuring water quality, explaining key indicators such as pH, dissolved oxygen, conductivity, and Secchi depth, along with how these measurements can be used to assess the health and overall condition of a waterway",
      link: "https://datastream.org/en-ca/guidebook",
      category: "Guidebook",
    },
    {
      title: "EPA Pollution Prevention Tips",
      summary: "A collection of practical tips and strategies that individuals can implement right away to reduce water pollution, conserve water, prevent harmful pollutants from entering waterways",
      link: "https://www.epa.gov/p2/pollution-prevention-tips-water-conservation",
      category: "Article",
    },
    {
      title: "PLOS ONE - A Local Study",
      summary: "Research examining water quality conditions in Puget Sound state parks, focusing on bacterial levels in local water bodies and how changes in water conditions may affect summer recreation and public use",
      link: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3579825/",
      category: "Research Paper",
    },
    {
      title: "UW - Puget Sound Water Quality",
      summary: "A regional assessment of less-discussed environmental changes affecting Puget Sound's water quality, including factors such as dissolved oxygen, ocean acidification, nutrients, harmful algal blooms, and other changes that can influence the health of marine ecosystems",
      link: "https://cig.uw.edu/wp-content/uploads/sites/2/2014/11/ps-sok_sec07_marinewaterquality_2015.pdf",
      category: "University Report",
    },
    {
      title: "King County Swimming Beach Water Quality",
      summary: "A public safety resource that provides current information on swimming beach conditions, helping people check bacteria levels and water temperatures before visiting and avoid swimming when conditions may be unsafe",
      link: "http://kingcounty.gov/en/dept/dnrp/nature-recreation/parks-recreation/king-county-parks/water-recreation/swimming-beach-bacteria-temperature",
      category: "Government Data & Monitoring",
    },
    {
      title: "Science - 6PPD-Quinone",
      summary: "A research study on 6PPD-quinone, a tire-derived pollutant that can enter waterways through stormwater runoff and has been found to pose risks to aquatic life, highlighting a lesser-known source of water pollution",
      link: "https://www.science.org/doi/10.1126/science.abd6951",
      category: "Research Paper",
    },
  ];

  const orderedEntries = sortByCategory(readingList);

  return (
    <main>
      <section className="banner banner-sm">
        <div className="banner-box">
          <h1>Featured Resources</h1>

          <p>
            Explore some of the sources (e.g. guidebooks, websites, articles) we used in our research to learn more about the state of water quality and how you can help protect it.
          </p>
        </div>
      </section>

      <section className="content-section content-section-wide sources-section">
        <div className="source-list">
          {orderedEntries.map((entry) => (
            <div className="source-item" key={entry.title}>
              <div className="source-info">
                <div className="source-heading">
                  <h3>{entry.title}</h3>
                  <span className={`source-type ${BADGE_CLASS_BY_CATEGORY[entry.category] || ""}`}>
                    {entry.category}
                  </span>
                </div>
                <p>{entry.summary}</p>
              </div>

              <a
                href={entry.link}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
                aria-label={`Visit ${entry.title}`}
              >
                <svg
                  width="18"
                  height="18"
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
              </a>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default SourcesPage;