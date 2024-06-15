import {FC, useCallback, useEffect, useRef, useState} from "react";
import * as d3 from 'd3';
import Modal from "react-modal";
import { debounce } from 'lodash';
import Draggable from "react-draggable";
import {LineChartFDG} from "@/components/charts/lineChartFDG.tsx";

Modal.setAppElement('#root');

interface Node  extends d3.SimulationNodeDatum {
    id: number;
    name: string;
    maxWeeklyRevenue?: number;
    monthlyViewData?: { date: string; views: number }[];
    totalViews?: number;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

interface Edge {
    source: number;
    target: number;
}

interface ForceDirectedProps {
    data: {
        nodes: Node[];
        edges: Edge[];
    };
}

export const ForceDirectedGraph: FC<ForceDirectedProps> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const sizeConstant = 0.000000000312;
    const width = 620;
    const height = 550;
    const [isBrushingEnabled, setIsBrushingEnabled] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
    const nodeGroupRef = useRef<SVGGElement | null>(null); // Ref to store nodeGroup selection
    const modalRef = useRef(null);

    /**
     * ms delay for debouncing 8 ms is the lowest possible value before the modal doesn't open when brushing
     * using debouncing prevent conflicts between brushing and modal opening or modal updating its data without reaching max depth * only occurs when the user brushes all nodes that is fine to accept.
     */
    const debouncedSetSelectedNodes = useCallback(debounce(setSelectedNodes,8), []);

    // Handle brushing
    const handleBrush = (event: d3.D3BrushEvent<SVGSVGElement | null>) => {
        const selection = event.selection;
        if (!selection) return;
        const [[x0, y0], [x1, y1]] = selection as [[number, number], [number, number]];
        const brushedNodes = data.nodes.filter((d: Node) =>
            d.name !== 'Omnia-Media' && d.x! >= x0 && d.x! <= x1 && d.y! >= y0 && d.y! <= y1
        );
        debouncedSetSelectedNodes(brushedNodes);

        d3.select<SVGGElement, Node>(nodeGroupRef.current!)
            .selectAll<SVGCircleElement, Node>("circle")
            .attr("fill", (d: Node) => brushedNodes.includes(d) ? "red" : "#69b3a2");
    };

    const createBrush = () => {
        return d3.brush().on("start brush end", handleBrush);
    };

    const applyBrush = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, enable: boolean) => {
        svg.select(".brush").remove();
        if (enable) {
            svg.append("g").attr("class", "brush").call(createBrush());
        }
    };

    useEffect(() => {
        if (!svgRef.current) return;

        // Initialize SVG
        const svg = d3.select(svgRef.current)
            .attr("width", "88%")
            .attr("height", height)
            .style("overflow", "visible")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .style("background", "#c5f6fa");

        // Clear previous elements
        svg.selectAll("*").remove();

        // Create groups for links and nodes
        const linkGroup = svg.append("g").attr("class", "links");
        const nodeGroup = svg.append("g").attr("class", "nodes");
        nodeGroupRef.current = nodeGroup.node(); // Store nodeGroup selection in ref

        // Calculate total views for nodes
        let totalViewsAllNodes = 0;
        data.nodes.forEach(node => {
            if (node.monthlyViewData && Array.isArray(node.monthlyViewData)) {
                const totalViews = node.monthlyViewData.reduce((sum, data) => sum + data.views, 0);
                totalViewsAllNodes += totalViews;
                node.totalViews = totalViews;
            } else {
                node.totalViews = 0;
            }
        });

        const centralNodeSize = totalViewsAllNodes * sizeConstant;

        // Create the force simulation
        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink<Node,Edge>(data.edges).id((d: Node) => d.id).distance(130))
            .force("charge", d3.forceManyBody().strength(-270)) // affects rotation speed to some degree
            .force("center", d3.forceCenter(width / 2, height / 2));

        // Define drag behaviour:

        const drag = (simulation: d3.Simulation<Node, Edge>) => {
            const dragStarted = (event: d3.D3DragEvent<SVGCircleElement, Node, d3.SimulationNodeDatum>) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
                simulation.force("link", d3.forceLink<Node, Edge>(data.edges).id((d: Node) => String(d.id)).distance(300));
            };

            const dragged = (event: d3.D3DragEvent<SVGCircleElement, Node, d3.SimulationNodeDatum>) => {
                event.subject.fx = Math.max(10, Math.min(width - 10, event.x));
                event.subject.fy = Math.max(10, Math.min(height - 10, event.y));
            };

            const dragEnded = (event: d3.D3DragEvent<SVGCircleElement, Node, d3.SimulationNodeDatum>) => {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
                simulation.force("link", d3.forceLink<Node, Edge>(data.edges).id((d: Node) => String(d.id)).distance(210));
            };

            return d3.drag<SVGCircleElement, Node>()
                .on("start", dragStarted)
                .on("drag", dragged)
                .on("end", dragEnded);
        };


        // Draw links
        const link = linkGroup.selectAll<SVGLineElement, Edge>("line")
            .data(data.edges, (d: Edge) => `${d.source}-${d.target}`)
            .join(
                enter => enter.append("line")
                    .attr("stroke", "#ff0000")
                    .attr("stroke-opacity", 0.6)
                    .attr("stroke-width", 2),
                update => update,
                exit => exit.remove()
            );



        // Draw nodes
        const node = nodeGroup.selectAll<SVGCircleElement, Node>("circle")
            .data(data.nodes, (d: Node) => d.id.toString())
            .join(
                enter => {
                    const circle = enter.append("circle")
                        .attr("r", d => {
                            const baseRadius = d.name === 'Omnia-Media' ? centralNodeSize : (d.totalViews || 0) * sizeConstant;
                            return Math.max(5, baseRadius); // Ensure minimum radius for selection purposes and visual appeal
                        })
                        .attr("fill", "#69b3a2");

                    if (!isBrushingEnabled) {
                        circle.call(drag(simulation));
                    }

                    return circle;
                },
                update => {
                    if (!isBrushingEnabled) {
                        update.call(drag(simulation));
                    }
                    return update;
                },
                exit => exit.remove()
            );

        // Apply or remove brush based on isBrushingEnabled
        applyBrush(svg, isBrushingEnabled);

        // Periodically restart simulation to keep it dynamic
        d3.interval(() => {
            simulation.alphaTarget(0.66);
            simulation.restart();
        }, 1300);

        // Update positions on each tick
        simulation.on("tick", () => {
            link
                .attr("x1", (d: d3.SimulationLinkDatum<Node>) => (d.source as Node).x!)
                .attr("y1", (d: d3.SimulationLinkDatum<Node>) => (d.source as Node).y!)
                .attr("x2", (d: d3.SimulationLinkDatum<Node>) => (d.target as Node).x!)
                .attr("y2", (d: d3.SimulationLinkDatum<Node>) => (d.target as Node).y!);
            node
                .attr("cx", (d: Node) => d.x = Math.max(10, Math.min(width - 10, d.x!)))
                .attr("cy", (d: Node) => d.y = Math.max(10, Math.min(height - 10, d.y!)));

            // Constantly update selection and node color
            if (isBrushingEnabled) {
                const brushNode = svg.select('.brush').node() as SVGGElement;
                if (brushNode) {
                    const brushBehavior = d3.brush<SVGGElement>()
                        .extent([[0, 0], [width, height]])
                        .on("brush", handleBrush);

                    const brushSelection = d3.brushSelection(brushNode);

                    if (brushSelection) {
                        brushBehavior.move(d3.select(brushNode), brushSelection);
                    } else {
                        brushBehavior.clear(d3.select(brushNode));
                    }
                }
            }
        });



        //if weird behavior, remove debouncedSetSelectedNodes
    }, [data, isBrushingEnabled, debouncedSetSelectedNodes]);

    useEffect(() => {
        if (selectedNodes.length > 0) {
            setModalIsOpen(true);
        } else {
            setModalIsOpen(false);
        }
    }, [selectedNodes]);

    const handleCloseModal = () => {
        //set nodes via debounce
        debouncedSetSelectedNodes([]); //solution : o
        setModalIsOpen(false);
        const svg = d3.select<SVGSVGElement, unknown>(svgRef.current!);
        d3.select(nodeGroupRef.current)
            .selectAll("circle")
            .attr("fill", "#69b3a2");
        applyBrush(svg, isBrushingEnabled);
    };

    return (
        <>
            <div className="pb-0 pt-4">
                <input
                    type="checkbox"
                    id="brushing"
                    checked={isBrushingEnabled}
                    onChange={() => {
                        setIsBrushingEnabled(!isBrushingEnabled);
                        if (!isBrushingEnabled) {
                            debouncedSetSelectedNodes([]); //solution : o
                            const svg = d3.select<SVGSVGElement, unknown>(svgRef.current!);
                            applyBrush(svg, false); // Remove brush
                        }
                    }}
                    className="form-checkbox h-5 w-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500 dark:focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <label htmlFor="brushing" className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                    Enable Brushing
                </label>
            </div>

            <svg ref={svgRef} style={{ marginBottom: "2rem" }}></svg>
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={handleCloseModal}
                contentLabel="View channel analytics"
                className="inset-0 flex items-center justify-center z-50"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50"
            >
                <Draggable defaultPosition={{ x: 0, y: 0 }} cancel=".no-drag" nodeRef={modalRef}>
                    <div ref={modalRef} className="relative w-auto my-6 mx-auto max-w-xl">
                        <div className="rounded-lg shadow-lg bg-white p-6">
                            <h2 className="text-xl font-semibold mb-4">Selected Channels</h2>
                            <LineChartFDG data={selectedNodes} />
                            <ul>
                                {selectedNodes.map(node => (
                                    <li key={node.id} className="mb-2">
                                        <strong>{node.name}</strong>: {node.totalViews} views
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <button onClick={handleCloseModal} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded no-drag">
                            Close
                        </button>
                    </div>
                </Draggable>
            </Modal>

        </>
    );
};
