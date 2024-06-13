import { useRef, useEffect, useState, FC } from 'react';
import * as d3 from 'd3';
import legend from 'd3-svg-legend';


export const ScatterplotQRChart: FC = ({ data }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const w = 620;
    const h = 500;
    const tiers = ["S", "A", "B+", "B", "B-", "C", "D"];

    //drawing a box around the quartile of each tier too show the distribution of the data
    //and to better group the data points that are jittered for clarity

    const quartiles = tiers.map(t => {
        //suposed to sort by total but lets try tis for nw if not check observable
        const tierData = data.filter(d => d.tier === t).map(d => d.total);
        const q1 = d3.quantile(tierData, .25);
        const q2 = d3.quantile(tierData, .5);
        const q3 = d3.quantile(tierData, .75);
        return { tier: t, q1, q2, q3 };
    });

    const svg = d3.select(svgRef.current)
        .attr("width", "88%")
        .attr("height", h)
        .style("overflow", "visible")
        .attr("viewBox", `0 0 ${w} ${h}`)
        .style("background", "#c5f6fa");


    useEffect(() => {
        if (!svgRef.current) return;

        svg.selectAll("*").remove();

        const x = d3.scaleBand()
            .domain(tiers) // All tiers
            .range([30, w-80])
            .padding(.01);

        const y = d3.scaleLinear()
            .domain([400, d3.max(data, d => d.total)])
            .range([h-60, 60]);

        const colorScale = d3.scaleOrdinal()
            .domain(tiers)
            .range(d3.schemeAccent);

        const xAxis = d3.axisBottom(x);
        const yAxis = d3.axisLeft(y);

        svg.append("g")
            .attr("transform", `translate(50, ${h-60})`)
            .call(xAxis);

        svg.append("g")
            .attr("transform", `translate(80, ${0})`)
            .call(yAxis);

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 35) //since they are "rotated treat as x"
            .attr("x", 10 - (h / 2))
            .style("text-anchor", "middle")
            .style("font-size", "1.5rem")
            .text("Base Stat Total");
        svg.append("text")
            .attr("transform", `translate(${(w / 2)}, ${h-15})`)
            .style("text-anchor", "middle")
            .style("font-size", "1.5rem")
            .text("Tier");


        svg.selectAll("circle")
            .data(data)
            .join(
                enter=> enter.append("circle")
                    .attr("cx", d => x(d.tier) +
                        (x.bandwidth() / 2)+45+(x.bandwidth()/3.5))
                    .attr("cy", d => h-60)
                    .attr("r", 5.4)
                    .transition()
                    .duration(800)
                    .attr("fill", d => colorScale(d.tier))
                    .attr("cx", d => x(d.tier) +
                        (x.bandwidth() / 2)+45+(x.bandwidth()/3.5))
                    .attr("cy", d => y(d.total))
                    .transition()
                    .duration(650)
                    .attr("fill-opacity", 0.75)

                    .attr("cx", d => x(d.tier) +
                        (x.bandwidth() / 2)+47+(x.bandwidth()/3.5 * jitter())),


            );
            //drawing the quartile boxes //again double check later
            //locks fine for nw?
            quartiles.forEach(q => {
                if (q.q1 && q.q3) { //fixed NaN warning
                    svg.append("rect")
                        .attr("x", x(q.tier) + 70)
                        .attr("y", y(q.q3))
                        .attr("width", x.bandwidth() / 2)
                        .transition()
                        .duration(800)
                        .attr("width", x.bandwidth() / 2)
                        .attr("height", y(q.q1) - y(q.q3))
                        .attr("fill", "none")
                        .attr("stroke", colorScale(q.tier)) // Fixing the color scale reference
                        .attr("stroke-width", 1);
                }
        })

        //legend
        const legendOrdinal = legend.legendColor()
            .scale(colorScale)
            .shape("path", d3.symbol().type(d3.symbolSquare).size(150)())
            .shapePadding(10)
            .labelOffset(10)
            .orient("horizontal");

        svg.append("g")
            .attr("fill-opacity", 0.5)
            .attr("transform", `translate(${(w /2)-200}, 20)`)
            .call(legendOrdinal);
    }, [data]);

    return (
        <svg ref={svgRef} style={{ margin: "2rem" }}></svg>
    );
}

const jitter=()=> {
    return Math.random() - .5;
}

