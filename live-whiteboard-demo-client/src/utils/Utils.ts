import { Point } from "../types/Element"
import BoundingBox from "../types/BoundingBox"
import { calcBoundingBoxStrokePoints } from "./BoundingBoxUtils"

const distance = (p1: Point, p2: Point) => Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)

function pointInsideBox(point: Point, box: BoundingBox): boolean {
    if (
        point.x > box.start.x &&
        point.x < box.end.x &&
        point.y > box.start.y &&
        point.y < box.end.y
    ) {
        return true
    }

    return false
}
const pointInsideCircle = (point: Point, center: Point, radius: number) => {
    if (distance(point, center) <= radius) {
        return true
    }

    return false
}

const lineIntersectsCircle = (start: Point, end: Point, center: Point, radius: number) => Math.abs((end.x - start.x) * (start.y - center.y) - (start.x - center.x) * (end.y - start.y)) / distance(start, end) <= radius

const lineSegmentIntersectsCircle = (start: Point, end: Point, center: Point, radius: number) => {
    const d = distance(start, end);
    const t =
        ((center.x - start.x) * (end.x - start.x) +
            (center.y - start.y) * (end.y - start.y)) /
        (d * d);

    if (t < 0 || t > 1) {
        // The intersection point is outside the line segment.
        return false;
    }

    const closestPoint: Point = {
        x: start.x + t * (end.x - start.x),
        y: start.y + t * (end.y - start.y),
    };

    const distToClosest = distance(center, closestPoint);

    return distToClosest <= radius;
}

const circleInteresectsBox = (start: Point, end: Point, center: Point, radius: number) => {
    return lineSegmentIntersectsCircle(
        start, { x: end.x, y: start.y }, center, radius
    ) || lineSegmentIntersectsCircle(
        { x: end.x, y: start.y }, end, center, radius
    ) || lineSegmentIntersectsCircle(
        end, { x: start.x, y: end.y }, center, radius
    ) || lineSegmentIntersectsCircle(
        { x: start.x, y: end.y }, start, center, radius
    )
}

const circleIntersectsCircle = (center1: Point, radius1: number, center2: Point, radius2: number) => distance(center1, center2) <= (radius1 + radius2)

const circleIntersectsEllipse = (circle_center: Point, circle_r: number, ellipse_center: Point, ellipse_rx: number, ellipse_ry: number) => {
    const dx = ellipse_center.x - circle_center.x
    const dy = ellipse_center.y - circle_center.y

    console.log((dx / ellipse_rx) ** 2)
    console.log((dy / ellipse_ry) ** 2)

    return ((dx / ellipse_rx) ** 2 + (dy / ellipse_ry) ** 2) <= 1
}

const circleIntersectsStroke = (center: Point, radius: number, points: Array<Point>) => {
    const numPoinst = points.length
    const bbox = calcBoundingBoxStrokePoints(points)

    let yes = false

    if (circleInteresectsBox(bbox.start, bbox.end, center, radius)) {
        points.forEach((point, i) => {
            if (!(i == numPoinst - 1)) {
                if (lineSegmentIntersectsCircle(point, points[i + 1], center, radius)) {
                    console.log('Dibidibidibi dobdob yesyes')
                    yes = true
                }
            }
        })
    }

    console.log(yes)
    return yes
}

/**
 * Throttles the input function and runs it every 'wait' ms. 
 * NOTE: I know the f*ck about its implementation so do not ask about it and just use it and feel stroke to fix or update it.
 * @param {(any) => void} func - The function to throttle.
 * @param {number} wait - Time to wait in milliseconds.
 * @returns {() => void} Throttled function.
 */
function throttle(func: (...args: any) => void, wait: number) {
    let lastRun: Date = new Date()

    return function throttled() {
        if ((new Date().valueOf() - lastRun.valueOf()) >= wait) {
            func(...arguments)
            lastRun = new Date()
        }
    }
}

export {
    distance,
    pointInsideBox,
    pointInsideCircle,
    lineIntersectsCircle,
    circleInteresectsBox,
    lineSegmentIntersectsCircle,
    circleIntersectsCircle,
    circleIntersectsEllipse,
    circleIntersectsStroke,
    throttle,
}