import { useRef, useEffect, useState, FC } from 'react';
import * as d3 from 'd3';
import legend, {LegendColor} from 'd3-svg-legend';
import {Temtem, types} from "@/lib/temtem.ts";


interface BarChartProps {
    data: Temtem[]
}

const tiers = ["S", "A", "B+", "B", "B-", "C", "D"];

export const BarChart: FC<BarChartProps> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [currentType, setCurrentType] = useState('Neutral');

    const w = 620;
    const h = 500;


    useEffect(() => {
        if (!svgRef.current || !data) return;

        const svg = d3.select(svgRef.current)
            .attr("width", "88%")
            .attr("height", h)
            .style("overflow", "visible")
            .attr("viewBox", `0 0 ${w} ${h}`)
            .style("background", "#c5f6fa");

        svg.selectAll("*").remove();

        // Add axis labels
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 50)
            .attr("x", 145 - (h / 2))
            .style("text-anchor", "middle")
            .style("font-size", "1.3rem")
            .text("Weakness Count");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 50)
            .attr("x", 125 - h)
            .style("text-anchor", "middle")
            .style("font-size", "1.3rem")
            .text("Resisted Types Count");

        // Filter data based on currentType
        const filteredData = data.filter(d => d.TYPE1 === currentType || d.TYPE2 === currentType);

        // Sort by weaknessCount
        filteredData.sort((a, b) => b.weaknessCount - a.weaknessCount);

        // Scales
        const x = d3.scaleBand()
            .domain(filteredData.map(d => d.name))
            .range([40, w - 80])
            .paddingInner(.05)
            .align(1);

        const yWeakness = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.weaknessCount) || 0])
            .range([h / 2, 50]);

        const yResistance = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.resistanceCount) || 0])
            .range([h / 2, h - 50]);

        const colorScale = d3.scaleOrdinal()
            .domain(tiers)
            .range(d3.schemeAccent);

        // Axes
        const xAxis = d3.axisBottom(x);
        const yAxisWeakness = d3.axisLeft(yWeakness);
        const yAxisResistance = d3.axisLeft(yResistance);


        svg.append("g")
            .attr("transform", "translate(90, 0)")
            .call(yAxisWeakness);

        svg.append("g")
            .attr("transform", `translate(${90}, 0)`)
            .call(yAxisResistance);

        // Bars for weakness count
        svg.selectAll(".weakness-bar")
            .data(filteredData)
            .join(
                enter => {
                    const rects = enter.append("rect")
                        .attr("class", "weakness-bar")
                        .attr("fill-opacity", 0.5)
                        .attr("x", d =>  x(d.name)! + 57.5)
                        .attr("y", h / 2) // Start at the middle
                        .attr("width", x.bandwidth() / 3)
                        .attr("height", 0) // Start with height 0
                        .attr("fill", d => colorScale(d.tier) as string);

                    rects.transition()
                        .duration(500)
                        .attr("y", d => yWeakness(d.weaknessCount)) // Animate to the correct y position
                        .attr("height", d => h / 2 - yWeakness(d.weaknessCount)); // Animate to the correct height

                    return rects;
                },
                exit => exit.transition().remove()
            );


        // Bars for resistance count
        svg.selectAll(".resistance-bar")
            .data(filteredData)
            .join(
                enter => enter.append("rect")
                    .attr("class", "resistance-bar")
                    .attr("fill-opacity", 0.5)
                    .attr("x", d => x(d.name)! + 47.5 + x.bandwidth() / 2)
                    .attr("y", h / 2) // Start at the middle
                    .attr("width", x.bandwidth() / 3)
                    .attr("height", 0) // Start with height 0
                    .attr("fill", d => colorScale(d.tier) as string)
                    .call(enter => enter.transition()
                        .duration(500)
                        .attr("height", d => yResistance(d.resistanceCount) - h / 2) // Animate to the correct height
                        .attr("y", h / 2)), // Animate to the correct y position
                update => update,
                exit => exit.remove()
            );


        svg.append("g")
            .attr("transform", `translate(50, ${h / 2})`)
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        //legend
        const legendOrdinal = legend.legendColor() as LegendColor; // Cast to the expected type
        legendOrdinal.shape("path", d3.symbol().type(d3.symbolSquare).size(150)() as string);
        legendOrdinal.shapePadding(10);
        legendOrdinal.labelOffset(10);
        legendOrdinal.orient("horizontal");
        legendOrdinal.scale(colorScale);

        svg.append("g")
            .attr("fill-opacity", 0.5)
            .attr("transform", `translate(${(w /2)-200}, 20)`)
            .call(legendOrdinal as unknown as (selection: d3.Selection<SVGGElement, unknown, null, undefined>) => void);

    }, [data, currentType]);

    return (
        <>
            <div className='button-container mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700'>
                <label htmlFor="type-select">Choose a type: </label>
                <select
                    id="type-select"
                    value={currentType}
                    onChange={e => setCurrentType(e.target.value)}
                >
                    {types.map(type => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
            </div>
            <svg ref={svgRef} style={{ margin: "2rem" }}></svg>
        </>
    );
}
