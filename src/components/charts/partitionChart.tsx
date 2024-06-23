import {FC, useEffect, useRef} from "react";
import * as d3 from 'd3';

// Define the type for the data prop
interface FinancialSheetChild {
    name: string;
    value?: number;
    children?: FinancialSheetChild[];
    _initialFontSize?: string;
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
    data: FinancialSheet | null;
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

        const partition = d3.partition<FinancialSheetChild>()
            .size([height - 50, width - 50])
            .padding(1)
            .round(true);

        const color = d3.scaleOrdinal(d3.schemeSet2);

        const rootWithPartition = partition(root) as FinancialNode;
        // Create a group to contain the chart
        const chartGroup = svg.append("g");

        // Render groups containing partition and text
        const groups = chartGroup.selectAll<SVGGElement, FinancialNode>("g")
            .data(rootWithPartition.descendants())
            .join(
                enter => {
                    return enter.append("g")
                        .attr("transform", d => `translate(${d.y0 + 25},${d.x0 + 25})`)
                        .on("mouseover", function (_, d: FinancialNode) {
                            d3.select(this).raise(); // Bring the group to the front
                            const rect = d3.select(this).select<SVGRectElement>("rect");
                            const text = d3.select(this).select<SVGTextElement>("text");
                            rect.transition()
                                .duration(200)
                                .attr("x", -5)
                                .attr("y", -5)
                                .attr("width", (d.y1 - d.y0) + 10)
                                .attr("height", (d.x1 - d.x0) + 10);
                            text.transition()
                                .duration(200)
                                .style("font-size", "14px"); // Increase font size on hover
                        })
                        .on("mouseout", function (_, d: FinancialNode) {
                            const rect = d3.select(this).select<SVGRectElement>("rect");
                            const text = d3.select(this).select<SVGTextElement>("text");
                            rect.transition()
                                .duration(200)
                                .attr("x", 0)
                                .attr("y", 0)
                                .attr("width", d.y1 - d.y0)
                                .attr("height", d.x1 - d.x0);
                            text.transition()
                                .duration(200)
                                .style("font-size", d.data._initialFontSize || "11px");
                        });
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
            .style('fill', d => color(String(d.depth)));

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
                d.data._initialFontSize = `${fontSize}px`;
                return `${fontSize}px`;
            })
            .attr("text-anchor", "middle");

        // Implement zoom behavior
        // const zoom = d3.zoom<SVGSVGElement, FinancialNode>()
        //     .scaleExtent([1, maxScale])
        //     .on("zoom", (event) => {
        //         // Apply the transform
        //         const transform = event.transform.k === 1
        //             ? `translate(0,0) scale(1)`
        //             : `translate(-60,-60) scale(${event.transform.k})`;
        //         chartGroup.attr("transform", transform);
        //     });





        const svgSelection = d3.select(svgRef.current);

        const handleResize = () => {
            let scaleFactor = 1;
            if (window.innerWidth <= 650 &&!isAtMaxScale()) {
                console.log("resize");
                scaleFactor = maxScale;
            } else if (window.innerWidth > 650 && window.innerWidth <= 800) {
                console.log('normal scale');
                scaleFactor = 1;
            }

            // Check if the SVG node exists before proceeding
            const svgNode = svgSelection.node();
            if (!svgNode) {
                console.error("SVG node is not available.");
                return; // Exit early if the SVG node is not found
            }

            const currentTransform = d3.zoomTransform(svgNode);
            const targetTransform = d3.zoomIdentity.translate(0, 0).scale(scaleFactor);

            svgSelection.transition()
                .duration(500) // Optional: Add transition duration
                .attrTween("transform", () => {
                    // Interpolate between the current transform and the target transform
                    return (intermediate) => {
                        return `translate(${currentTransform.x + (targetTransform.x - currentTransform.x) * intermediate}, 
                ${currentTransform.y + (targetTransform.y - currentTransform.y) * intermediate}) 
                scale(${currentTransform.k + (targetTransform.k - currentTransform.k) * intermediate})`;
                    };
                });
        };



        const isAtMaxScale = () => {
            // Attempt to get the SVG node
            const svgNode = svgSelection.node();

            // Check if the SVG node exists before proceeding
            if (!svgNode) {
                console.error("SVG node is not available.");
                return false; // Return false if the SVG node is not found
            }

            // Proceed with getting the current transform if the node exists
            const currentTransform = d3.zoomTransform(svgNode);
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
