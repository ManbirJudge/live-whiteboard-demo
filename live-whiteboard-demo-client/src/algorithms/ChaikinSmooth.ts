import { Point } from "../types/Elemenet";

function chaikinSmooth(points: Array<Point>, smoothingFactor: number): Array<Point> {
    const smoothedPoints: Array<Point> = [];

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        const midPointX = (p1.x + p2.x) / 2;
        const midPointY = (p1.y + p2.y) / 2;

        const smoothedP1X = p1.x + (midPointX - p1.x) * smoothingFactor;
        const smoothedP1Y = p1.y + (midPointY - p1.y) * smoothingFactor;

        const smoothedP2X = p2.x + (midPointX - p2.x) * smoothingFactor;
        const smoothedP2Y = p2.y + (midPointY - p2.y) * smoothingFactor;

        smoothedPoints.push({ x: smoothedP1X, y: smoothedP1Y });
        smoothedPoints.push({ x: smoothedP2X, y: smoothedP2Y });
    }

    // Add the last point of the original curve
    smoothedPoints.push(points[points.length - 1]);

    return smoothedPoints;
}

export default chaikinSmooth