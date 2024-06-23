import * as React from "react"
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
    opts?: CarouselOptions
    plugins?: CarouselPlugin
    orientation?: "horizontal" | "vertical"
    setApi?: (api: CarouselApi | null) => void
    // setApi?: (api: CarouselApi ) => (value: (((prevState: null) => null) | null)) => void
}

type CarouselContextProps = {
    carouselRef: ReturnType<typeof useEmblaCarousel>[0]
    api: CarouselApi
    scrollPrev: () => void
    scrollNext: () => void
    canScrollPrev: boolean
    canScrollNext: boolean
    isScrolling: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

const useCarousel = () => {
    const context = React.useContext(CarouselContext)
    if (!context) {
        throw new Error("useCarousel must be used within a <Carousel />")
    }
    return context
};

const Carousel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & CarouselProps>(
    ({ orientation = "horizontal", opts, setApi, plugins, className, children, ...props }, ref) => {
        const [carouselRef, api] = useEmblaCarousel(
            {
                ...opts,
                dragFree: true,
                axis: orientation === "horizontal" ? "x" : "y",
            },
            plugins
        )
        const [canScrollPrev, setCanScrollPrev] = React.useState(false)
        const [canScrollNext, setCanScrollNext] = React.useState(false)
        const [isScrolling, setIsScrolling] = React.useState(false)

        const onSelect = React.useCallback((api: CarouselApi) => {
            if (!api) return
            setCanScrollPrev(api.canScrollPrev())
            setCanScrollNext(api.canScrollNext())
        }, [])

        const scrollPrev = React.useCallback(() => {
            if (api) {
                setIsScrolling(true)
                api.scrollPrev()
                setTimeout(() => setIsScrolling(false), 1000)  // Adjust duration to match the transition duration
            }
        }, [api])

        const scrollNext = React.useCallback(() => {
            if (api) {
                setIsScrolling(true)
                api.scrollNext()
                setTimeout(() => setIsScrolling(false), 1000)  // Adjust duration to match the transition duration
            }
        }, [api])

        const handleKeyDown = React.useCallback(
            (event: React.KeyboardEvent<HTMLDivElement>) => {
                if (event.key === "ArrowLeft") {
                    event.preventDefault()
                    scrollPrev()
                } else if (event.key === "ArrowRight") {
                    event.preventDefault()
                    scrollNext()
                }
            },
            [scrollPrev, scrollNext]
        )

        React.useEffect(() => {
            if (!api || !setApi) return
            setApi(api)
        }, [api, setApi])

        React.useEffect(() => {
            if (!api) return
            onSelect(api)
            api.on("reInit", onSelect)
            api.on("select", onSelect)
            return () => {
                api?.off("select", onSelect)
            }
        }, [api, onSelect])

        return (
            <CarouselContext.Provider
                value={{
                    carouselRef,
                    api: api,
                    opts,
                    orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
                    scrollPrev,
                    scrollNext,
                    canScrollPrev,
                    canScrollNext,
                    isScrolling,
                }}
            >
                <div
                    ref={ref}
                    onKeyDownCapture={handleKeyDown}
                    className={cn("relative", className)}
                    role="region"
                    aria-roledescription="carousel"
                    {...props}
                >
                    {children}
                </div>
            </CarouselContext.Provider>
        )
    }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
    const { carouselRef, orientation, isScrolling } = useCarousel()
    return (
        <div ref={carouselRef} className="overflow-hidden max-w-full h-[26rem]  carousel-spacer:h-[40rem]  mb-4 ">
            <div
                ref={ref}
                className={cn(
                    //GOT IT also ty p-0
                    isScrolling ? "p-full duration-500" : "p-[.019rem] duration-1050",
                    "flex gap-[32rem] transition-transform pb-0 ",
                    orientation === "horizontal" ? "flex-row" : "flex-col",
                    className
                )}
                {...props}
            />
        </div>
    )
})
CarouselContent.displayName = "CarouselContent"


//changes including modifying the carousel content and item to allow for better resizing by using gap to reduce flicker
//for each svg element which also required tweaking padding of content and animation durations
//tweaked to better handle consistent size of the carousel items as well



const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
    const { orientation, isScrolling } = useCarousel()
    return (
        <div
            ref={ref}
            role="group"
            aria-roledescription="slide"
            className={cn(
                "shrink-0 grow-0 basis-full transition-all p-0 h-[26rem] carousel-spacer:h-[40rem]",
                isScrolling ? "animate-size-change" : "",
                orientation === "horizontal" ? "w-full" : "h-full",
                className
            )}
            {...props}
        />
    )
})
CarouselItem.displayName = "CarouselItem"


const CarouselPrevious = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollPrev, canScrollPrev } = useCarousel()
    return (
        <Button
            ref={ref}
            variant={variant}
            size={size}
            className={cn(
                "absolute z-10 h-8 w-8 rounded-full",
                orientation === "horizontal"
                    ? "-left-4 top-1/2 transform -translate-y-1/2"
                    : "-top-4 left-1/2 transform -translate-x-1/2 rotate-90",
                className
            )}
            disabled={!canScrollPrev}
            onClick={scrollPrev}
            {...props}
        >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Previous slide</span>
        </Button>
    )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollNext, canScrollNext } = useCarousel()
    return (
        <Button
            ref={ref}
            variant={variant}
            size={size}
            className={cn(
                "absolute z-10 h-8 w-8 rounded-full",
                orientation === "horizontal"
                    ? "-right-4 top-1/2 transform -translate-y-1/2"
                    : "-bottom-4 left-1/2 transform -translate-x-1/2 rotate-90",
                className
            )}
            disabled={!canScrollNext}
            onClick={scrollNext}
            {...props}
        >
            <ArrowRight className="h-4 w-4" />
            <span className="sr-only">Next slide</span>
        </Button>
    )
})
CarouselNext.displayName = "CarouselNext"

export {
    type CarouselApi,
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
}
