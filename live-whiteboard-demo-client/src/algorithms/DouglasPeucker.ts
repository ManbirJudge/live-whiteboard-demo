import { Point } from "../types/Elemenet"

function perpendicularDistance(point: Point, start: Point, end: Point): number {
    const area = Math.abs((end.x - start.x) * (start.y - point.y) - (start.x - point.x) * (end.y - start.y))
    const lineLen = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2)

    return area / lineLen
}

function douglasPeucker(points: Point[], epsilon: number): Point[] {
    const end = points.length
    let dmax = 0
    let index = 0

    for (let i = 2; i < end - 1; i++) {
        const d = perpendicularDistance(points[i], points[0], points[end - 1])

        if (d > dmax) {
            index = i
            dmax = d
        }
    }

    let result: Point[] = []

    if (dmax > epsilon) {
        const recResults1 = douglasPeucker(points.slice(0, index + 1), epsilon)
        const recResults2 = douglasPeucker(points.slice(index, end), epsilon)

        result = [...recResults1.slice(0, recResults1.length - 1), ...recResults2]
    } else {
        result = [points[0], points[end - 1]]
    }

    return result
}

export default douglasPeucker
export { perpendicularDistance }