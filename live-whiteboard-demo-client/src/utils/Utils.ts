import { Point } from "../types/Element"
import BoundingBox from "../types/BoundingBox"

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
const pointInsideCircle = (point: Point, centre: Point, radius: number) => {
    if (distance(point, centre) <= radius) {
        return true
    }

    return false
}

const lineIntersectsCircle = (start: Point, end: Point, centre: Point, radius: number) => Math.abs((end.x - start.x) * (start.y - centre.y) - (start.x - centre.x) * (end.y - start.y)) / distance(start, end) <= radius

const lineSegmentIntersectsCircle = (start: Point, end: Point, centre: Point, radius: number) => {
    const d = distance(start, end);
    const t =
        ((centre.x - start.x) * (end.x - start.x) +
            (centre.y - start.y) * (end.y - start.y)) /
        (d * d);

    if (t < 0 || t > 1) {
        // The intersection point is outside the line segment.
        return false;
    }

    const closestPoint: Point = {
        x: start.x + t * (end.x - start.x),
        y: start.y + t * (end.y - start.y),
    };

    const distToClosest = distance(centre, closestPoint);

    return distToClosest <= radius;
}

/**
 * Throttles the input function and runs it every 'wait' ms. 
 * NOTE: I know the f*ck about its implementation so do not ask about it and just use it and feel free to fix or update it.
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
    throttle,
    lineIntersectsCircle,
    lineSegmentIntersectsCircle
}