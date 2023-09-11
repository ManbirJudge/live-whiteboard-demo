import { Point } from "../types/Element";

function lineIntersectsCircle(start: Point, end: Point, circleCenter: Point, radius: number) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lineLength = Math.sqrt(dx ** 2 + dy ** 2);

    // Calculate the direction vector of the line
    const dirX = dx / lineLength;
    const dirY = dy / lineLength;

    // Calculate the vector from the line's start point to the circle's center
    const circleToStartX = circleCenter.x - start.x;
    const circleToStartY = circleCenter.y - start.y;

    // Calculate the projection of the circle-center-to-start vector onto the line
    const projection = dirX * circleToStartX + dirY * circleToStartY;

    // Calculate the closest point on the line to the circle's center
    const closestX = start.x + projection * dirX;
    const closestY = start.y + projection * dirY;

    // Calculate the distance between the closest point and the circle's center
    const distance = Math.sqrt((closestX - circleCenter.x) ** 2 + (closestY - circleCenter.y) ** 2);

    return distance <= radius;
}

export default lineIntersectsCircle