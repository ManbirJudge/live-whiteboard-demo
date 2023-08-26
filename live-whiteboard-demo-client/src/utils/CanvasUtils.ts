import { Point, LineType } from "../types/Elemenet"


const drawLine = (context: CanvasRenderingContext2D, start: Point, end: Point, color: string, width: number, type: LineType) => {
    context.beginPath()
    context.moveTo(start.x, start.y)
    context.lineTo(end.x, end.y)
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
    drawLine(
        context,
        start,
        { x: end.x, y: start.y },
        color,
        lineWidth,
        lineType
    )
    drawLine(
        context,
        { x: end.x, y: start.y },
        end,
        color,
        lineWidth,
        lineType
    )
    drawLine(
        context,
        end,
        { x: start.x, y: end.y },
        color,
        lineWidth,
        lineType
    )
    drawLine(
        context,
        { x: start.x, y: end.y },
        start,
        color,
        lineWidth,
        lineType
    )
}

const drawEllipse = (context: CanvasRenderingContext2D, centre: Point, radiusX: number, radiusY: number, color: string, lineWidth: number, lineType: LineType) => {
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

export {
    drawLine,
    drawRect,
    drawEllipse
}