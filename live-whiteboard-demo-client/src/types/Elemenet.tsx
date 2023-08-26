type LineType = "simple" | "dashed" | "dotted"
type Arrows = "no" | "end" | "both"

type Point = {
    x: number
    y: number
}

type Line = {
    name: "line"

    start: Point
    end: Point
    type: LineType
    width: number
    color: string
    arrows: Arrows
}

type Rectangle = {
    name: "rectangle"

    start: Point
    end: Point
    lineType: LineType
    lineWidth: number
    color: string
    fill: boolean
}

type Ellipse = {
    name: "ellipse"

    centre: Point
    radiusX: number
    radiusY: number
    lineType: LineType
    lineWidth: number
    color: string
    fill: boolean
}

type Free = {
    name: "free"

    points: Array<Point>
    lineType: LineType
    lineWidth: number
    color: string
}

type Element = Line | Rectangle | Ellipse | Free

export type {
    LineType,
    Arrows,
    Point,
    Line,
    Rectangle,
    Ellipse,
    Free,
    Element
}