import { useEffect, useMemo, useRef, useState } from "react";
import Plotly from "plotly.js-dist-min";
import phosphorusTurbidityData from "../research/phosphorusTurbidity.json";
import {
    actualVsPredicted,
    loadChlorophyllForecasts,
    loadLakeWilderness,
    waterQualityMetrics,
} from "../research/cacWaterQuality.js";

const tickColor = "#7a8594";
const gridColor = "#dbe3ec";
const surfaceColor = "#f2f6fb";

const axisStyle = {
    gridcolor: gridColor,
    linecolor: gridColor,
    zeroline: false,
    ticks: "",
    ticklabelstandoff: 8,
    automargin: true,
};

const descriptions = {
    "TP (µg/L)": "Total phosphorus, a nutrient that feeds algae.",
    "Secchi (m)": "Water clarity. Higher means clearer water.",
    "Temp (°C)": "Water temperature.",
};

function Figure({ fig }) {
    const plotRef = useRef(null);

    useEffect(() => {
        Plotly.react(plotRef.current, fig.data, fig.layout, { responsive: true, ...fig.config });
    }, [fig]);

    useEffect(() => {
        const node = plotRef.current;
        return () => Plotly.purge(node);
    }, []);

    return <div ref={plotRef} className="figure-frame" />;
}

function LakeWildernessTrends() {
    const [df, setDf] = useState(null);
    const [hidden, setHidden] = useState([]);

    useEffect(() => {
        loadLakeWilderness().then(setDf);
    }, []);

    const base = useMemo(() => (df ? waterQualityMetrics(df) : null), [df]);

    // Site styling on top of the notebook figure. The toggle panel replaces the legend.
    const fig = useMemo(
        () =>
            base && {
                data: base.data.map((trace) => ({
                    ...trace,
                    visible: !hidden.includes(trace.name),
                    hovertemplate: "%{y}",
                })),
                layout: {
                    ...base.layout,
                    title: undefined,
                    showlegend: false,
                    height: 480,
                    margin: { t: 24, r: 24, b: 44, l: 52 },
                    paper_bgcolor: surfaceColor,
                    plot_bgcolor: surfaceColor,
                    font: { ...base.layout.font, size: 14, color: tickColor },
                    xaxis: {
                        ...axisStyle,
                        tickformat: "%Y",
                        hoverformat: "%b %-d, %Y",
                        showspikes: true,
                        spikemode: "across",
                        spikesnap: "hovered data",
                        spikecolor: "#16385f",
                        spikethickness: 2,
                        spikedash: "solid",
                    },
                    yaxis: { ...axisStyle, rangemode: "tozero" },
                    hoverlabel: {
                        bgcolor: "#ffffff",
                        bordercolor: gridColor,
                        font: { family: "Inter, sans-serif", size: 14, color: "#16385f" },
                    },
                },
            },
        [base, hidden]
    );

    if (!fig) return null;

    const [title] = base.layout.title.text.split(" - ");

    function toggle(name) {
        setHidden(hidden.includes(name) ? hidden.filter((n) => n !== name) : [...hidden, name]);
    }

    return (
        <div className="trends-layout">
            <Figure fig={fig} />

            <div className="toggle-panel">
                <div className="toggle-panel-header">
                    <span className="toggle-panel-title">{title}</span>
                    <span className="toggle-panel-tag">Graph 1 - Lake Wilderness</span>
                </div>

                <div className="toggle-panel-body">
                {base.data.map((trace) => {
                    const isOn = !hidden.includes(trace.name);
                    return (
                        <button
                            key={trace.name}
                            type="button"
                            role="switch"
                            aria-checked={isOn}
                            className="toggle-row"
                            onClick={() => toggle(trace.name)}
                        >
                            <span className="toggle-text">
                                <span>{trace.name}</span>
                                <span className="toggle-description">{descriptions[trace.name]}</span>
                            </span>
                            <span className={`toggle-switch ${isOn ? "toggle-switch-on" : ""}`} />
                        </button>
                    );
                })}
                </div>
            </div>
        </div>
    );
}

function ActualVsPredicted() {
    const [results, setResults] = useState(null);

    useEffect(() => {
        loadChlorophyllForecasts().then(setResults);
    }, []);

    const base = useMemo(() => (results ? actualVsPredicted(results) : null), [results]);

    // Site styling on top of the notebook figure. The info panel replaces the title,
    // and the axis labels are left off.
    const fig = useMemo(
        () =>
            base && {
                data: base.data.map((trace) => ({
                    ...trace,
                    hovertemplate:
                        "Sampled %{customdata}<br>Actual %{x:.1f} µg/L<br>Predicted %{y:.1f} µg/L<extra></extra>",
                })),
                layout: {
                    ...base.layout,
                    title: undefined,
                    height: undefined,
                    autosize: true,
                    margin: { t: 24, r: 24, b: 44, l: 48 },
                    paper_bgcolor: surfaceColor,
                    plot_bgcolor: surfaceColor,
                    font: { ...base.layout.font, size: 14, color: tickColor },
                    xaxis: { ...axisStyle, rangemode: "tozero" },
                    yaxis: { ...axisStyle, rangemode: "tozero" },
                    hoverlabel: {
                        bgcolor: "#ffffff",
                        bordercolor: gridColor,
                        font: { family: "Inter, sans-serif", size: 14, color: "#16385f" },
                    },
                },
            },
        [base]
    );

    if (!fig) return null;

    const [, title] = base.layout.title.text.split(": ");

    return (
        <div className="info-layout">
            <div className="info-panel">
                <div className="toggle-panel-header info-panel-header">
                    <span className="toggle-panel-title">{title}</span>
                    <span className="toggle-panel-tag">Graph 2 - Lake Wilderness</span>
                </div>

                <div className="info-panel-body">
                    <h3>The Process</h3>
                    <p>
                        We trained a Random Forest Model on Lake Wilderness samples ranging from 1974 to 2017. 
                        We created this model to forecast algae (more algae = more harmful).  For every sample, it describes water clarity, temperature, nutrients, and chlorophyll-a levels (green pigment found in Algae). 
                        It then predicts the chlorophyll-a at the next sample (typically two weeks later). We tested the model with 92 new samples from 2017-2026 that it had never seen before.  
                    </p>

                    <h3>The Findings</h3>
                    <p>
                        Every dot is one test sample, and dots on the dashed line = perfect forecasts. 
                        On average the model is off by 2.35 µg/L. It can track normal conditions fairly well but can occasionally miss large blooms. 
                    </p>
                </div>
            </div>

            <Figure fig={fig} />
        </div>
    );
}

// Same five metrics, in the same order as the traces in their script.
const pulseMetrics = ["Temperature", "Water clarity (Secchi)", "Chlorophyll-a", "Total phosphorus", "Total nitrogen"];

function PulseWheel() {
    const frameRef = useRef(null);
    const [metric, setMetric] = useState(0);

    // Does what their dropdown buttons do (show one trace, hide the rest), minus the title change.
    function handleMetricChange(event) {
        const index = Number(event.target.value);
        setMetric(index);
        const win = frameRef.current?.contentWindow;
        const gd = win?.document.querySelector(".plotly-graph-div");
        if (win?.Plotly && gd) {
            win.Plotly.restyle(gd, { visible: pulseMetrics.map((_, i) => i === index) });
        }
    }

    // The figure itself is the notebook's own code, untouched. From outside, this only
    // sets the background to match the other cards and hides the title, the dropdown,
    // and the caption below (none deleted, just commented out, since the window is
    // still being adjusted). Re-enable any one of them by deleting its line below.
    //
    // The caption's own text, kept here since it's now hidden from view:
    // "How to read this: Move outward = more recent years • Around the circle = time
    // of year • Color = selected water-quality variable • Bubble size = chlorophyll-a"
    function handleLoad() {
        const win = frameRef.current?.contentWindow;
        const gd = win?.document.querySelector(".plotly-graph-div");
        if (win?.Plotly && gd) {
            win.Plotly.relayout(gd, {
                paper_bgcolor: surfaceColor,
                "title.text": "", // was "Lake Pulse Wheel" + its subtitle
                updatemenus: [], // their dropdown now lives in the right-hand box, see PulseWheel below
                annotations: [], // was the "How to read this" caption, see above
                // Shorter and a bit narrower canvas than their original 950x900.
                // Width only trimmed a little, so the wheel itself (bound by the
                // shorter height, not the width) doesn't actually shrink from this.
                width: 970,
                height: 700,
                "margin.t": 20,
                "margin.b": 20,
                "margin.l": 170, // room for the bar and its numbers, so 10s vs 100s never nudge the wheel
                "margin.r": 6,
                // Spokes (Jan-Jul, Year-> line) a bit thicker than their original
                // so they're easy to see, but the same light grey tone as the rings
                // (rings' own color, "rgba(80,80,80,0.18)", is untouched below)
                // The year labels (1971 to 2026) all pile up in a thin ring on the right side
                // and read as a black squiggle, so the numbers are hidden. Rings stay.
                "polar.radialaxis.showticklabels": false,
                // Their "Year →" label with a blank line above it, so it sits lower and off the axis line
                "polar.radialaxis.title.text": "<br>Year →",
                "polar.angularaxis.gridwidth": 1.5,
                "polar.angularaxis.gridcolor": "rgba(80,80,80,0.3)",
            });

            // Moves the colorbar from the right side of the wheel to the left, and
            // swaps each trace's title above the bar (their metric name, e.g.
            // "Temperature") for that metric's unit instead. Order matches the
            // metrics dict in their script, so each unit lines up with its trace.
            win.Plotly.restyle(gd, {
                // Pinned by its left edge to a fixed spot on the whole canvas, so wider numbers
                // (10s vs 100s) only grow to the right and never push the bar or the wheel.
                "marker.colorbar.xref": "container",
                "marker.colorbar.x": 0.042,
                "marker.colorbar.xanchor": "left",
                "marker.colorbar.thickness": 22, // up from their original 18
                "marker.colorbar.title.text": ["°C", "m", "µg/L", "µg/L", "µg/L"],
                // A slightly crisper white outline than their original 0.7px, so
                // overlapping bubbles stay easy to tell apart
                "marker.line.width": 1,
            });
        }
    }

    return (
        <div className="pulse-row">
            <div className="pulse-card">
                <iframe
                    ref={frameRef}
                    src="/data/Lake_Pulse_Wheel.html"
                    title="Lake Pulse Wheel"
                    className="pulse-frame"
                    scrolling="no"
                    onLoad={handleLoad}
                />
            </div>

            <div className="pulse-box">
                <div className="toggle-panel-header">
                    <span className="toggle-panel-title">Water Quality Metric Wheel</span>
                    <span className="toggle-panel-tag">Graph 3 - Lake Sawyer</span>
                </div>

                <div className="pulse-box-body">
                    <h3 className="pulse-inputs-title">Inputs</h3>
                    <p className="pulse-inputs-note">
                        Select your measured metric below (chlorophyll-a always represents the
                        size of the bubbles)
                    </p>

                    <select className="pulse-select" value={metric} onChange={handleMetricChange} aria-label="Water quality metric">
                        {pulseMetrics.map((name, i) => (
                            <option key={name} value={i}>{name}</option>
                        ))}
                    </select>

                    <h3 className="pulse-inputs-title pulse-section-title">Purpose</h3>
                    <p className="pulse-inputs-note">
                        This graph explores similar metrics to Lake Wilderness, but in a more
                        fun and unique graph format. The point of graphs is not to be boring,
                        but rather to be a fun, colorful, and creative way to visualize data.
                    </p>

                    <h3 className="pulse-inputs-title pulse-section-title">To Summarize Our Key Findings</h3>
                    <p className="pulse-inputs-note">
                        Temperature peaks in July and August and is coldest in winter. Warmer
                        water can create low-oxygen conditions that fuel algae blooms, so
                        year-round monitoring is essential.
                    </p>
                    <p className="pulse-inputs-note">
                        Other trends: the water is a lot clearer in the summer than in the
                        winter. Phosphorus has also dropped by about half since the 1970s,
                        which points to real ecological improvement, and water clarity has
                        improved since then too. Chlorophyll-a is highest in the fall and
                        winter.
                    </p>
                </div>
            </div>
        </div>
    );
}

function PhosphorusTurbidity() {
    const fig = useMemo(() => {
        // Same look as the other graphs: same axes, grid, colors and fonts. Static, no zoom or toolbar.
        const axis = { ...axisStyle, fixedrange: true };
        const unitNote = (text, position) => ({
            text,
            showarrow: false,
            xref: "paper",
            yref: "paper",
            font: { size: 12, color: tickColor },
            ...position,
        });

        return {
            data: [
                {
                    type: "scatter",
                    mode: "none",
                    x: phosphorusTurbidityData.band.x,
                    y: phosphorusTurbidityData.band.y,
                    fill: "toself",
                    fillcolor: "rgba(46, 160, 100, 0.28)", // green so the band does not blend into the blue dots
                    showlegend: false,
                    hoverinfo: "skip",
                },
                {
                    type: "scattergl",
                    mode: "markers",
                    x: phosphorusTurbidityData.x,
                    y: phosphorusTurbidityData.y,
                    marker: { color: "#636efa", opacity: 0.5, size: 6 },
                    showlegend: false,
                    hoverinfo: "skip",
                },
                {
                    type: "scatter",
                    mode: "lines",
                    x: phosphorusTurbidityData.line.x,
                    y: phosphorusTurbidityData.line.y,
                    line: { color: "#636efa", dash: "dash" },
                    showlegend: false,
                    hoverinfo: "skip",
                },
            ],
            config: { displayModeBar: false, scrollZoom: false },
            layout: {
                autosize: true,
                dragmode: false,
                margin: { t: 36, r: 52, b: 44, l: 56 },
                showlegend: false,
                paper_bgcolor: surfaceColor,
                plot_bgcolor: surfaceColor,
                font: { family: "Inter, sans-serif", size: 14, color: tickColor },
                // No axis titles, just the units at the ends: mg/L at the right end of the
                // x-axis, NTU at the top of the y-axis.
                annotations: [
                    unitNote("mg/L", { x: 1, y: 0, xanchor: "left", yanchor: "middle", xshift: 8 }),
                    unitNote("NTU", { x: 0, y: 1, xanchor: "right", yanchor: "bottom", yshift: 8 }),
                ],
                xaxis: axis,
                yaxis: axis,
            },
        };
    }, []);

    return (
        <div className="info-layout">
            <div className="info-panel">
                <div className="toggle-panel-header info-panel-header">
                    <span className="toggle-panel-title">Phosphorus vs. Turbidity</span>
                    <span className="toggle-panel-tag">Graph 4 - Bear Creek and Ames Creek</span>
                </div>

                <div className="info-panel-body">
                    <h3>Process</h3>
                    <p>
                        This graph is a scatter plot of phosphorus and turbidity from 5
                        regions: Bear Creek downstream of Redmond Way, NE 95th Street, and NE
                        133rd Street, and upstream of the mouth, as well as Ames Creek. To
                        create this, we used Plotly to process the data, merged the dataframe
                        with matching locations, and created a trendline.
                    </p>

                    <h3>Findings</h3>
                    <p>
                        This trendline shows a strong, positive correlation between phosphorus
                        and turbidity. Environmentally, this occurs because phosphorus has a
                        high chemical affinity to dust sediments. This is why it's important
                        to reduce agricultural runoff from harmful chemicals.
                    </p>
                </div>
            </div>

            <Figure fig={fig} />
        </div>
    );
}

// Same colors and pH ranges as the map
const phKey = [
    {
        name: "Acidic (below 6.5)",
        color: "#EF553B",
        description: "More acidic than healthy water should be. This can stress fish and other aquatic life.",
    },
    {
        name: "Normal (6.5 to 8.5)",
        color: "#636efa",
        description: "The healthy range for lakes and streams. Most samples fall here.",
    },
    {
        name: "Alkaline (above 8.5)",
        color: "#00cc96",
        description: "More basic than usual. This is often linked to heavy algae growth.",
    },
];

function OurResearch() {
    return (
        <main>
            <section className="banner banner-sm">
                <div className="banner-box">
                    <h1>Our Research and Findings</h1>

                    <p>
                        Explore some of the interactive maps, graphs, and tables we composed
                        using dataframes, pandas, and matplotlib to study Washington's
                        water quality data.
                    </p>
                </div>
            </section>

            <section className="content-section content-section-wide research-section">
                <div className="graph-band">
                    <LakeWildernessTrends />
                </div>

                <div className="graph-band">
                    <ActualVsPredicted />
                </div>

                <div className="graph-band">
                    <PulseWheel />
                </div>

                <div className="graph-band">
                    <PhosphorusTurbidity />
                </div>

                <div className="graph-band">
                <div className="map-layout">
                    <iframe src="/data/pH_Map.html?v=3" title="pH map" className="map-frame" />

                    <div className="toggle-panel">
                        <div className="toggle-panel-header">
                            <span className="toggle-panel-title">Interactive Map</span>
                            <span className="toggle-panel-tag">Additional Resource</span>
                        </div>

                        <div className="toggle-panel-body">
                            <p className="map-note">
                                Use the key below to find your local lake in Puget Sound and
                                learn about its acidity.
                            </p>

                            {phKey.map((item) => (
                                <div key={item.name} className="key-row">
                                    <span className="key-dot" style={{ background: item.color }} />
                                    <span className="toggle-text">
                                        <span>{item.name}</span>
                                        <span className="toggle-description">{item.description}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                </div>
            </section>
        </main>
    );
}

export default OurResearch;
