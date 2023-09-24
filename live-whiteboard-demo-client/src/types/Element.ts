type LineType = "simple" | "dashed" | "dotted"
type Arrows = false | "end" | "both"

type Point = {
    x: number
    y: number
}

type Line = {
    name: "line"
    id: string
    start: Point
    end: Point
    lineType: LineType
    lineWidth: number
    color: string
    arrows: Arrows
}

type Rectangle = {
    name: "rectangle"
    id: string
    start: Point
    end: Point
    lineType: LineType
    lineWidth: number
    color: string
    fill: boolean
}

type Ellipse = {
    name: "ellipse"
    id: string
    center: Point
    radiusX: number
    radiusY: number
    lineType: LineType
    lineWidth: number
    color: string
    fill: boolean
}

type Stroke = {
    name: "stroke"
    id: string
    points: Array<Point>
    lineType: LineType
    lineWidth: number
    color: string
}

type Element = Line | Rectangle | Ellipse | Stroke

export type {
    LineType,
    Arrows,
    Point,
    Line,
    Rectangle,
    Ellipse,
    Stroke,
    Element
}