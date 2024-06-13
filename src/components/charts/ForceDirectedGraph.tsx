import {FC, useCallback, useEffect, useRef, useState} from "react";
import * as d3 from 'd3';
import Modal from "react-modal";
import { debounce } from 'lodash';
import Draggable from "react-draggable";
import {LineChartFDG} from "@/components/charts/lineChartFDG.tsx";
import ErrorBoundary from "@/components/errorBoundary.tsx";

Modal.setAppElement('#root');

interface Node {
    id: number;
    name: string;
    maxWeeklyRevenue?: number;
    monthlyViewData?: { views: number }[];
    totalViews?: number;
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
    const handleBrush = (event: d3.D3BrushEvent<any>) => {
        const selection = event.selection;
        if (selection === null) return;
        const [[x0, y0], [x1, y1]] = selection;
        const brushedNodes = data.nodes.filter((d: any) =>
            d.name !== 'Omnia-Media' && d.x >= x0 && d.x <= x1 && d.y >= y0 && d.y <= y1
        );
        debouncedSetSelectedNodes(brushedNodes);

        d3.select(nodeGroupRef.current)
            .selectAll("circle")
            .attr("fill", (d: any) => brushedNodes.includes(d) ? "red" : "#69b3a2");
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
            .force("link", d3.forceLink(data.edges).id((d: any) => d.id).distance(130))
            .force("charge", d3.forceManyBody().strength(-270)) // affects rotation speed to some degree
            .force("center", d3.forceCenter(width / 2, height / 2));

        // Define drag behaviour:
        const drag = (simulation: any) => {
            const dragstarted = (event: any, d: any) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
                simulation.force("link", d3.forceLink(data.edges).id((d: any) => d.id).distance(300));
            };

            const dragged = (event: any, d: any) => {
                d.fx = Math.max(10, Math.min(width - 10, event.x));
                d.fy = Math.max(10, Math.min(height - 10, event.y));
            };

            const dragended = (event: any, d: any) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
                simulation.force("link", d3.forceLink(data.edges).id((d: any) => d.id).distance(210));
            };

            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        };

        // Draw links
        const link = linkGroup.selectAll("line")
            .data(data.edges, (d: any) => `${d.source}-${d.target}`)
            .join(
                enter => enter.append("line")
                    .attr("stroke", "#ff0000")
                    .attr("stroke-opacity", 0.6)
                    .attr("stroke-width", 2),
                update => update,
                exit => exit.remove()
            );


        // Draw nodes
        const node = nodeGroup.selectAll("circle")
            .data(data.nodes, (d: any) => d.id)
            .join(
                enter => {
                    const circle = enter.append("circle")
                        .attr("r", d => {
                            const baseRadius = d.name === 'Omnia-Media' ? centralNodeSize : d.totalViews * sizeConstant ;
                            return Math.max(5, baseRadius) // Ensure minimum radius for selection purposes and visual appeal
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
                .attr("x1", (d: any) => (d.source as any).x)
                .attr("y1", (d: any) => (d.source as any).y)
                .attr("x2", (d: any) => (d.target as any).x)
                .attr("y2", (d: any) => (d.target as any).y);

            node
                .attr("cx", (d: any) => d.x = Math.max(10, Math.min(width - 10, d.x)))
                .attr("cy", (d: any) => d.y = Math.max(10, Math.min(height - 10, d.y)));

            // Constantly update selection and node color
            if (isBrushingEnabled) {
                const brushNode = svg.select('.brush').node() as SVGGElement;
                const brushSelection = brushNode ? d3.brushSelection(brushNode) : null;
                if (brushSelection) {
                    //code is now consistent with D.R.Y. principles
                    handleBrush({ selection: brushSelection } as d3.D3BrushEvent<any>);
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
        const svg = d3.select(svgRef.current);
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
                            const svg = d3.select(svgRef.current);
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
