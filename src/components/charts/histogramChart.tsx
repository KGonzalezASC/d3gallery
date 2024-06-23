import { useRef, useEffect, useState, FC } from 'react';
import * as d3 from 'd3';
import {Temtem} from "@/lib/temtem.ts";
import {Bin} from "d3";

interface HistogramChartProps {
    data: Temtem[]
}

export const HistogramChart: FC<HistogramChartProps> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [currentStat, setCurrentStat] = useState<keyof Temtem>('sta');
    const w = 620;
    const h = 500;

    const statsOptions = ['sta', 'hp', 'spd', 'atk', 'def', 'spatk', 'spdef'];
    const desaturatedColorScale = [
        "#CD5C5C", // Desaturated Orange-Red
        "#DAA520", // Desaturated Dark Orange
        "#D2B48C", // Desaturated Gold
        "#ADD8E6", // Desaturated Blue
        "#B0C4DE", // Desaturated Steel Blue
        "#98FB98", // Desaturated Green-Yellow
        "#4adc4a"  // Desaturated Green
        // Add more values as needed to create a smooth gradient
    ];

    const getColor = (value: number) => {
        if (value <= 49) {
            return desaturatedColorScale[0];
        } else if (value <= 50) {
            return desaturatedColorScale[1];
        } else if (value <= 70) {
            return desaturatedColorScale[2];
        } else if (value <= 80) {
            return desaturatedColorScale[3];
        } else if (value <= 90) {
            return desaturatedColorScale[4];
        } else if (value <= 100) {
            return desaturatedColorScale[5];
        } else {
            return desaturatedColorScale[6];
        }
    };



    useEffect(() => {
        if (!svgRef.current || !data) return;

        const svg = d3.select(svgRef.current)
            .attr("width", "88%")
            .attr("height", h)
            .style("overflow", "visible")
            .attr("viewBox", `0 0 ${w} ${h}`)
            .style("background", "#c5f6fa");

        const min = d3.min(data, d => +d[currentStat as keyof Temtem]!);
        const max = d3.max(data, d => +d[currentStat as keyof Temtem]!);


        svg.selectAll("*").remove(); // Clear previous content

        // Append axis y label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 16.5)
            .attr("x", 0 - (h / 2))
            .style("text-anchor", "middle")
            .style("font-size", "1.5rem")
            .text("Frequency");

        const histogram = d3.histogram<Temtem, number>()
            .value(d => +d[currentStat as keyof Temtem]!)
            .domain([min!, max!])
            .thresholds(d3.thresholdSturges(data.map(d => +d[currentStat as keyof Temtem]!) as number[]));

        const bins = histogram(data);

        const x = d3.scaleBand()
            .domain(bins.map(d => `${d.x0}-${d.x1}`))
            .range([30, w - 50])
            .paddingInner(.05);

        const maxBin = d3.max(bins, d => d.length);
        const y = d3.scaleLinear()
            .domain([0, maxBin!])
            .range([h-50, 50]);

        const colorScale = d3.scaleOrdinal<string, string>()
            .domain(bins.map(d => `${d.x0}-${d.x1}`))
            .range(bins.map(d => getColor(typeof d.x0 === "number" ? d.x0 : 0)));

        const xAxis = d3.axisBottom(x);
        const yAxis = d3.axisLeft(y);

        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(20, ${h-50})`)
            .call(xAxis);

        svg.append('g')
            .attr('class', 'axis-left1')
            .attr('transform', `translate(50, 0)`)
            .call(yAxis);

        const addDashedBorder = () => {
            svg.selectAll(".dashed-border").remove(); // Remove previous dashed borders

            svg.selectAll(".hist-bar")
                .each(function() {
                    const rect = d3.select(this);
                    const rectX = +rect.attr("x");
                    const rectY = +rect.attr("y");
                    const rectWidth = +rect.attr("width");
                    const rectHeight = +rect.attr("height");

                    svg.append("rect")
                        .attr("class", "dashed-border")
                        .attr("x", rectX)
                        .attr("y", rectY)
                        .attr("width", rectWidth)
                        .attr("height", rectHeight)
                        .attr("fill", "none")
                        .attr("stroke", "black")
                        .attr("stroke-width", 3)
                        .attr("stroke-dasharray", "3 3"); // Dotted line
                });
        };

        svg.selectAll<SVGRectElement, Bin<Temtem, number>>(".hist-bar") // Specify element type as SVGRectElement
            .data(bins)
            .join<SVGRectElement>(
                enter => enter.append('rect')
                    .attr("class", "hist-bar")
                    .attr("x", (d: Bin<Temtem, number>) => x(`${d.x0}-${d.x1}`)! + 35)
                    .attr("y", h - 50)
                    .attr("width", x.bandwidth() - 30)
                    .attr("height", 0)
                    .attr("fill", () => colorScale("0"))
                    .transition()
                    .duration(1200)
                    .attr("y", d => y(d.length))
                    .attr("fill", d => colorScale(String(d.x0 || 0)))
                    .attr("height", d => h -50- y(d.length))
                    .on("end", addDashedBorder),
                exit => exit
                    .transition().duration(800)
                    .remove()
            );

    }, [data, currentStat]);

    return (
        <>
            <div className={'button-container mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700'}>
                <label htmlFor="stat-select">Choose a stat: </label>
                <select
                    id="stat-select"
                    value={currentStat}
                    onChange={e => setCurrentStat(e.target.value as keyof Temtem)}                >
                    {statsOptions.map(option => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>
            <svg ref={svgRef} style={{ margin: "2rem" }}></svg>
        </>
    );
};
