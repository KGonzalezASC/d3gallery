import {FC, useEffect, useRef, useState} from 'react';
import * as d3 from 'd3';
import Modal from 'react-modal';

interface DataItem {
    name: string;
    playtime_forever: number;
    appid: number;
    img_icon_url: string;
}

type GameTexts = {
    [key: string]: {
        text: string;
        image: string;
    };
};

Modal.setAppElement('#root');

export const DonutChart: FC<{ data: DataItem[] }> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const w = 520;
    const h = 500;
    const maxScale = 1.3;
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedDataItem, setSelectedDataItem] = useState<DataItem | null>(null);
    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current)
            .attr("width", "88%")
            .attr("height", h)
            .style("overflow", "visible")
            .attr("viewBox", `0 0 ${w} ${h}`)
            .style("background", "#c5f6fa");

        svg.selectAll("*").remove();

        const radius = Math.min(w, h) / 2.45;

        const defs = svg.append("defs");
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const filter = defs.append("filter")
            .attr("id", "blur-filter")
            .append("feGaussianBlur")
            .attr("stdDeviation", 2);

        const color = d3.scaleOrdinal<string>(d3.schemeSet2);
        const pie = d3.pie<DataItem>().value(d => d.playtime_forever);
        const arc = d3.arc<d3.PieArcDatum<DataItem>>().innerRadius(123).outerRadius(radius);

        const arcTween = (d: d3.PieArcDatum<DataItem>) => {
            const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
            return (t: number) => arc(i(t)) as string;
        };

        const totalHours = data.reduce((acc, d) => acc + d.playtime_forever, 0);
        const g = svg.append("g").attr("transform", `translate(${w / 2}, ${h / 2})`);

        const totalText = g.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .style("font-size", "14px")
            .style("font-weight", "bold");

        const arcs = g.selectAll<SVGGElement, d3.PieArcDatum<DataItem>>(".arc")
            .data(pie(data))
            .enter()
            .append("g")
            .attr("class", "arc")
            .attr("cursor", "pointer")
            .on('mouseover', (event: MouseEvent, d: d3.PieArcDatum<DataItem>) => {
                const percentage = (d.data.playtime_forever / totalHours * 100).toFixed(2);
                totalText.text(`${percentage}% of total hours`);

                const currentTarget = event.currentTarget as SVGGElement;
                d3.select(currentTarget)
                    .transition()
                    .duration(250)
                    .attr("transform", () => `${calcTranslate(d, -40)} ${isAtMaxScale() ? `scale(${maxScale})` : `scale(1)`}`);

                const shadowPath = d3.select(currentTarget)
                    .insert<SVGPathElement>("path", ":first-child")
                    .attr("class", "shadow-path")
                    .attr("d", arc as unknown as string)
                    .attr("fill", "none")
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("filter", "url(#blur-filter)");

                shadowPath.transition()
                    .duration(250)
                    .attr("transform", calcTranslate(d, 25));
            })
            .on('mouseout', (event: MouseEvent, d: d3.PieArcDatum<DataItem>) => {
                totalText.text(`Total Hours: ${totalHours.toFixed(2)} hours`);

                const currentTarget = event.currentTarget as SVGGElement;
                d3.select(currentTarget)
                    .transition()
                    .duration(250)
                    .attr("transform", () => `${calcTranslate(d, 0)} ${isAtMaxScale() ? `scale(${maxScale})` : `scale(1)`}`);

                d3.select(currentTarget)
                    .select(".shadow-path")
                    .remove();
            })
            .on('click', (_event: MouseEvent, d: d3.PieArcDatum<DataItem>) => {
                setTimeout(() => {
                    setSelectedDataItem(d.data);
                    setModalIsOpen(true);
                }, 450);
            });


        arcs.append("path")
            .attr("fill", d => color(d.data.name))
            .transition()
            .duration(1000)
            .attrTween("d", arcTween)
            .on("end", function (this: SVGPathElement, d: d3.PieArcDatum<DataItem>) {
                const parent = d3.select(this.parentNode as SVGGElement);
                parent.append("image")
                    .attr("xlink:href", constructImageUrl(d.data.appid, d.data.img_icon_url))
                    .attr("width", 50)
                    .attr("height", 50)
                    .attr("transform", (datum: unknown) => {
                        const d = datum as d3.PieArcDatum<DataItem>;
                        const [x, y] = arc.centroid(d);
                        return `translate(${(x - 25) * 1.12}, ${(y - 25) * 1.12})`;
                    })
                    .style("filter", "opacity(1)");
            });






        const svgSelection = d3.select(svgRef.current);
        const handleResize = () => {
            if (window.innerWidth <= 440 && !isAtMaxScale()) {
                svgSelection.transition()
                    .duration(500)
                    .call(zoom.transform, d3.zoomIdentity.scale(maxScale));
            } else if (window.innerWidth > 440 && window.innerWidth <= 800) {
                svgSelection.transition()
                    .duration(500)
                    .call(zoom.transform, d3.zoomIdentity.scale(1));
            }
        };

        const isAtMaxScale = () => {
            const currentTransform = d3.zoomTransform(svgSelection.node()!);
            const currentScale = currentTransform.k;
            return currentScale >= maxScale;
        };

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([1, maxScale])
            .on("zoom", (event) => {
                const transform = event.transform.k === 1
                    ? `translate(0,0) scale(1)`
                    : `translate(0,0) scale(${event.transform.k})`;

                svgSelection.selectAll(".arc").attr("transform", transform);
            });

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            svgSelection.call(zoom.transform, d3.zoomIdentity.scale(1));
            window.removeEventListener('resize', handleResize);
        };
    }, [data]);

    const calcTranslate = (data: d3.PieArcDatum<DataItem>, move = 4) => {
        const moveAngle = data.startAngle + ((data.endAngle - data.startAngle) / 2);
        return `translate(${move * Math.cos(moveAngle + Math.PI / 2)}, ${move * Math.sin(moveAngle + Math.PI / 2)})`;
    };

    if (!data) {
        return (
            <>
                <p>Loading...</p>
            </>
        );
    }
    return (
        <>
            <h6 className="pt-6 text-sm md:text-lg">My steam data (games {'>'} 100hrs):</h6>
            <svg ref={svgRef} style={{ marginBottom: "2rem", width: "100%" }}></svg>
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => setModalIsOpen(false)}
                contentLabel="Store Page Visit"
                className="fixed inset-0 flex items-center justify-center"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50"
            >
                <div className="relative w-auto my-6 mx-auto max-w-xl">
                    <div className="rounded-lg shadow-lg bg-white p-6">
                        <h2 className="text-2xl font-bold mb-4">Visit Store Page?</h2>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {selectedDataItem && (
                                <p className="text-gray-700 mb-6">{gameTexts[selectedDataItem.name]?.text}</p>
                            )}
                        </div>
                        {selectedDataItem && (
                            <img
                                src={gameTexts[selectedDataItem.name]?.image}
                                alt="game"
                                className="w-48 h-48 object-contain rounded-lg mb-6"
                            />
                        )}

                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => window.open(`https://store.steampowered.com/app/${selectedDataItem?.appid}`)}
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setModalIsOpen(false)}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
};

const constructImageUrl = (appid: number, iconUrl: string) => {
    return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${iconUrl}.jpg`;
};
const gameTexts: GameTexts = {
    "Temtem": {
        text: "I picked up TemTem around the time Pokémon Sword and Shield were making the rounds and with how disappointed the direction of the series was going be it design wise or technically. TemTem itself has its own pitfalls, be it a baffling narrative, but the game's unique spin on turn-based monster battling systems in a doubles context was refreshing and engaging. From a balance perspective, it's clear the developers were adamant about recreating a strong form of consistency you would find in Pokemon's best games through its unique moves and systems that enable a higher level of decision making that is absent from current Pokemon games. My favorite TemTem are Ob10, Gharuander, Saku, Gazuma, and my first shiny Shuine.",
        image: "./saku.webp"
    },
    "Tom Clancy's Rainbow Six Siege": {
        text: "Rainbow Six Siege has been a significant part of my free time with my closest friends, and the antics we get into are hilarious. As a unique 5v5 tactical shooter, I appreciate the premise of the defender sites being real structures, which sets it apart from its counterparts. The ability to shoot through and play off destructible walls adds a layer of strategy and excitement to the gameplay. Over the years, the game has seen some interesting balance decisions. It's impressive to see that one of the most enjoyable seasons has also marked a new peak in its popularity. The dynamic between attackers and defenders, with each operator's unique gadgets and abilities, requires careful planning and teamwork. This depth of strategy, combined with the destructible environments, creates a constantly evolving battlefield that keeps the gameplay fresh and engaging. My friends and I always find new ways to approach each match, making every game a unique and thrilling experience.",
        image: "./fefnir.webp"
    },
    "Apex Legends": {
        text: "Apex Legends is a game we picked up around the time Siege got stale, as we wanted a battle royale with gun-play similar to Siege's. However, I find that this game has overall worse balance between characters and the situations players are put in. I wish the game would steer towards a different style of play at both the highest and casual levels. Additionally, Bloodhound's 'scan' has an orange filter that my eyes treat as a flashbang, so it's quite aggravating.",
        image: "./apex.png"
    },
    "Street Fighter V": {
        text: "Despite its balance issues, I appreciate the more structured checks and balances that Street Fighter V (SFV) offers compared to its current counterpart. The okizeme system is easily comprehensible even for new players, which adds to the game's appeal. Matches feel more structured, with each fighter having a clear role and response. SFV has grown into a healthy meta despite its very rough launch. However, my main gripes with the game lie with its poor online infrastructure and the disappointing impact of the v-trigger system on a large chunk of the cast's characters.",
        image: "./sfv5.webp"
    },
    "Rocket League": {
        text: "Despite what people may claim, I find Rocket League to be more confusing to learn input-wise than a standard fighting game. This makes it very hard for me to execute the situations I want in a match.",
        image: "./car.png"
    },
    "GUILTY GEAR -STRIVE-": {
        text: "Guilty Gear Strive is the best feeling fighting game from the recent era, offering a fast and fluid experience. However, I hope the game undergoes further tuning to allow for more defensive responses to pressure and to tone down the excessive offensive capabilities of certain characters. Roman Cancels remain the most enjoyable mechanic for enabling offense and counter pokes in any fighting game to this day. However, Faultless Defense and Deflect Shield are not sufficiently effective in preventing the aggressor from disrupting the defender's rhythm, causing them to struggle more in regaining momentum.",
        image: "./bedman.webp"
    },
    "Blender": {
        text: "I dabbled around with it for a bit, but I found the learning curve to be a bit steep. However, during an internship, I had an opportunity to learn more about modeling, animation, and rigging. I hope to get better at texturing, topology, and rigging.",
        image: "./blender.webp"
    }
};
