import {useEffect, useState} from 'react';
import Papa from 'papaparse';
import {Temtem} from "@/lib/temtem.ts";


export const useLineChartData = (currentIndex: number) => {
    const [data, setData] = useState<number[]>([10, 25, 70, 45, 60, 46, 44, 60, 32, 80, 40, 99]);

    // Function to add a new random data point
    const addDataPoint = () => {
        const newDataPoint = Math.floor(Math.random() * 90) + 1;
        // console.log("Current Index:", currentIndex); // Log the current index
        // console.log("Adding data point", newDataPoint);
        setData(prevData => [...prevData, newDataPoint]);
    };

    // Function to remove the first item if the data length exceeds 18
    const removeFirstItemWhen = () => {
        setData(prevData => {
            if (prevData.length > 18) {
                return prevData.slice(1);
            }
            return prevData;
        });
    };

    // useEffect to handle data updates
    useEffect(() => {
        if(currentIndex ==5) { // Only run the interval for the first n charts (make parameter for this)
            const intervalId = setInterval(() => {
                addDataPoint();
                setTimeout(() => {
                    removeFirstItemWhen();
                }, 1600); //make sure it is always less by sizeable amount
            }, 2600);
            //always clear up intervals
            return () => clearInterval(intervalId);
        }
    }, [currentIndex]); // Ensure this runs when data changes

    return { data };
};

// Function to fetch data from the steam API via proxy to avoid CORS issues
export const fetchSteamDataViaProxy = async () => {
    const apiKey = import.meta.env.VITE_STEAM_API_KEY; // Importing the API key from the environment variables
    const steamProfile = import.meta.env.VITE_STEAM_PROFILE;
    const steamApiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamProfile}&include_appinfo=true&include_played_free_games=true`;

    let url;
    if (import.meta.env.MODE === 'production') {
        const proxyUrl = 'https://corsproxy.io/?';
        url = proxyUrl + steamApiUrl;
    } else {
        console.log('development mode request');
        url = `/steam-api/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamProfile}&include_appinfo=true&include_played_free_games=true`;
    }

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
};


// Helper function to clean game data and convert playtime to hours
export const cleanGameData = (game: { [x: string]: number; }) => {
    const playtimeKeys = ['playtime_forever', 'playtime_windows_forever', 'playtime_mac_forever', 'playtime_linux_forever', 'playtime_deck_forever'];

    const cleanedGame = {...game};

    playtimeKeys.forEach(key => {
        cleanedGame[key] = game[key] / 60; // Convert playtime from minutes to hours
    });

    return cleanedGame;
};


export const useDonutChartData = (currentIndex:number) => {
    const [donutData, setDonutData] = useState([]);

    useEffect(() => {
        let isMounted = true; // Flag to prevent state updates after unmount

        const fetchData = async () => {
            const data = await fetchSteamDataViaProxy();
            if (isMounted) {
                //only sets data once due to mount check
                const cleanedData = data.response.games.map(cleanGameData);
                const filteredData = cleanedData.filter((game: { playtime_forever: number; }) => game.playtime_forever > 101);
                setDonutData(filteredData);
            }
        };

        //it's fine to refetch it everytime since it is a small w fast api
        if(currentIndex == 1) {
            fetchData().then(() => console.log("Donut Data arrived from API"));
        }

        return () => {
            isMounted = false; // Cleanup flag on unmounting
        };
    }, [currentIndex]);

    return donutData;
};

export const useTemtemChartData = (currentIndex: number) => {
    const [histogramData, setHistogramData] = useState<Temtem[]>([]);
    useEffect(() => {
        let isMounted = true; // Flag to prevent state updates after unmount

        const fetchDataAndParse = async () => {
            try {
                const response = await fetch('./temtemData.csv'); // Adjust the path as needed
                if (!response.ok) {
                    throw new Error(`HTTP error status: ${response.status}`);
                }
                const text = await response.text();
                Papa.parse<Temtem>(text, {
                    header: true,
                    complete: ({data}) => {
                        if (isMounted) {
                            //copy and paste in temtemData type later when pushed to github
                            setHistogramData(data);
                        }
                       // console.log("Parsed Data:", results.data);
                    },
                    error: (parseError: Error) => {
                        console.error("Error parsing CSV:", parseError);
                    }
                });
            } catch (error) {
                console.error("Error fetching or parsing CSV:", error);
            }
        };

        if(currentIndex == 2  || currentIndex == 3 || currentIndex == 4) {
            fetchDataAndParse().then(() => console.log("Histogram Data sourced from CSV"));
        }
        return () => {
            isMounted = false;
        };
    }, [currentIndex]);

    return histogramData;
};


type FinancialSheetChild = {
    name: string;
    value?: number;
    children?: FinancialSheetChild[];
};

type FinancialSheet = {
    name: string;
    children: FinancialSheetChild[];
};


export const FinancialSheetComponent = ( currentIndex : number) => {
    const [financialSheetData, setFinancialSheetData] = useState<FinancialSheet | null>(null);

    useEffect(() => {
        const prepareFinancialData = () => {
            if (currentIndex === 8) {
                const data = {
                    "name": "FinancialSheet",
                    "children": [
                        {
                            "name": "December 31, 2023",
                            "children": [
                                {
                                    "name": "Assets",
                                    "children": [
                                        {
                                            "name": "Current",
                                            "children": [
                                                { "name": "Cash", "value": 6851966 },
                                                { "name": "Trade and Other Receivables", "value": 31502732 },
                                                { "name": "Income Tax Receivable", "value": 31251 },
                                                { "name": "Prepaid Expenses", "value": 1820144 },
                                            ]
                                        },
                                        {
                                            "name": "Non-Current",
                                            "children": [
                                                { "name": "Property and Equipment", "value": 124640 },
                                                { "name": "Right of Use Assets", "value": 1441149 },
                                                { "name": "Investment in Associates and Joint Ventures", "value": 2888730 },
                                                { "name": "Long-Term Portion of Prepaid Expenses", "value": 182108 },
                                                { "name": "Intangible Assets", "value": 85421227 },
                                                { "name": "Goodwill", "value": 105868081 },
                                            ]
                                        }
                                    ]
                                },
                                {
                                    "name": "Liabilities and Shareholders' Equity",
                                    "children": [
                                        {
                                            "name": "Current Liabilities",
                                            "children": [
                                                { "name": "Accounts Payable and Accrued Liabilities", "value": 47101272 },
                                                { "name": "Contract Liabilities", "value": 6078950 },
                                                { "name": "Income Tax Payable", "value": 274924 },
                                                { "name": "Current Portion of Long-Term Debt", "value": 21888597 },
                                                { "name": "Current Portion of Deferred Payment Liability", "value": 82231 },
                                                { "name": "Current Portion of Lease Liabilities", "value": 740212 },
                                                { "name": "Current Portion of Other Long-Term Debt", "value": 9668 },
                                            ]
                                        },
                                        {
                                            "name": "Non-Current Liabilities",
                                            "children": [
                                                { "name": "Long-Term Portion of Deferred Payment Liability", "value": 2083262 },
                                                { "name": "Long-Term Portion of Lease Liabilities", "value": 938845 },
                                                { "name": "Other Long-Term Debt", "value": 140613 },
                                                { "name": "Deferred Tax Liability", "value": 14076780 },
                                            ]
                                        },
                                        {
                                            "name": "Shareholders' Equity",
                                            "children": [
                                                { "name": "Share Capital", "value": 444474076 },
                                                { "name": "Contributed Surplus", "value": 35877189 },
                                                { "name": "Accumulated Other Comprehensive Income", "value": 7201976 },
                                                { "name": "Deficit", "value": 344836567 },
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "name": "December 31, 2022",
                            "children": [
                                {
                                    "name": "Assets",
                                    "children": [
                                        {
                                            "name": "Current",
                                            "children": [
                                                { "name": "Cash", "value": 7415516 },
                                                { "name": "Trade and Other Receivables", "value": 37868107 },
                                                { "name": "Investments", "value": 125000 },
                                                { "name": "Loans Receivable", "value": 50935 },
                                                { "name": "Income Tax Receivable", "value": 367092 },
                                                { "name": "Prepaid Expenses", "value": 2017004 },
                                            ]
                                        },
                                        {
                                            "name": "Non-Current",
                                            "children": [
                                                { "name": "Property and Equipment", "value": 180621 },
                                                { "name": "Right of Use Assets", "value": 2099996 },
                                                { "name": "Investment in Associates and Joint Ventures", "value": 2450031 },
                                                { "name": "Long-Term Portion of Prepaid Expenses", "value": 279814 },
                                                { "name": "Intangible Assets", "value": 116967438 },
                                                { "name": "Goodwill", "value": 171615991 },
                                            ]
                                        }
                                    ]
                                },
                                {
                                    "name": "Liabilities and Shareholders' Equity",
                                    "children": [
                                        {
                                            "name": "Current Liabilities",
                                            "children": [
                                                { "name": "Accounts Payable and Accrued Liabilities", "value": 32823320 },
                                                { "name": "Contract Liabilities", "value": 5380378 },
                                                { "name": "Income Tax Payable", "value": 129485 },
                                                { "name": "Current Portion of Long-Term Debt", "value": 17431625 },
                                                { "name": "Current Portion of Deferred Payment Liability", "value": 2391863 },
                                                { "name": "Current Portion of Lease Liabilities", "value": 872429 },
                                                { "name": "Current Portion of Other Long-Term Debt", "value": 10891 },
                                            ]
                                        },
                                        {
                                            "name": "Non-Current Liabilities",
                                            "children": [
                                                { "name": "Long-Term Portion of Deferred Payment Liability", "value": 1451939 },
                                                { "name": "Long-Term Portion of Lease Liabilities", "value": 1478438 },
                                                { "name": "Other Long-Term Debt", "value": 144844 },
                                                { "name": "Deferred Tax Liability", "value": 24671326 },
                                            ]
                                        },
                                        {
                                            "name": "Shareholders' Equity",
                                            "children": [
                                                { "name": "Share Capital", "value": 442781376 },
                                                { "name": "Contributed Surplus", "value": 30402742 },
                                                { "name": "Accumulated Other Comprehensive Income", "value": 8629848 },
                                                { "name": "Deficit", "value": 227162959 },
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                setFinancialSheetData(data);
            }
        }

        prepareFinancialData();
    }, [currentIndex]);

    return financialSheetData;
};


export const BtcRealTimePrice = ({ currentIndex }: { currentIndex: number }) => {
    const [btcPrices, setBtcPrices] = useState<number[]>([]);

    useEffect(() => {
        let isMounted = true; // Flag to prevent state updates after unmount
        const fetchBtcPrice = async () => {
            try {
                 const response = await fetch(
                    import.meta.env.MODE === 'production'
                        ? 'https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD'
                        : '/btc'
                );                if (!response.ok) {
                    throw new Error(`HTTP error status: ${response.status}`);
                }
                const data = await response.json();
                const price = data.USD || null;
                if (isMounted && price !== null) {
                    // Check if the last price in the array is different from the new price
                    const lastPrice = btcPrices[btcPrices.length - 1];
                    if (lastPrice === undefined || parseFloat(String(lastPrice)) !== parseFloat(price)) {
                        setBtcPrices(prevPrices => [...prevPrices, parseFloat(price)]);
                        // console.log("Fetched BTC Price:", price);
                    }
                }
            } catch (error) {
                console.error("Error fetching BTC price:", error);
            }
        };

        // Fetch the price immediately
        fetchBtcPrice();

        // Set up the interval to fetch the price every 2600ms
        const intervalId: NodeJS.Timeout | undefined = setInterval(fetchBtcPrice, 2600);

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
            isMounted = false;
        };
    }, [currentIndex, btcPrices]);

    // Remove 5 items from the front of btcPrices when length > 30
    if (btcPrices.length > 30) {
        setBtcPrices(prevPrices => prevPrices.slice(5));
    }

    return btcPrices;
};


//force direct graph data manually collected due to youtube partner program and analytics api restrictions
export const ytData = ({
        "nodes": [
            {
                "id": 0,
                "name": "Omnia-Media",
                // "value": //Value will be determined by Children
            },
            {
                "id": 1,
                "name": "Sidemen",
                "maxWeeklyRevenue": 68300,
                "monthlyViewData": [
                    {"date": "May 2021", "views": 2550575125},
                    {"date": "June 2021", "views": 2656641927},
                    {"date": "July 2021", "views": 2785448126},
                    {"date": "August 2021", "views": 2920117246},
                    {"date": "September 2021", "views": 3054054389},
                    {"date": "October 2021", "views": 3152005028},
                    {"date": "November 2021", "views": 3252979900},
                    {"date": "December 2021", "views": 3344556481},
                    {"date": "January 2022", "views": 3451302093},
                    {"date": "February 2022", "views": 3560085251},
                    {"date": "March 2022", "views": 3648423647},
                    {"date": "April 2022", "views": 3725033035},
                    {"date": "May 2022", "views": 3810468375},
                    {"date": "June 2022", "views": 3909044442},
                    {"date": "July 2022", "views": 4022657508},
                    {"date": "August 2022", "views": 4159505358},
                    {"date": "September 2022", "views": 4285926957},
                    {"date": "October 2022", "views": 4413656275},
                    {"date": "November 2022", "views": 4528365316},
                    {"date": "December 2022", "views": 4618793027},
                    {"date": "January 2023", "views": 4699989019},
                    {"date": "February 2023", "views": 4816070441},
                    {"date": "March 2023", "views": 4920720791},
                    {"date": "April 2023", "views": 5004489792},
                    {"date": "May 2023", "views": 5064226324},
                    {"date": "June 2023", "views": 5124608106},
                    {"date": "July 2023", "views": 5210730210},
                    {"date": "August 2023", "views": 5300605869},
                    {"date": "September 2023", "views": 5395252794},
                    {"date": "October 2023", "views": 5508278331},
                    {"date": "November 2023", "views": 5637232216},
                    {"date": "December 2023", "views": 5714358477},
                    {"date": "January 2024", "views": 5786027687},
                    {"date": "February 2024", "views": 5880525887},
                    {"date": "March 2024", "views": 5955716923}
                ]
            },
            {
                "id": 2,
                "name": "Misfits",
                "maxWeeklyRevenue": 828,
                "monthlyViewData": [
                    {"date": "May 2021", "views": 72224294},
                    {"date": "June 2021", "views": 73847957},
                    {"date": "July 2021", "views": 77556745},
                    {"date": "August 2021", "views": 80778211},
                    {"date": "September 2021", "views": 82055420},
                    {"date": "October 2021", "views": 82960241},
                    {"date": "November 2021", "views": 83668358},
                    {"date": "December 2021", "views": 84239483},
                    {"date": "January 2022", "views": 84936670},
                    {"date": "February 2022", "views": 85439357},
                    {"date": "March 2022", "views": 85684986},
                    {"date": "April 2022", "views": 86360919},
                    {"date": "May 2022", "views": 86874609},
                    {"date": "June 2022", "views": 87270753},
                    {"date": "July 2022", "views": 87678823},
                    {"date": "August 2022", "views": 88200892},
                    {"date": "September 2022", "views": 90601768},
                    {"date": "October 2022", "views": 92784282},
                    {"date": "November 2022", "views": 95370701},
                    {"date": "December 2022", "views": 98002958},
                    {"date": "January 2023", "views": 98468983},
                    {"date": "February 2023", "views": 98869036},
                    {"date": "March 2023", "views": 100212501},
                    {"date": "April 2023", "views": 100630082},
                    {"date": "May 2023", "views": 101246284},
                    {"date": "June 2023", "views": 101667631},
                    {"date": "July 2023", "views": 102627091},
                    {"date": "August 2023", "views": 102969146},
                    {"date": "September 2023", "views": 103388850},
                    {"date": "October 2023", "views": 103764962},
                    {"date": "November 2023", "views": 104068337},
                    {"date": "December 2023", "views": 104317342},
                    {"date": "January 2024", "views": 104629884},
                    {"date": "February 2024", "views": 104894995},
                    {"date": "March 2024", "views": 105158680}
                ]
            },
            {
                "id": 3,
                "name": "XQC (Youtube Data)",
                "maxWeeklyRevenue":13300,
                "monthlyViewData": [
                    {"date": "May 2021", "views": 702326281},
                    {"date": "June 2021", "views": 742698874},
                    {"date": "July 2021", "views": 778350855},
                    {"date": "August 2021", "views": 806590735},
                    {"date": "September 2021", "views": 843184147},
                    {"date": "October 2021", "views": 875112037},
                    {"date": "November 2021", "views": 915474689},
                    {"date": "December 2021", "views": 952891798},
                    {"date": "January 2022", "views": 985081490},
                    {"date": "February 2022", "views": 1029772408},
                    {"date": "March 2022", "views": 1062653335},
                    {"date": "April 2022", "views": 1096453998},
                    {"date": "May 2022", "views": 1138823791},
                    {"date": "June 2022", "views": 1175702723},
                    {"date": "July 2022", "views": 1205666435},
                    {"date": "August 2022", "views": 1233656554},
                    {"date": "September 2022", "views": 1261862235},
                    {"date": "October 2022", "views": 1292538687},
                    {"date": "November 2022", "views": 1327471825},
                    {"date": "December 2022", "views": 1356061845},
                    {"date": "January 2023", "views": 1383231301},
                    {"date": "February 2023", "views": 1409971182},
                    {"date": "March 2023", "views": 1435976627},
                    {"date": "April 2023", "views": 1465991163},
                    {"date": "May 2023", "views": 1494965269},
                    {"date": "June 2023", "views": 1516511220},
                    {"date": "July 2023", "views": 1546217313},
                    {"date": "August 2023", "views": 1574717791},
                    {"date": "September 2023", "views": 1591661334},
                    {"date": "October 2023", "views": 1602813206},
                    {"date": "November 2023", "views": 1615384874},
                    {"date": "December 2023", "views": 1477704895},
                    {"date": "January 2024", "views": 1520122386},
                    {"date": "February 2024", "views": 1530663606},
                    {"date": "March 2024", "views": 1540380103}
                ]
            },
            {
                "id": 4,
                "name": "Cold Ones",
                "maxWeeklyRevenue": 6700,
                "monthlyViewData": [
                    {"date": "May 2021", "views": 85711748},
                    {"date": "June 2021", "views": 101478687},
                    {"date": "July 2021", "views": 111611483},
                    {"date": "August 2021", "views": 123729271},
                    {"date": "September 2021", "views": 134445648},
                    {"date": "October 2021", "views": 143352334},
                    {"date": "November 2021", "views": 156330641},
                    {"date": "December 2021", "views": 165554236},
                    {"date": "January 2022", "views": 175217087},
                    {"date": "February 2022", "views": 184960662},
                    {"date": "March 2022", "views": 190928588},
                    {"date": "April 2022", "views": 200788192},
                    {"date": "May 2022", "views": 202856118},
                    {"date": "June 2022", "views": 211133638},
                    {"date": "July 2022", "views": 218971533},
                    {"date": "August 2022", "views": 236121515},
                    {"date": "September 2022", "views": 246048220},
                    {"date": "October 2022", "views": 253359829},
                    {"date": "November 2022", "views": 262287831},
                    {"date": "December 2022", "views": 273667092},
                    {"date": "January 2023", "views": 286847172},
                    {"date": "February 2023", "views": 297038847},
                    {"date": "March 2023", "views": 302444890},
                    {"date": "April 2023", "views": 309389206},
                    {"date": "May 2023", "views": 316317620},
                    {"date": "June 2023", "views": 325077928},
                    {"date": "July 2023", "views": 334251067},
                    {"date": "August 2023", "views": 338342378},
                    {"date": "September 2023", "views": 349253127},
                    {"date": "October 2023", "views": 358062957},
                    {"date": "November 2023", "views": 364432719},
                    {"date": "December 2023", "views": 369290529},
                    {"date": "January 2024", "views": 381069231},
                    {"date": "February 2024", "views": 387427852},
                    {"date": "March 2024", "views": 394883987}
                ]
            },
            {
                "id": 5,
                "name": "Jericho",
                "maxWeeklyRevenue": 382,
                "monthlyViewData":[
                    {"date": "May 2021", "views": 209102116},
                    {"date": "June 2021", "views": 210261647},
                    {"date": "July 2021", "views": 211278205},
                    {"date": "August 2021", "views": 212271917},
                    {"date": "September 2021", "views": 213010549},
                    {"date": "October 2021", "views": 213699757},
                    {"date": "November 2021", "views": 214586803},
                    {"date": "December 2021", "views": 215354492},
                    {"date": "January 2022", "views": 216023359},
                    {"date": "February 2022", "views": 216561536},
                    {"date": "March 2022", "views": 216347936},
                    {"date": "April 2022", "views": 217193345},
                    {"date": "May 2022", "views": 217734383},
                    {"date": "June 2022", "views": 218407077},
                    {"date": "July 2022", "views": 218930403},
                    {"date": "August 2022", "views": 219280191},
                    {"date": "September 2022", "views": 219872682},
                    {"date": "October 2022", "views": 220484789},
                    {"date": "November 2022", "views": 220908418},
                    {"date": "December 2022", "views": 221643898},
                    {"date": "January 2023", "views": 222108707},
                    {"date": "February 2023", "views": 322160628},
                    {"date": "March 2023", "views": 222526209},
                    {"date": "April 2023", "views": 223460348},
                    {"date": "May 2023", "views": 224165512},
                    {"date": "June 2023", "views": 224717892},
                    {"date": "July 2023", "views": 225428761},
                    {"date": "August 2023", "views": 225941922},
                    {"date": "September 2023", "views": 226455896},
                    {"date": "October 2023", "views": 227070371},
                    {"date": "November 2023", "views": 227594316},
                    {"date": "December 2023", "views": 227948027},
                    {"date": "January 2024", "views": 228340305},
                    {"date": "February 2024", "views": 228857151},
                    {"date": "March 2024", "views": 229295981}
                ]
            },
            {
                "id": 6,
                "name": "Mess Yourself",
                "maxWeeklyRevenue": 2300,
                "monthlyViewData": [
                    {"date": "May 2021", "views": 2381646602},
                    {"date": "June 2021", "views": 2398115009},
                    {"date": "July 2021", "views": 2418786910},
                    {"date": "August 2021", "views": 2431308922},
                    {"date": "September 2021", "views": 2434120667},
                    {"date": "October 2021", "views": 2437900493},
                    {"date": "November 2021", "views": 2451054663},
                    {"date": "December 2021", "views": 2459055983},
                    {"date": "January 2022", "views": 2470753931},
                    {"date": "February 2022", "views": 2484701936},
                    {"date": "March 2022", "views": 24948244843},
                    {"date": "April 2022", "views": 2504964498},
                    {"date": "May 2022", "views": 2514779465},
                    {"date": "June 2022", "views": 2523940548},
                    {"date": "July 2022", "views": 2496918246},
                    {"date": "August 2022", "views": 2485281907},
                    {"date": "September 2022", "views": 2492239415},
                    {"date": "October 2022", "views": 2498070362},
                    {"date": "November 2022", "views": 2503882661},
                    {"date": "December 2022", "views": 2509158568},
                    {"date": "January 2023", "views": 2514683508},
                    {"date": "February 2023", "views": 2519434278},
                    {"date": "March 2023", "views": 2524419837},
                    {"date": "April 2023", "views": 2528361743},
                    {"date": "May 2023", "views": 2532847225},
                    {"date": "June 2023", "views": 2536571279},
                    {"date": "July 2023", "views": 2540867427},
                    {"date": "August 2023", "views": 2544197371},
                    {"date": "September 2023", "views": 2548319458},
                    {"date": "October 2023", "views": 2552945348},
                    {"date": "November 2023", "views": 2556140606},
                    {"date": "December 2023", "views": 2558697410},
                    {"date": "January 2024", "views": 2561212657},
                    {"date": "February 2024", "views": 2563757901},
                    {"date": "March 2024", "views": 2565881882}
                ]
            },
            {
                "id": 7,
                "name": "Mystic 7",
                "maxWeeklyRevenue": 9400,
                "monthlyViewData": [
                    {"date": "May 2021", "views": 611577979},
                    {"date": "June 2021", "views": 615345490},
                    {"date": "July 2021", "views": 619217489},
                    {"date": "August 2021", "views": 623323628},
                    {"date": "September 2021", "views": 626715564},
                    {"date": "October 2021", "views": 629499385},
                    {"date": "November 2021", "views": 631629344},
                    {"date": "December 2021", "views": 632609544},
                    {"date": "January 2022", "views": 635583483},
                    {"date": "February 2022", "views": 638246834},
                    {"date": "March 2022", "views": 640733509},
                    {"date": "April 2022", "views": 644872696},
                    {"date": "May 2022", "views": 648526054},
                    {"date": "June 2022", "views": 655338162},
                    {"date": "July 2022", "views": 665828654},
                    {"date": "August 2022", "views": 677142978},
                    {"date": "September 2022", "views": 687915631},
                    {"date": "October 2022", "views": 699646929},
                    {"date": "November 2022", "views": 711355004},
                    {"date": "December 2022", "views": 723369450},
                    {"date": "January 2023", "views": 737934216},
                    {"date": "February 2023", "views": 767610185},
                    {"date": "March 2023", "views": 773767491},
                    {"date": "April 2023", "views": 800963278},
                    {"date": "May 2023", "views": 821594642},
                    {"date": "June 2023", "views": 841299820},
                    {"date": "July 2023", "views": 866403947},
                    {"date": "August 2023", "views": 889046979},
                    {"date": "September 2023", "views": 912736841},
                    {"date": "October 2023", "views": 936850966},
                    {"date": "November 2023", "views": 958602285},
                    {"date": "December 2023", "views": 976417833},
                    {"date": "January 2024", "views": 990009554},
                    {"date": "February 2024", "views": 1002294359},
                    {"date": "March 2024", "views": 1016342907}
                ]
            },
            {
                "id": 8,
                "name": "The Completionist",
                "maxWeeklyRevenue": 539,
                "monthlyViewData": [
                    {"date": "May 2021", "views": 263700984},
                    {"date": "June 2021", "views": 266938944},
                    {"date": "July 2021", "views": 270268685},
                    {"date": "August 2021", "views": 273744068},
                    {"date": "September 2021", "views": 276589333},
                    {"date": "October 2021", "views": 279124801},
                    {"date": "November 2021", "views": 251578390},
                    {"date": "December 2021", "views": 283757581},
                    {"date": "January 2022", "views": 285742533},
                    {"date": "February 2022", "views": 288215363},
                    {"date": "March 2022", "views": 290625196},
                    {"date": "April 2022", "views": 291450629},
                    {"date": "May 2022", "views": 293700568},
                    {"date": "June 2022", "views": 295795034},
                    {"date": "July 2022", "views": 298324105},
                    {"date": "August 2022", "views": 300710451},
                    {"date": "September 2022", "views": 303441462},
                    {"date": "October 2022", "views": 304972836},
                    {"date": "November 2022", "views": 306881857},
                    {"date": "December 2022", "views": 309584628},
                    {"date": "January 2023", "views": 311965620},
                    {"date": "February 2023", "views": 314965300},
                    {"date": "March 2023", "views": 316979935},
                    {"date": "April 2023", "views": 320283088},
                    {"date": "May 2023", "views": 322905346},
                    {"date": "June 2023", "views": 325325213},
                    {"date": "July 2023", "views": 326988086},
                    {"date": "August 2023", "views": 329638472},
                    {"date": "September 2023", "views": 331341733},
                    {"date": "October 2023", "views": 333101674},
                    {"date": "November 2023", "views": 334759191},
                    {"date": "December 2023", "views": 336077560},
                    {"date": "January 2024", "views": 337596131},
                    {"date": "February 2024", "views": 338783619},
                    {"date": "March 2024", "views": 339493800}
                ]
            },
            {
                "id": 9,
                "name": "Tyler1 (Youtube Data)",
                "maxWeeklyRevenue": 597,
                "monthlyViewData": [
                    {"date": "May 2021", "views": 427677864},
                    {"date": "June 2021", "views": 435304484},
                    {"date": "July 2021", "views": 442235137},
                    {"date": "August 2021", "views": 450009967},
                    {"date": "September 2021", "views": 456121169},
                    {"date": "October 2021", "views": 463635164},
                    {"date": "November 2021", "views": 467916960},
                    {"date": "December 2021", "views": 469271367},
                    {"date": "January 2022", "views": 475962440},
                    {"date": "February 2022", "views": 485241041},
                    {"date": "March 2022", "views": 491092330},
                    {"date": "April 2022", "views": 495919004},
                    {"date": "May 2022", "views": 500660030},
                    {"date": "June 2022", "views": 509194405},
                    {"date": "July 2022", "views": 513151583},
                    {"date": "August 2022", "views": 517670712},
                    {"date": "September 2022", "views": 521527662},
                    {"date": "October 2022", "views": 525498133},
                    {"date": "November 2022", "views": 528438423},
                    {"date": "December 2022", "views": 531147958},
                    {"date": "January 2023", "views": 533858993},
                    {"date": "February 2023", "views": 536921786},
                    {"date": "March 2023", "views": 539764870},
                    {"date": "April 2023", "views": 543673400},
                    {"date": "May 2023", "views": 546099982},
                    {"date": "June 2023", "views": 548741225},
                    {"date": "July 2023", "views": 551344509},
                    {"date": "August 2023", "views": 555560947},
                    {"date": "September 2023", "views": 558211521},
                    {"date": "October 2023", "views": 560384809},
                    {"date": "November 2023", "views": 561332841},
                    {"date": "December 2023", "views": 564023556},
                    {"date": "January 2024", "views": 567504912},
                    {"date": "February 2024", "views": 572381821},
                    {"date": "March 2024", "views": 576950631}
                ]
            },
            {
                "id": 10,
                "name": "Trick2G",
                "maxWeeklyRevenue": 1300,
                "monthlyViewData": [
                    {"date": "May 2021", "views": 493966201},
                    {"date": "June 2021", "views": 498207617},
                    {"date": "July 2021", "views": 502348648},
                    {"date": "August 2021", "views": 506957817},
                    {"date": "September 2021", "views": 509861064},
                    {"date": "October 2021", "views": 512763425},
                    {"date": "November 2021", "views": 518792916},
                    {"date": "December 2021", "views": 524277728},
                    {"date": "January 2022", "views": 527744569},
                    {"date": "February 2022", "views": 532451158},
                    {"date": "March 2022", "views": 535845038},
                    {"date": "April 2022", "views": 540232003},
                    {"date": "May 2022", "views": 543426997},
                    {"date": "June 2022", "views": 546646015},
                    {"date": "July 2022", "views": 551133192},
                    {"date": "August 2022", "views": 553617055},
                    {"date": "September 2022", "views": 560526517},
                    {"date": "October 2022", "views": 564336209},
                    {"date": "November 2022", "views": 567654462},
                    {"date": "December 2022", "views": 571343716},
                    {"date": "January 2023", "views": 574375783},
                    {"date": "February 2023", "views": 577474589},
                    {"date": "March 2023", "views": 579723850},
                    {"date": "April 2023", "views": 582012440},
                    {"date": "May 2023", "views": 583902869},
                    {"date": "June 2023", "views": 586384659},
                    {"date": "July 2023", "views": 588769388},
                    {"date": "August 2023", "views": 590916541},
                    {"date": "September 2023", "views": 593189579},
                    {"date": "October 2023", "views": 595756381},
                    {"date": "November 2023", "views": 597978791},
                    {"date": "December 2023", "views": 598459170},
                    {"date": "January 2024", "views": 599987601},
                    {"date": "February 2024", "views": 602024195},
                    {"date": "March 2024", "views": 603947389}
                ]
            },
            {
                "id": 11,
                "name": "BunnyFuFuu",
                "maxWeeklyRevenue": 94,
                "monthlyViewData": [
                    {"date": "May 2021", "views": 556063935},
                    {"date": "June 2021", "views": 557946634},
                    {"date": "July 2021", "views": 559548824},
                    {"date": "August 2021", "views": 561305088},
                    {"date": "September 2021", "views": 562544330},
                    {"date": "October 2021", "views": 564451631},
                    {"date": "November 2021", "views": 566456679},
                    {"date": "December 2021", "views": 567760265},
                    {"date": "January 2022", "views": 568706280},
                    {"date": "February 2022", "views": 570059516},
                    {"date": "March 2022", "views": 571602167},
                    {"date": "April 2022", "views": 572747967},
                    {"date": "May 2022", "views": 573724679},
                    {"date": "June 2022", "views": 575476981},
                    {"date": "July 2022", "views": 576963422},
                    {"date": "August 2022", "views": 577671439},
                    {"date": "September 2022", "views": 579689355},
                    {"date": "October 2022", "views": 579524785},
                    {"date": "November 2022", "views": 580826354},
                    {"date": "December 2022", "views": 581739971},
                    {"date": "January 2023", "views": 582407581},
                    {"date": "February 2023", "views": 537623790},
                    {"date": "March 2023", "views": 537991357},
                    {"date": "April 2023", "views": 537977088},
                    {"date": "May 2023", "views": 530090405},
                    {"date": "June 2023", "views": 530193673},
                    {"date": "July 2023", "views": 530296871},
                    {"date": "August 2023", "views": 538447971},
                    {"date": "September 2023", "views": 538573984},
                    {"date": "October 2023", "views": 538647387},
                    {"date": "November 2023", "views": 538713121},
                    {"date": "December 2023", "views": 538777719},
                    {"date": "January 2024", "views": 538892356},
                    {"date": "February 2024", "views": 538990961},
                    {"date": "March 2024", "views": 539631436}
                ]
            },
            {
                "id": 12,
                "name": "FNACTIC",
                "maxWeeklyRevenue": 1100,
                "monthlyViewData": [
                    {"date": "May 2021", "views": 92847057},
                    {"date": "June 2021", "views": 93694873},
                    {"date": "July 2021", "views": 94748063},
                    {"date": "August 2021", "views": 96654174},
                    {"date": "September 2021", "views": 98352399},
                    {"date": "October 2021", "views": 99822752},
                    {"date": "November 2021", "views": 101138354},
                    {"date": "December 2021", "views": 101547166},
                    {"date": "January 2022", "views": 101873439},
                    {"date": "February 2022", "views": 102423132},
                    {"date": "March 2022", "views": 103522836},
                    {"date": "April 2022", "views": 104470550},
                    {"date": "May 2022", "views": 104992466},
                    {"date": "June 2022", "views": 105207505},
                    {"date": "July 2022", "views": 105586055},
                    {"date": "August 2022", "views": 106128930},
                    {"date": "September 2022", "views": 108332855},
                    {"date": "October 2022", "views": 109341089},
                    {"date": "November 2022", "views": 110338996},
                    {"date": "December 2022", "views": 110560941},
                    {"date": "January 2023", "views": 111244239},
                    {"date": "February 2023", "views": 111616552},
                    {"date": "March 2023", "views": 112344653},
                    {"date": "April 2023", "views": 114127854},
                    {"date": "May 2023", "views": 116284685},
                    {"date": "June 2023", "views": 116758160},
                    {"date": "July 2023", "views": 117524532},
                    {"date": "August 2023", "views": 118461018},
                    {"date": "September 2023", "views": 118925708},
                    {"date": "October 2023", "views": 120158342},
                    {"date": "November 2023", "views": 121328230},
                    {"date": "December 2023", "views": 122102653},
                    {"date": "January 2024", "views": 122447551},
                    {"date": "February 2024", "views": 124571883},
                    {"date": "March 2024", "views": 127930750}
                ]
            },

        ],
        "edges": [
            {
                "source": 0, // Central Node
                "target": 1  // Connects to Node A
            },
            {
                "source": 0, // Central Node
                "target": 2  // Connects to Node B
            },
            {
                "source": 0, // Central Node
                "target": 3  // Connects to Node C
            },
            {
                "source": 0, // Central Node
                "target": 4  // Connects to Node D
            },
            {
                "source": 0,
                "target": 5
            },
            {
                "source": 0,
                "target": 6
            },
            {
                "source": 0,
                "target": 7
            },
            {
                "source": 0,
                "target": 8
            },
            {
                "source": 0,
                "target": 9
            },
            {
                "source": 0,
                "target": 10
            },
            {
                "source": 0,
                "target": 11
            },
            {
                "source": 0,
                "target": 12
            },

        ]
    });
