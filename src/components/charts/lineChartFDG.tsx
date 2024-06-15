import { FC, useEffect, useRef } from "react";
import * as d3 from 'd3';

interface Node {
    id: number;
    name: string;
    maxWeeklyRevenue?: number;
    monthlyViewData?: { date: string; views: number }[];
    totalViews?: number;
}

interface LineChartFDGProps {
    data: Node[]; // Data received as an array of selected nodes
}

export const LineChartFDG: FC<LineChartFDGProps> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const width = 340;
    const height = 340;

    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current)
            .attr("width", "88%")
            .attr("height", height)
            .style("overflow", "visible")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .style("background", "#c5f6fa");

        // Clear previous elements
        svg.selectAll("*").remove();

        // Flatten all monthly view data
        const allMonthlyViewData = data.flatMap(node => node.monthlyViewData || []);

        // Get max and min values for views
        const maxTotalViews = d3.max(allMonthlyViewData, d => d.views) || 0;
        const minTotalViews = d3.min(allMonthlyViewData, d => d.views) || 0;

        // Y scale
        const yScale = d3.scaleLinear()
            .domain([minTotalViews, maxTotalViews])
            .range([height, 50]);

        // X scale by date
        const xScale = d3.scaleTime()
            .domain(d3.extent(allMonthlyViewData, d => new Date(d.date)) as [Date, Date])
            .range([50, width]);

        // Append Y axis
        svg.append("g")
            .attr("transform", `translate(${50}, -50)`)
            .call(d3.axisLeft(yScale));

        // Append X axis
        svg.append("g")
            .attr("transform", `translate(0, ${height - 50})`)
            .call(d3.axisBottom<Date>(xScale)
                .ticks(d3.timeMonth.every(2))
                .tickFormat((date: Date) => d3.timeFormat('%b %Y')(date)))
            .selectAll('text')
            .style('text-anchor', 'start')
            .attr('transform', 'rotate(90)')
            .attr('x', 10)
            .attr('y', -5);


        // Line generator
        const line = d3.line<{ date: string; views: number }>()
            .x(d => xScale(new Date(d.date)))
            .y(d => yScale(d.views) - 50)
            .curve(d3.curveMonotoneX);

        // Draw lines for each node's monthly view data
        data.forEach(node => {
            if (node.monthlyViewData) {
                svg.append("path")
                    .datum(node.monthlyViewData)
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 1.5)
                    .attr("d", line);
            }
        });

    }, [data]);

    return (
        <svg ref={svgRef} style={{ margin: "1rem" }} width={width} height={height}></svg>
    );
};
