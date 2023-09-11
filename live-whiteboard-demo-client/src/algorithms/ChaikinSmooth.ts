import { Point } from "../types/Element"

function oldChaikinSmooth(points: Array<Point>, smoothingFactor: number): Array<Point> {
    let smoothedPoints: Array<Point> = []

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i]
        const p2 = points[i + 1]

        const midPointX = (p1.x + p2.x) / 2
        const midPointY = (p1.y + p2.y) / 2

        const smoothedP1X = p1.x + (midPointX - p1.x) * smoothingFactor
        const smoothedP1Y = p1.y + (midPointY - p1.y) * smoothingFactor

        const smoothedP2X = p2.x + (midPointX - p2.x) * smoothingFactor
        const smoothedP2Y = p2.y + (midPointY - p2.y) * smoothingFactor

        smoothedPoints.push({ x: smoothedP1X, y: smoothedP1Y })
        smoothedPoints.push({ x: smoothedP2X, y: smoothedP2Y })
    }

    smoothedPoints.push(points[points.length - 1])

    return smoothedPoints
}

const chaikinSmooth = (points: Array<Point>, iterations: number = 5): Array<Point> => {
    if (iterations === 0) return points

    const l = points.length

    const smoothed: Array<Point> = points.map((point, i) => {
        if (i === points.length - 1) {
            return []
        }

        return [
            { x: 0.75 * point.x + 0.25 * points[(i + 1) % l].x, y: 0.75 * point.y + 0.25 * points[(i + 1) % l].y },
            { x: 0.25 * point.x + 0.75 * points[(i + 1) % l].x, y: 0.25 * point.y + 0.75 * points[(i + 1) % l].y }
        ]
    }).flat()

    return iterations === 1 ? smoothed : chaikinSmooth(smoothed, iterations - 1)
}

export default chaikinSmooth
export { oldChaikinSmooth }