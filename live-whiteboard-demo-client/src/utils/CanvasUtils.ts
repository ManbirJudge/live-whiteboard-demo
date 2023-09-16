import BoundingBox from "../types/BoundingBox"
import { Point, LineType, Element, Arrows } from "../types/Element"

const LINE_ARROW_RAY_LENGTH = 15

const drawElement = (context: CanvasRenderingContext2D, element: Element) => {
    switch (element.name) {
        case "line":
            drawLine(
                context,
                element.start,
                element.end,
                element.color,
                element.lineWidth,
                element.lineType,
                element.arrows
            )
            break

        case "rectangle":
            drawRect(
                context,
                element.start,
                element.end,
                element.color,
                element.lineWidth,
                element.lineType
            )

            break

        case "ellipse":
            drawEllipse(
                context,
                element.centre,
                element.radiusX,
                element.radiusY,
                element.color,
                element.lineWidth,
                element.lineType
            )
            break

        case "free":
            drawStorke(
                context,
                element.points,
                element.color,
                element.lineWidth,
                element.lineType
            )
    }
}

const drawLine = (context: CanvasRenderingContext2D, start: Point, end: Point, color: string, width: number, type: LineType, arrows: Arrows) => {
    console.log('Drawing line')
    if (type !== 'simple') {
        context.lineCap = 'butt'
        context.save()
    } else {
        context.lineCap = 'round'
        context.save()
    }

    context.beginPath()
    context.moveTo(Math.round(start.x), Math.round(start.y))
    context.lineTo(Math.round(end.x), Math.round(end.y))

    console.log(arrows)
    if (arrows == "end") {
        const angle = Math.atan2(end.y - start.y, end.x - start.x)

        context.lineTo(end.x - LINE_ARROW_RAY_LENGTH * Math.cos(angle - Math.PI / 6), end.y - LINE_ARROW_RAY_LENGTH * Math.sin(angle - Math.PI / 6))
        context.moveTo(end.x, end.y)
        context.lineTo(end.x - LINE_ARROW_RAY_LENGTH * Math.cos(angle + Math.PI / 6), end.y - LINE_ARROW_RAY_LENGTH * Math.sin(angle + Math.PI / 6))
    } else if (arrows == "both") {
        const angle1 = Math.atan2(end.y - start.y, end.x - start.x)

        context.lineTo(end.x - LINE_ARROW_RAY_LENGTH * Math.cos(angle1 - Math.PI / 6), end.y - LINE_ARROW_RAY_LENGTH * Math.sin(angle1 - Math.PI / 6))
        context.moveTo(end.x, end.y)
        context.lineTo(end.x - LINE_ARROW_RAY_LENGTH * Math.cos(angle1 + Math.PI / 6), end.y - LINE_ARROW_RAY_LENGTH * Math.sin(angle1 + Math.PI / 6))

        const angle2 = Math.atan2(start.y - end.y, start.x - end.x)

        context.moveTo(start.x, start.y)
        context.lineTo(start.x - LINE_ARROW_RAY_LENGTH * Math.cos(angle2 - Math.PI / 6), start.y - LINE_ARROW_RAY_LENGTH * Math.sin(angle2 - Math.PI / 6))
        context.moveTo(start.x, start.y)
        context.lineTo(start.x - LINE_ARROW_RAY_LENGTH * Math.cos(angle2 + Math.PI / 6), start.y - LINE_ARROW_RAY_LENGTH * Math.sin(angle2 + Math.PI / 6))
    }

    context.strokeStyle = color
    if (type == 'dashed')
        context.setLineDash([width * 2, width])
    else if (type == 'dotted')
        context.setLineDash([width, width])
    else
        context.setLineDash([])
    context.lineWidth = width
    context.stroke()
}
const drawRect = (context: CanvasRenderingContext2D, start: Point, end: Point, color: string, lineWidth: number, lineType: LineType) => {
    if (lineType !== 'simple') {
        context.lineCap = 'butt'
        context.save()
    } else {
        context.lineCap = 'round'
        context.save()
    }

    context.beginPath()

    context.moveTo(start.x, start.y)
    context.lineTo(end.x, start.y)
    context.lineTo(end.x, end.y)
    context.lineTo(start.x, end.y)
    context.lineTo(start.x, start.y)

    context.strokeStyle = color
    if (lineType == 'dashed')
        context.setLineDash([lineWidth * 2, lineWidth])
    else if (lineType == 'dotted')
        context.setLineDash([lineWidth, lineWidth])
    else
        context.setLineDash([])
    context.lineWidth = lineWidth
    context.stroke()
}
const drawEllipse = (context: CanvasRenderingContext2D, centre: Point, radiusX: number, radiusY: number, color: string, lineWidth: number, lineType: LineType) => {
    if (lineType !== 'simple') {
        context.lineCap = 'butt'
        context.save()
    } else {
        context.lineCap = 'round'
        context.save()
    }

    context.beginPath()
    context.ellipse(centre.x, centre.y, radiusX, radiusY, 0, 0, Math.PI * 2)
    context.strokeStyle = color
    if (lineType == 'dashed')
        context.setLineDash([lineWidth * 2, lineWidth])
    else if (lineType == 'dotted')
        context.setLineDash([lineWidth, lineWidth])
    else
        context.setLineDash([])
    context.lineWidth = lineWidth
    context.stroke()
}
const drawStorke = (context: CanvasRenderingContext2D, points: Array<Point>, color: string, lineWidth: number, lineType: LineType) => {
    if (lineType !== 'simple') {
        context.lineCap = 'butt'
        context.save()
    } else {
        context.lineCap = 'round'
        context.save()
    }

    context.beginPath()
    context.moveTo(Math.round(points[0].x), Math.round(points[0].y))

    points.forEach((point: Point, i: number) => {
        if (i === 0)
            return

        context.lineTo(Math.round(point.x), Math.round(point.y))
    })

    context.strokeStyle = color
    if (lineType == 'dashed')
        context.setLineDash([lineWidth * 2, lineWidth])
    else if (lineType == 'dotted')
        context.setLineDash([lineWidth, lineWidth])
    else
        context.setLineDash([])
    context.lineWidth = lineWidth
    context.stroke()

}

const drawCircle = (context: CanvasRenderingContext2D, centre: Point, radius: number, color: string, lineWidth: number, lineType: LineType) => drawEllipse(context, centre, radius, radius, color, lineWidth, lineType)

const drawBoundingBox = (context: CanvasRenderingContext2D, bbox: BoundingBox, element: Element) => {
    switch (element.name) {
        case "line":
            drawCircle(context, element.start, 1, 'blue', 8, 'simple')
            drawCircle(context, element.end, 1, 'blue', 8, 'simple')

            break
        case "rectangle":
            break
        case "ellipse":
            break
        case "free":
            break
    }
}

export {
    drawElement,
    drawLine,
    drawRect,
    drawEllipse,
    drawStorke,
    drawCircle,
    drawBoundingBox
}