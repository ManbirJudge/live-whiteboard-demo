

const randomColor = () => {
    const r = Math.round(Math.random() * 255)
    const g = Math.round(Math.random() * 255)
    const b = Math.round(Math.random() * 255)

    return [r, g, b]
}

const randomColorHex = () => rgbToHexString(randomColor())

const rgbToHexString = (color: number[]) => "#" + (1 << 24 | color[0] << 16 | color[1] << 8 | color[2]).toString(16).slice(1)

export {
    randomColor,
    randomColorHex,
    rgbToHexString
}