import { Element, Point } from "../types/Element"

type Translation = Point

function translateElement(element: Element, translation: Translation): Element {
    switch (element.name) {
        case "line":
            element.start.x += translation.x
            element.start.y += translation.y
            element.end.x += translation.x
            element.end.y += translation.y

            return element

        case "rectangle":
            element.start.x += translation.x
            element.start.y += translation.y
            element.end.x += translation.x
            element.end.y += translation.y

            return element

        case "ellipse":
            element.center.x += translation.x
            element.center.y += translation.y

            return element

        case "stroke":
            element.points = element.points.map(p => ({ x: p.x + translation.x, y: p.y + translation.y }))

            return element
    }
}

export {
    translateElement
}