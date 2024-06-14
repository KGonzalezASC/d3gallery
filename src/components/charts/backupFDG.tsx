import { FC, useEffect, useRef } from "react";
import * as d3 from 'd3';

// Define interfaces for nodes and edges
interface Node extends d3.SimulationNodeDatum {
    name: string;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

interface Edge extends d3.SimulationLinkDatum<Node> {
    source: string | Node;
    target: string | Node;
}

interface ForceDirectedProps {
    data: {
        nodes: Node[];
        edges: Edge[];
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
        const simulation = d3.forceSimulation<Node>(data.nodes)
            .force("link", d3.forceLink<Node, Edge>(data.edges).id((d: Node) => d.name).distance(100))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(width / 2, height / 2));

        // Draw links
        const link = svg.selectAll<SVGLineElement, Edge>("line")
            .data(data.edges)
            .join(
                enter => enter.append("line")
                    .attr("stroke", "#999")
                    .attr("stroke-opacity", 0.6)
                    .attr("stroke-width", 2),
                update => update,
                exit => exit.remove()
            );

        // Draw nodes
        const node = svg.selectAll<SVGCircleElement, Node>("circle")
            .data(data.nodes)
            .join(
                enter => enter.append("circle")
                    .attr("r", 10)
                    .attr("fill", "#69b3a2")
                    .call(drag(simulation)),
                update => update.call(drag(simulation)),
                exit => exit.remove()
            );

        // Define drag behavior
        const drag = (simulation: d3.Simulation<Node, Edge>) => d3.drag<SVGCircleElement, Node>()
            .on("start", (event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) => {
                d.fx = Math.max(10, Math.min(width - 10, event.x));
                d.fy = Math.max(10, Math.min(height - 10, event.y));
            })
            .on("end", (event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });

        // Update positions on each tick
        simulation.on("tick", () => {
            link
                .attr("x1", (d: Edge) => (d.source as Node).x!)
                .attr("y1", (d: Edge) => (d.source as Node).y!)
                .attr("x2", (d: Edge) => (d.target as Node).x!)
                .attr("y2", (d: Edge) => (d.target as Node).y!);

            node
                .attr("cx", (d: Node) => d.x = Math.max(10, Math.min(width - 10, d.x!)))
                .attr("cy", (d: Node) => d.y = Math.max(10, Math.min(height - 10, d.y!)));
        });

    }, [data]);

    return (
        <svg ref={svgRef} style={{ margin: "2rem" }}></svg>
    );
};
