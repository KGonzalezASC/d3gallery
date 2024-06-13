import React, { FC, useEffect, useRef } from "react";
import * as d3 from 'd3';

interface ForceDirectedProps {
    data: {
        nodes: { name: string }[];
        edges: { source: string; target: string }[];
    };
}

export const ForceDirectedGraph: FC<ForceDirectedProps> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    const width = 620;
    const height = 600;

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current)
            .attr("width", "88%")
            .attr("height", height)
            .style("overflow", "visible")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .style("background", "#c5f6fa");

        // Create the force simulation
        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.edges).id((d: any) => d.name).distance(100))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(width / 2, height / 2));

        // Draw links
        const link = svg.selectAll("line")
            .data(data.edges, (d: any) => `${d.source}-${d.target}`)
            .join(
                enter => enter.append("line")
                    .attr("stroke", "#999")
                    .attr("stroke-opacity", 0.6)
                    .attr("stroke-width", 2),
                update => update,
                exit => exit.remove()
            );

        // Draw nodes
        const node = svg.selectAll("circle")
            .data(data.nodes, (d: any) => d.name)
            .join(
                enter => enter.append("circle")
                    .attr("r", 10)
                    .attr("fill", "#69b3a2")
                    .call(drag(simulation)),
                update => update.call(drag(simulation)),
                exit => exit.remove()
            );

        // Define drag behavior
        function drag(simulation: any) {
            function dragstarted(event: any, d: any) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }

            function dragged(event: any, d: any) {
                d.fx = Math.max(10, Math.min(width - 10, event.x));
                d.fy = Math.max(10, Math.min(height - 10, event.y));
            }

            function dragended(event: any, d: any) {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }

            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }

        // Update positions on each tick
        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => (d.source as any).x)
                .attr("y1", (d: any) => (d.source as any).y)
                .attr("x2", (d: any) => (d.target as any).x)
                .attr("y2", (d: any) => (d.target as any).y);

            node
                //constraint the nodes to the width and height of the svg
                .attr("cx", (d: any) => d.x = Math.max(10, Math.min(width - 10, d.x)))
                .attr("cy", (d: any) => d.y = Math.max(10, Math.min(height - 10, d.y)));
        });

    }, [data]);

    return (
        <svg ref={svgRef} style={{ margin: "2rem" }}></svg>
    );
}
