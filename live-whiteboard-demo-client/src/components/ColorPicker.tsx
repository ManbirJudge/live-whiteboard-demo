import { Popover, PopoverTrigger, Button, PopoverContent } from "@nextui-org/react"
import { useEffect, useState } from "react"
import { HexAlphaColorPicker } from 'react-colorful'

type ColorPickerProps = {
    initialColorHex: string
    onChange: (color: string) => void
}

const ColorPicker = (props: ColorPickerProps) => {
    const [isOpen, setIsOpen] = useState<boolean>(false)

    // const [currentColor, setCurrentColor] = useState<string>(props.initialColorHex)
    const [selectedColor, setSelectedColor] = useState<string>(props.initialColorHex)

    useEffect(() => {
        props.onChange(selectedColor)
    }, [selectedColor])

    // const handleOnChangeComplete = (color: ColorResult, _event: React.ChangeEvent<HTMLInputElement>) => {
    //     setCurrentColor(color.hex)
    // }

    // const onAccepted = (_color: ColorResult, _event: React.ChangeEvent<HTMLInputElement>) => {
    //     setSelectedColor(currentColor)
    //     setIsOpen(false)
    // }

    return (
        <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom" showArrow offset={10}>
            <PopoverTrigger>
                <Button color="default" style={{ backgroundColor: selectedColor }}>Color</Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px]">
                <div className="px-1 py-2 w-full">
                    <HexAlphaColorPicker
                        color={selectedColor}
                        onChange={setSelectedColor}
                    />
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default ColorPicker