import React, { useRef, useEffect, FC } from 'react';
import * as d3 from 'd3';

interface LineChartProps {
    data: number[];
}

const LineChartBTC: FC<LineChartProps> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const w = 510;
    const h = 490;

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current)
            .attr("width", "88%")
            .attr("height", h)
            .style("overflow", "visible")
            .attr("viewBox", `0 0 ${w} ${h}`)
            .style("background", "#c5f6fa");

        // Scales
        const xScale = d3.scaleLinear()
            .domain([0, data.length - 1])
            .range([30, w-30]);

        // Use a logarithmic scale for the y-axis to better fit the range of cryptocurrency prices
        const yScale = d3.scaleLog()
            .domain([d3.min(data) , d3.max(data)])
            .range([h, 0]);

        // Axes
        const xAxis = d3.axisBottom(xScale)
            .ticks(data.length)
            .tickFormat((d, i) => (i + 1).toString());

        const yAxis = d3.axisLeft(yScale);

        // Line
        svg.selectAll(".line").remove();
        svg.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line<number>()
                .x((d, i) => xScale(i))
                .y(d => yScale(d))
                .curve(d3.curveBasis));

        // Draw axes
        svg.select(".x-axis").remove();
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${h})`)
            .call(xAxis);

        svg.select(".y-axis").remove();
        svg.append("g")
            .attr("transform", `translate(30,${0})`)
            .attr("class", "y-axis")
            .call(yAxis);

        // Draw circles
        svg.selectAll<SVGCircleElement, number>(".circle")
            .data(data, (d, i) => i.toString())
            .join<SVGCircleElement>(
                (enter) => enter.append("circle")
                    .attr("class", "circle")
                    .attr("cx", (d, i) => xScale(i))
                    .attr("cy", h)
                    .attr("r", 5)
                    .style("fill", "red")
                    .transition()
                    .duration(400)
                    .delay((d, i) => i * 50)
                    .attr("cy", d => yScale(d))
                    .attr("cx", (d, i) => xScale(i)),
                (update) => update.transition()
                    .duration(1000)
                    .attr("cy", d => yScale(d))
                    .attr("cx", (d, i) => xScale(i))
                    .style("fill", "orange"),
                (exit) => exit.transition()
                    .duration(600)
                    .attr("cy", h)
                    .remove()
            );

    }, [data]);

    if (!data) {
        return (
            <>
                <LoadingSpinner />
                <p>Loading...</p>
            </>
        );
    }

    return (
        <>
            <svg ref={svgRef}></svg>
            <button
                className="px-4 py-1 mt-6 bg-blue-500 text-white text-xs rounded hover:bg-blue-700  md:w-auto"
                onClick={() => console.log('Button clicked')}>
                Click me
            </button>
        </>
    );
};

export default LineChartBTC;
