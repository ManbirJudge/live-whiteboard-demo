import { Point, LineType } from "../types/Element"


const drawLine = (context: CanvasRenderingContext2D, start: Point, end: Point, color: string, width: number, type: LineType) => {
    context.beginPath()
    context.moveTo(Math.round(start.x), Math.round(start.y))
    context.lineTo(Math.round(end.x), Math.round(end.y))
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

export {
    drawLine,
    drawRect,
    drawEllipse,
    drawStorke
}