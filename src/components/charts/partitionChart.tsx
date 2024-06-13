import React, { FC, useEffect, useRef } from "react";
import * as d3 from 'd3';

// Define the type for the data prop
interface FinancialSheetChild {
    name: string;
    value?: number;
    children?: FinancialSheetChild[];
}

interface FinancialSheet {
    name: string;
    children: FinancialSheetChild[];
}

interface FinancialNode extends d3.HierarchyRectangularNode<FinancialSheetChild> {
    y0: number;
    y1: number;
    x0: number;
    x1: number;
}

// Define the props interface
interface PartitionChartProps {
    data: FinancialSheet;
}

export const PartitionChart: FC<PartitionChartProps> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    const width = 620;
    const height = 600;
    const maxScale = 1.2;

    useEffect(() => {
        if (!svgRef.current || !data) return; // Ensure data is loaded

        const svg = d3.select(svgRef.current)
            .attr("width", "88%")
            .attr("height", height)
            .style("overflow", "visible")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .style("background", "#c5f6fa");

        // Clear any existing content
        svg.selectAll("*").remove();

        console.log(data);

        const root = d3.hierarchy<FinancialSheetChild>(data)
            .sum(d => d.value || 0)
            .sort((a, b) => (b.value || 0) - (a.value || 0));

        const makePartitions = d3.partition<FinancialSheetChild>()
            .size([height - 50, width - 50])
            .padding(1)
            .round(true);

        const color = d3.scaleOrdinal(d3.schemeSet2);

        makePartitions(root);

        // Create a group to contain the chart
        const chartGroup = svg.append("g");

        // Render groups containing partition and text
        const groups = chartGroup.selectAll<SVGGElement, FinancialNode>("g")
            .data(root.descendants())
            .join(
                enter => {
                    const g = enter.append("g")
                        .attr("transform", d => `translate(${d.y0 + 25},${d.x0 + 25})`)
                        .on("mouseover", function (event, d) {
                            d3.select(this).raise(); // Bring the group to the front
                            const rect = d3.select(this).select<SVGRectElement>("rect");
                            const text = d3.select(this).select<SVGTextElement>("text");
                            rect.transition()
                                .duration(200)
                                .attr("x", -5)
                                .attr("y", -5)
                                .attr("width", d => (d.y1 - d.y0) + 10)
                                .attr("height", d => (d.x1 - d.x0) + 10);
                            text.transition()
                                .duration(200)
                                .style("font-size", "14px"); // Increase font size on hover
                        })
                        .on("mouseout", function (event, d) {
                            const rect = d3.select(this).select<SVGRectElement>("rect");
                            const text = d3.select(this).select<SVGTextElement>("text");
                            rect.transition()
                                .duration(200)
                                .attr("x", 0)
                                .attr("y", 0)
                                .attr("width", d => d.y1 - d.y0)
                                .attr("height", d => d.x1 - d.x0);
                            text.transition()
                                .duration(200)
                                .style("font-size", d => {
                                    // Use the stored initial font size
                                    return (d.data as any)._initialFontSize;
                                });
                        });
                    return g;
                },
                update => update,
                exit => exit.remove()
            );

        // Render rectangles within groups
        groups.append("rect")
            .classed("partition-area", true)
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", d => d.y1 - d.y0)
            .attr("height", d => d.x1 - d.x0)
            .style('fill', d => color(d.depth));

        // Render text labels within groups
        groups.append("text")
            .attr("x", d => (d.y1 - d.y0) / 2) // Center text horizontally
            .attr("y", d => 1 + (d.x1 - d.x0) / 2) // Center text vertically
            .attr("fill", "black")
            .text(d => d.data.name)
            .style("font-size", d => {
                // Calculate font size based on both width and height of the partition
                const width = d.y1 - d.y0;
                const height = d.x1 - d.x0;
                const partitionArea = width * height;
                const fontSize = Math.min(11, partitionArea / 200); // Adjust the divisor as needed
                // Store the initial font size in the data
                (d.data as any)._initialFontSize = `${fontSize}px`;
                return fontSize;
            })
            .attr("text-anchor", "middle");

        // Implement zoom behavior
        const zoom = d3.zoom<SVGSVGElement, any>()
            .scaleExtent([1, maxScale])
            .on("zoom", (event) => {
                // Apply the transform
                const transform = event.transform.k === 1
                    ? `translate(0,0) scale(1)`
                    : `translate(-60,-60) scale(${event.transform.k})`;
                chartGroup.attr("transform", transform);
            });



        const svgSelection = d3.select(svgRef.current);

        const handleResize = () => {
            if (window.innerWidth <= 650 && !isAtMaxScale()) {
                console.log("resize");
                svgSelection.transition()
                    .duration(500) // Optional: Add transition duration
                    .call(zoom.transform, d3.zoomIdentity.scale(maxScale));
            }
            //i only want to do once and then the carousel item size will handle the rest
            else if( window.innerWidth > 650 && window.innerWidth <= 800){
                 console.log('normal scale');
                svgSelection.transition()
                    .duration(500) // Optional: Add transition duration
                    .call(zoom.transform, d3.zoomIdentity.scale(1));
            }
        };

        const isAtMaxScale = () => {
            const currentTransform = d3.zoomTransform(svgSelection.node());
            const currentScale = currentTransform.k;
            return currentScale >= maxScale;
        };


        window.addEventListener('resize', handleResize);

        handleResize();
    }, [data]);

    return (
        <svg ref={svgRef} style={{ margin: "2rem" }}></svg>
    );
}
