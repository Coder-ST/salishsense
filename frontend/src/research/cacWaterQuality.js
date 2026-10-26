// JavaScript version of research/cac_water_quality.py (data prep + Plotly line charts).
// Same steps, same order, same names as the Python script.

import plotlyTemplate from "./plotlyTemplate.json";

const FILE = "/data/WQReport_Wilderness_1971_to_2026.csv";


// ------------------------------------------------------------
// Small helpers that stand in for pandas
// ------------------------------------------------------------

// pd.read_csv(FILE, skiprows=2, encoding="cp1252")
function readCsv(buffer, skiprows) {
  const text = new TextDecoder("windows-1252").decode(buffer);
  const lines = text.split(/\r?\n/).filter((line) => line !== "").slice(skiprows);
  const columns = lines[0].split(",").map((name, i) => name || `Unnamed: ${i}`);

  const rows = lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row = {};
    columns.forEach((column, i) => {
      const cell = cells[i] === undefined ? "" : cells[i];
      if (cell.trim() === "") row[column] = null;
      else if (!Number.isNaN(Number(cell))) row[column] = Number(cell);
      else row[column] = cell;
    });
    return row;
  });

  return { columns, rows };
}

// pd.to_datetime for "MM/DD/YYYY"
function toDatetime(value) {
  const [month, day, year] = value.split("/").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

// df[column].shift(n)
function shift(rows, column, n) {
  return rows.map((_, i) => {
    const source = rows[i - n];
    return source === undefined ? null : source[column];
  });
}

function assign(rows, column, values) {
  rows.forEach((row, i) => {
    row[column] = values[i];
  });
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;


// ------------------------------------------------------------
// 1. LOAD DATA
// ------------------------------------------------------------

export async function loadLakeWilderness() {
  const response = await fetch(FILE);

  // The file has two metadata rows before the actual header.
  let { columns, rows: df } = readCsv(await response.arrayBuffer(), 2);

  // Remove completely empty columns
  columns = columns.filter((column) => df.some((row) => row[column] !== null));
  df = df.map((row) => Object.fromEntries(columns.map((column) => [column, row[column]])));

  // Convert date
  df.forEach((row) => {
    row["Date"] = toDatetime(row["Date"]);
  });

  // Sort chronologically
  df.sort((a, b) => a["Date"] - b["Date"]);


  // ------------------------------------------------------------
  // 2. KEEP ONLY OBSERVATIONS WITH CHLOROPHYLL-A
  // ------------------------------------------------------------

  df = df.filter((row) => row["Chlor-a (µg/L)"] !== null);

  df.sort((a, b) => a["Date"] - b["Date"]);


  // ------------------------------------------------------------
  // 3. CREATE THE FORECAST TARGET
  //
  // Target = chlorophyll-a at the NEXT sampling event
  // ------------------------------------------------------------

  assign(df, "Next_Chlor_a", shift(df, "Chlor-a (µg/L)", -1));

  assign(df, "Next_Date", shift(df, "Date", -1));

  df.forEach((row) => {
    row["Days_To_Next_Sample"] =
      row["Next_Date"] === null
        ? null
        : Math.floor((row["Next_Date"] - row["Date"]) / MS_PER_DAY);
  });


  // ------------------------------------------------------------
  // 4. REMOVE VERY LONG GAPS
  //
  // 30 days is a reasonable initial cutoff for this dataset.
  // ------------------------------------------------------------

  const MAX_FORECAST_GAP = 30;

  df = df.filter(
    (row) =>
      row["Days_To_Next_Sample"] !== null &&
      row["Days_To_Next_Sample"] <= MAX_FORECAST_GAP &&
      row["Next_Chlor_a"] !== null
  );

  return df;
}


// ------------------------------------------------------------
// PLOTLY CHARTS
//
// plotly.express builds on plotly.js, so these produce the same
// figures that px.line gives in the notebook.
// ------------------------------------------------------------

const colorway = ["#636efa", "#EF553B", "#00cc96"];

// Same font as the rest of the site
const font = { family: "Inter, sans-serif" };

function dates(df) {
  return df.map((row) => row["Date"].toISOString().slice(0, 19));
}

// Interactive line plot for Total Phosphorus, Secchi depth and Temperature
export function waterQualityMetrics(df) {
  const y = ["TP (µg/L)", "Secchi (m)", "Temp (°C)"];

  // Only chart samples from 2010 onward so the peaks are not squeezed together
  const START = new Date(Date.UTC(2010, 0, 1));
  df = df.filter((row) => row["Date"] >= START);

  return {
    data: y.map((column, i) => ({
      type: "scattergl",
      mode: "lines",
      name: column,
      legendgroup: column,
      x: dates(df),
      y: df.map((row) => row[column]),
      line: { color: colorway[i], dash: "solid" },
      marker: { symbol: "circle" },
      showlegend: true,
      hovertemplate: `Parameter=${column}<br>Date=%{x}<br>Measurement Value=%{y}<extra></extra>`,
    })),
    layout: {
      template: plotlyTemplate,
      font,
      title: { text: "Water Quality Metrics In Time - Lake Wilderness" },
      xaxis: { title: { text: "Date" } },
      yaxis: { title: { text: "Measurement Value" } },
      legend: { title: { text: "Parameters" }, tracegroupgap: 0 },
      hovermode: "x unified",
      height: 550,
    },
  };
}


// ------------------------------------------------------------
// 15. RESULTS TABLE
//
// The Random Forest (steps 7 to 14) runs in the Python script.
// This reads the results table it saves in step 21, one row per
// test sample with Next_Chlor_a and Predicted_Chlor_a.
// ------------------------------------------------------------

const FORECASTS = "/data/Lake_Wilderness_Chlorophyll_Forecasts.csv";

export async function loadChlorophyllForecasts() {
  const response = await fetch(FORECASTS);

  const { rows: results } = readCsv(await response.arrayBuffer(), 0);

  return results;
}

//Actual versus predicted plot for the Random Foret model 
export function actualVsPredicted(results) {
  const y_test = results.map((row) => row["Next_Chlor_a"]);
  const predictions = results.map((row) => row["Predicted_Chlor_a"]);

  // Perfect prediction line
  const minimum = Math.min(...y_test, ...predictions);
  const maximum = Math.max(...y_test, ...predictions);

  return {
    data: [
      // plt.scatter(y_test, predictions, alpha=0.7)
      {
        type: "scatter",
        mode: "markers",
        name: "Predictions",
        x: y_test,
        y: predictions,
        customdata: results.map((row) => row["Next_Date"]),
        marker: { color: colorway[0], opacity: 0.7, size: 9 },
        hovertemplate: "Actual=%{x}<br>Predicted=%{y}<extra></extra>",
      },
      // plt.plot([minimum, maximum], [minimum, maximum], linestyle="--")
      {
        type: "scatter",
        mode: "lines",
        name: "Perfect prediction line",
        x: [minimum, maximum],
        y: [minimum, maximum],
        line: { color: colorway[0], dash: "dash" },
        hoverinfo: "skip",
      },
    ],
    layout: {
      template: plotlyTemplate,
      font,
      title: { text: "Random Forest: Actual vs Predicted Chlorophyll-a" },
      xaxis: { title: { text: "Actual Next Chlorophyll-a (µg/L)" } },
      yaxis: { title: { text: "Predicted Next Chlorophyll-a (µg/L)" } },
      showlegend: false,
    },
  };
}
