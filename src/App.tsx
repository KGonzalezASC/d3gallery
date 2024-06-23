import './App.css';
import {
    BtcRealTimePrice,
    FinancialSheetComponent,
    useDonutChartData,
    useLineChartData,
    useTemtemChartData,
    ytData
} from "@/chartDataHandler";
import {Suspense, useEffect, useRef, useState} from 'react';
import LineChart from "@/components/charts/lineChart";
import Autoplay from "embla-carousel-autoplay";
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
} from '@/components/ui/carousel';
import {DonutChart} from "@/components/charts/donutChart";
import {HistogramChart} from "@/components/charts/histogramChart.tsx";
import {ScatterplotQRChart} from "@/components/charts/scatterplotQRChart.tsx";
import {BarChart} from "@/components/charts/barChart.tsx";
import {ForceDirectedGraph} from "@/components/charts/ForceDirectedGraph.tsx";
import {PartitionChart} from "@/components/charts/partitionChart.tsx";
import LineChartBTC from "@/components/charts/lineChartBTC.tsx";


const App: React.FC = () => {
    const [api, setApi] = useState<null | CarouselApi>(null);
    const [current, setCurrent] = useState(0);
    const { data } = useLineChartData(current);
    const donutData  = useDonutChartData(current);
    const TemtemmData = useTemtemChartData(current);
    const fData = FinancialSheetComponent(current);
    //btc data
    const btcData = BtcRealTimePrice({ currentIndex: current });

    const plugin = useRef(
        Autoplay({ delay: 6900, stopOnInteraction: true}),
    )


    //pass these into background of each svg instead itll prop look nicer
    const backgroundColors: string[] = [
        // 'bg-blue-100', // Background for slide 1
        // 'bg-green-100', // Background for slide 2
        // 'bg-yellow-100', // Background for slide 3
        // 'bg-red-100', // Background for slide 4
        // 'bg-purple-100', // Background for slide 5
        // 'bg-pink-100', // Background for slide 6
        // 'bg-black-100',
    ];


    const handleDotClick = (index: number) => {
        if (api) {
            //true allows duration bypass for immediate snapping
            api.scrollTo(index,true);
        }

    }

    useEffect(() => {
        if (api) {
            setCurrent(api.selectedScrollSnap() + 1);

            const handleSelect = () => {
                setCurrent(api.selectedScrollSnap() + 1);
            };

            api.on('select', handleSelect);

            return () => {
                api.off('select', handleSelect);
                // api.off('resize'); // Optionally remove other event listeners if needed
                api.destroy();
            };
        }
    }, [api]);



    return (
        <div className={`grid grid-rows-[1,.5fr, auto auto] grid-cols-1  ${backgroundColors[current]}`}>
            <div className="row-span-1">
                <h6 className="text-center text-4xl pb-6 font-bold">Sample Visualizations</h6>
            </div>
            <div className="row-span-1">
                <Carousel
                    setApi={setApi}
                    className="justify-center items-center h-full w-full grid grid-cols-[auto,.5fr,auto]"
                    opts={{loop: true,  watchDrag:false}}
                    onMouseEnter={plugin.current.stop}
                    onMouseLeave={plugin.current.reset}>
                    <CarouselContent>
                        <CarouselItem className='flex flex-col bg-white card rounded-lg px-10'>
                            <Suspense fallback={<div>Loading...</div>}>
                                <DonutChart data={donutData}/>
                            </Suspense>
                        </CarouselItem>

                        <CarouselItem
                            className='flex flex-col card rounded-lg bg-white items-center'>
                            <HistogramChart data={TemtemmData}/>
                        </CarouselItem>
                        <CarouselItem
                            className='flex flex-col card rounded-lg bg-white items-center'>
                            <ScatterplotQRChart data={TemtemmData}/>
                        </CarouselItem>
                        <CarouselItem
                            className='flex flex-col card rounded-lg bg-white items-center'>
                            <BarChart data={TemtemmData}/>
                        </CarouselItem>
                        <CarouselItem
                            className='flex flex-col card rounded-lg bg-white items-center p-4 pb-7'>
                            <LineChart data={data}/>
                        </CarouselItem>
                        <CarouselItem
                            className='flex flex-col card rounded-lg bg-white items-center p-4 pb-7'>
                            <Suspense fallback={<div>Loading...</div>}>
                            <LineChartBTC data={btcData}/>
                            </Suspense>
                        </CarouselItem>


                        <CarouselItem
                            className='flex flex-col card rounded-lg bg-white w-full justify-center items-center'>
                            <ForceDirectedGraph data={ytData}/>
                        </CarouselItem>
                        <CarouselItem
                            className='flex flex-col card rounded-lg bg-white items-center'>
                            <PartitionChart data={fData}/>
                        </CarouselItem>
                        {/*//last one must have large margin right*/}
                        <CarouselItem
                            className='card rounded-lg bg-white w-full justify-center items-center mr-[20rem] overflow-y-auto'>
                            <h6 className="mt-3 text-center text-4xl font-bold">Project sources:</h6>
                            <h2 className="mt-4 mb-6 py-2 bg-blue-500 text-white hover:bg-blue-700 w-full">Ham</h2>
                            <div className="grid grid-cols-1 gap-1 sm:gap-4 sm:grid-cols-2">
                                {/* Each child div will now take up the full width on small screens */}
                                <div className="col-span-1 m-12 flex flex-col justify-between">
                                    <h6 className="text-center text-4xl pb-2 font-bold">React</h6>
                                    <p className="text-center">Using hooks simplified the process of controlling when d3 components recieved their data so that when the user navigates the carousel the slides will properly do an 'enter transition'. Hooks were used enable interactivity between the components and the provided data</p>
                                </div>
                                <div className="col-span-1 m-12 flex flex-col justify-between">
                                    <h6 className="text-center text-4xl pb-2 font-bold">Shadcn/ui</h6>
                                    <p className="text-center">Reworked the generated embla carousel to ensure consistent slide sizing and responsive behaviour while perserving slide transition behaviour which broke originally when handling d3 canvases. Ensured that when slides responsively scale the canvas child component does not cause an aggressive flicker by resliding it back in when the screen width changes.</p>
                                </div>.
                                <div className="col-span-1 m-6 flex flex-col justify-between">
                                    <h6 className="text-center text-4xl pb-2 font-bold">APIs</h6>
                                    <a href="https://developer.valvesoftware.com/wiki/Steam_Web_API" target="_blank" rel="noopener noreferrer">Steam API</a>.
                                    <a href={"https://min-api.cryptocompare.com/documentation"} target="_blank" rel="noopener noreferrer">CryptoCompare API</a>.
                                    <a href="https://temtem-api.mael.tech/" target="_blank" rel="noopener noreferrer">Temtem API</a>.
                                </div>
                                <div className="col-span-1 m-6 flex flex-col justify-between">
                                    <h6 className="text-center text-4xl pb-2 font-bold">D3</h6>
                                    <p className="text-center">My preferred SVG library of choice while I did use hooks, it was a lot simpler to migrate with the standard D3 library than using specific components.</p>
                                </div>
                                <div className="col-span-1 m-12 flex flex-col justify-between">
                                    <h6 className="text-center text-4xl pb-2 font-bold">Vite</h6>
                                    <p className="text-center">Easy to bundle, setup proxies, and test code on WSL.</p>
                                </div>
                            </div>
                        </CarouselItem>
                    </CarouselContent>
                    <CarouselPrevious
                        className='col-span-1 p-2 bg-black text-white rounded-lg transform translate-x-4 md:translate-x-12'/>
                    <CarouselNext
                        className='col-span-1 p-2 bg-black text-white rounded-lg transform lg:-translate-x-12 -translate-x-4'/>
                </Carousel>
            </div>
            <div className='row-span-1 '>
                <div className="button-container  ">
                    {[...Array(9)].map((_, index) => (
                        <button
                            key={index}
                            className={`img-slider-dot-btn  ${index+1 === current ? 'active' : ''}`}
                            aria-label={`View Slide ${index - 1}`}
                            onClick={() => handleDotClick(index)}
                        >
                            {index + 1 === current ?
                                <img src="./temtem.png" style={{width: '32px', height: '32px'}} alt="Active slide"/> :
                                <span aria-hidden="true">○</span>}
                        </button>
                    ))}
                </div>
                <span className="py-2 text-center text-sm text-muted-foreground">
                    Slide {current} of 9
                </span>
                <p className="graph-desc">
                    {/*show different text based on graph description*/}
                    {current === 1 && "These are the real time statistics of my steam player data by the hour for my most played titles.\n" +
                        "The data is sorted by the apis playtime_forever property and converted into a more readable format. Like for many of the charts on this page, the data will only be grabbed once per mount and on the relevant index to ensure consistent behaviour and animations for you to see.\n"}
                    {current === 2 &&
                        <span>
                            The following charts are based on this project I’ve done for my Data Visualization class retooled to work with react.
                            To get a better understanding of the storytelling behind the data, check out the
                            <br/>
                            <a href="https://observablehq.com/d/f64225eb78f856ba" target="_blank"
                               rel="noopener noreferrer">observable notebook</a>.
                            <br/>
                            This chart in particular bins the stat distribution of the monster battler game temtem to see how the game developers have balanced the game.
                        </span>

                    }
                    {current === 3 &&
                        <span>
                            The following charts are based on this project I’ve done for my Data Visualization class retooled to work with react.
                            To get a better understanding of the storytelling behind the data, check out the
                            <br/>
                            <a href="https://observablehq.com/d/f64225eb78f856ba" target="_blank"
                               rel="noopener noreferrer">observable notebook</a>.
                            <br/>
                            This chart uses the same stat data to tell a different story and paint how being numerically stronger does not translate in to actual viability. and what are the common ranges for certain tiers to fall under.
                        </span>

                    }
                    {current === 4 &&
                        <span>
                            The following charts are based on this project I’ve done for my Data Visualization class retooled to work with react.
                            To get a better understanding of the storytelling behind the data, check out the
                            <br/>
                            <a href="https://observablehq.com/d/f64225eb78f856ba" target="_blank"
                               rel="noopener noreferrer">observable notebook</a>.
                            <br/>
                            This bar chart explores another concept of viability by comparing a temtem defensive quality to their actual viablility. While there are rules set with how types affect one another the actual matrix and how each object derives its defensive from that matrix was done in this node project below where I handled the data collection and cleaning:
                        </span>
                    }
                    {current === 5 && "Line chart of example"}
                    {current === 7 &&
                        <span>
                            This chart is based on a project I’ve done for my Data Visualization class retooled to work with react.
                            To get a better understanding of the storytelling behind the data, check out the
                            <br/>
                            <a href="https://observablehq.com/d/e69f429c9d9e284e" target="_blank"
                               rel="noopener noreferrer">observable notebook</a>.
                            <br/>
                            It is meant to serve as a supplementary visualization to communicate the sense of scale a debately fraudulent company would use to communicate their effective impressions to shareholders via aggregation.
                        </span>
                    }
                    {current === 8 &&
                        <span>
                            This chart is based on a project I’ve done for my Data Visualization class retooled to work with react.
                            To get a better understanding of the storytelling behind the data, check out the
                            <br/>
                            <a href="https://observablehq.com/d/e69f429c9d9e284e" target="_blank"
                               rel="noopener noreferrer">observable notebook</a>.
                            <br/>
                            By visualizing the allocation of debt, captial and disposable income, we can see how the company is structured and how concerning it is they are accrewing more debt and gaining value only through various kinds of non-current intangible assets.
                        </span>
                    }
                    {current === 9 && "This is the end of the carousel. For more cool projects please head to: *Insert my homepage*."}
                </p>
            </div>
        </div>
    );
};

export default App;
