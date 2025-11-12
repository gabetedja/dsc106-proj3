import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const margin = { top: 20, right: 30, bottom: 50, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");

const data = await d3.csv("data/tas_vs_lat_2010.csv", d => ({
  month: +d.month,
  lat: +d.lat,
  tas: +d.tas
}));

const months = [...new Set(data.map(d => d.month))];

const dropdown = d3.select("#month");
dropdown.selectAll("option")
  .data(months)
  .join("option")
  .attr("value", d => d)
  .text(d => new Date(2000, d - 1).toLocaleString('default', { month: 'long' }));

dropdown.on("change", () => draw(+dropdown.node().value));

const xScale = d3.scaleLinear().domain([-90, 90]).range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);

const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

svg.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0,${height})`)
  .call(xAxis)
  .append("text")
  .attr("x", width / 2)
  .attr("y", 40)
  .attr("fill", "black")
  .attr("text-anchor", "middle")
  .text("Latitude");

svg.append("g")
  .attr("class", "y-axis")
  .call(yAxis)
  .append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", -40)
  .attr("fill", "black")
  .attr("text-anchor", "middle")
  .text("Surface Temperature (°C)");

function draw(month) {
  const monthData = data.filter(d => d.month === month);

  yScale.domain(d3.extent(monthData, d => d.tas)).nice();
  svg.select(".y-axis").transition().duration(500).call(yAxis);

  const line = d3.line()
    .x(d => xScale(d.lat))
    .y(d => yScale(d.tas));

  svg.selectAll(".line").data([monthData])
    .join("path")
    .attr("class", "line")
    .transition()
    .duration(500)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

  const circles = svg.selectAll("circle").data(monthData, d => d.lat);

  circles.join(
    enter => enter.append("circle")
      .attr("cx", d => xScale(d.lat))
      .attr("cy", d => yScale(d.tas))
      .attr("r", 4)
      .attr("fill", "orange")
      .on("mouseenter", (event, d) => {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY}px`)
          .html(`Lat: ${d.lat}°<br>Temp: ${d.tas.toFixed(2)}°C`)
          .attr("hidden", null);
      })
      .on("mouseleave", () => tooltip.attr("hidden", true)),
    update => update
      .transition()
      .duration(500)
      .attr("cx", d => xScale(d.lat))
      .attr("cy", d => yScale(d.tas)),
    exit => exit.remove()
  );
}

draw(months[0]);