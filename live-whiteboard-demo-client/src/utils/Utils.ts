import { Point } from "../types/Element"
import BoundingBox from "../types/BoundingBox";

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
    pointInsideBox,
    throttle
}