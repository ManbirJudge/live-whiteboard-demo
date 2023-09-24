import BoundingBox from "../types/BoundingBox"
import { Element, Ellipse, Stroke, Line, Point, Rectangle } from "../types/Element"
import { pointInsideBox } from "./Utils"

function calcBoundingBox(element: Element): BoundingBox {
    switch (element.name) {
        case "line":
            return calcBoundingBoxLine(element)
        case "rectangle":
            return calcBoundingBoxRect(element)
        case "ellipse":
            return calcBoundingBoxEllipse(element)
        case "stroke":
            return calcBoundingBoxStroke(element)
    }
}

function calcBoundingBoxLine(line: Line): BoundingBox {
    return {
        start: {
            x: Math.min(line.start.x, line.end.x),
            y: Math.min(line.start.y, line.end.y),
        },
        end: {
            x: Math.max(line.start.x, line.end.x),
            y: Math.max(line.start.y, line.end.y),
        }
    }
}
function calcBoundingBoxRect(rect: Rectangle): BoundingBox {
    return {
        start: {
            x: Math.min(rect.start.x, rect.end.x),
            y: Math.min(rect.start.y, rect.end.y),
        },
        end: {
            x: Math.max(rect.start.x, rect.end.x),
            y: Math.max(rect.start.y, rect.end.y),
        }
    }
}
function calcBoundingBoxEllipse(ellipse: Ellipse): BoundingBox {
    return {
        start: {
            x: ellipse.center.x - ellipse.radiusX,
            y: ellipse.center.y - ellipse.radiusY
        },
        end: {
            x: ellipse.center.x + ellipse.radiusX,
            y: ellipse.center.y + ellipse.radiusY
        }
    }
}

function calcBoundingBoxStroke(stroke: Stroke): BoundingBox {
    return calcBoundingBoxStrokePoints(stroke.points)
}

function calcBoundingBoxStrokePoints(points: Array<Point>): BoundingBox {
    let sx: number, sy: number, ex: number, ey: number

    sx = screen.width
    sy = screen.height
    ex = ey = 0

    points.forEach(point => {
        if (point.x < sx)
            sx = point.x
        if (point.y < sy)
            sy = point.y
        if (point.x > ex)
            ex = point.x
        if (point.y > ey)
            ey = point.y
    })

    return {
        start: { x: sx, y: sy },
        end: { x: ex, y: ey }
    }

}

const pointInsideBoundingBox = pointInsideBox

export {
    calcBoundingBox,
    calcBoundingBoxLine,
    calcBoundingBoxRect,
    calcBoundingBoxEllipse,
    calcBoundingBoxStroke,
    calcBoundingBoxStrokePoints,
    pointInsideBoundingBox
}