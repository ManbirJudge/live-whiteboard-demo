import { useEffect, useRef, useState } from "react"

import Appbar from "./components/Appbar"
import { Button, RadioGroup, Radio, Input } from "@nextui-org/react"
import ColorPicker from "./components/ColorPicker"
import { Point, LineType, Element, Free } from "./types/Elemenet"

import CanvasCursor from './assets/cursor.cur'

import { socket } from "./socket"
// import douglasPeucker from "./algorithms/DouglasPeucker"
import chaikinSmooth from "./algorithms/ChaikinSmooth"
import douglasPeucker from "./algorithms/DouglasPeucker"


function App() {
	// constants
	const CANVAS_WIDTH_PX = 1200
	const CANVAS_HEIGHT_PX = 675

	// vars
	const [isConnected, setIsConnected] = useState<boolean>(false)
	const [roomId, setRoomId] = useState<string>("1000")
	const [msgTxt, setMsgTxt] = useState<string>("")

	// canvas mouse vars
	const [mouseOverCanvas, setMouseOverCanvas] = useState<boolean>(false)
	const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 })
	const [startMousePos, setStartMousePos] = useState<Point>({ x: 0, y: 0 })

	const [mouseDown, setMouseDown] = useState<boolean>(false)

	// canavas vars
	const canvasRef = useRef<HTMLCanvasElement | null>(null)

	const [drawColor, setDrawColor] = useState<string>('#000')

	const [activeToolType, setActiveToolType] = useState<string>("line")
	const [activeLineType, setActiveLineType] = useState<LineType>("simple")

	const [activeElement, setActiveElement] = useState<Element | null>(null)
	const [drawnElements, setDrawnElements] = useState<Array<Element>>([])

	// use effects
	useEffect(() => {
		const canvas = canvasRef!.current!
		const rect = canvas.getBoundingClientRect()
		const context = canvas.getContext('2d')!

		// background
		context.fillStyle = 'white'
		context.fillRect(0, 0, rect.width, rect.height)

		// drawn elements
		drawDrawnElements(context)
	}, [mouseOverCanvas])

	useEffect(() => {
		const canvas = canvasRef!.current!
		const rect = canvas.getBoundingClientRect()
		const context = canvas.getContext('2d')!

		// background
		context.fillStyle = 'white'
		context.fillRect(0, 0, rect.width, rect.height)

		// drawn elements
		drawDrawnElements(context)

		// active element
		if (activeElement !== null) {
			switch (activeElement.name) {
				case "line":
					drawLine(
						context,
						activeElement.start,
						activeElement.end,
						activeElement.color,
						activeElement.width,
						activeElement.type
					)
					break

				case "rectangle":
					drawRect(
						context,
						activeElement.start,
						activeElement.end,
						activeElement.color,
						activeElement.lineWidth,
						activeElement.lineType
					)

					break

				case "ellipse":
					drawEllipse(
						context,
						activeElement.centre,
						activeElement.radiusX,
						activeElement.radiusY,
						activeElement.color,
						activeElement.lineWidth,
						activeElement.lineType
					)
					break

				case "free":
					activeElement.points.forEach((point: Point, i: number) => {
						if (i + 1 === activeElement.points.length) {
							return
						}

						drawLine(
							context,
							point,
							activeElement.points[i + 1],
							activeElement.color,
							activeElement.lineWidth,
							activeElement.lineType
						)
					})
			}
		}
	}, [activeElement, drawnElements, mousePos])

	useEffect(() => {
		if (mouseDown) {
			setStartMousePos(mousePos)
		} else {
			let newElement: Element | null = null

			switch (activeToolType) {
				case "line":
					newElement = {
						name: 'line',
						start: startMousePos,
						end: mousePos,
						type: activeLineType,
						width: 3,
						color: drawColor,
						arrows: "no"
					}
					break

				case "rectangle":
					newElement = {
						name: 'rectangle',
						start: startMousePos,
						end: mousePos,
						lineType: activeLineType,
						lineWidth: 3,
						color: drawColor,
						fill: false
					}
					break

				case "ellipse":
					const centre: Point = {
						x: (startMousePos.x + mousePos.x) / 2,
						y: (startMousePos.y + mousePos.y) / 2
					}

					newElement = {
						name: 'ellipse',
						centre: centre,
						radiusX: Math.abs(mousePos.x - startMousePos.x) / 2,
						radiusY: Math.abs(mousePos.y - startMousePos.y) / 2,
						lineType: activeLineType,
						lineWidth: 3,
						color: drawColor,
						fill: false
					}
					break

				case "free":
					newElement = activeElement!
					break
			}

			if (newElement === undefined || newElement === null) {
				console.log('No new element was drawn?! 😕')
				return
			}

			if (newElement.name == 'free') {
				const a_ = newElement.points.length
				newElement.points = chaikinSmooth(newElement.points, 2)
				const b_ = newElement.points.length
				newElement.points = douglasPeucker(newElement.points, 2)
				const c_ = newElement.points.length

				console.log(`Original: ${a_}\nAfter Chaikin: ${b_}\nAfter Douglas-Peucker: ${c_}`)
			}

			setDrawnElements([...drawnElements, newElement])

			socket.emit('new_drawn_element', { element: newElement, room_id: roomId })
		}
	}, [mouseDown])

	useEffect(() => {
		if (mouseDown) {
			switch (activeToolType) {
				case "line":
					setActiveElement({
						name: 'line',
						start: startMousePos,
						end: mousePos,
						type: activeLineType,
						width: 3,
						color: drawColor,
						arrows: "no"
					})
					break

				case "rectangle":
					setActiveElement({
						name: 'rectangle',
						start: startMousePos,
						end: mousePos,
						lineType: activeLineType,
						lineWidth: 3,
						color: drawColor,
						fill: false
					})
					break

				case "ellipse":
					const centre: Point = {
						x: (startMousePos.x + mousePos.x) / 2,
						y: (startMousePos.y + mousePos.y) / 2
					}

					setActiveElement({
						name: 'ellipse',
						centre: centre,
						radiusX: Math.abs(mousePos.x - startMousePos.x) / 2,
						radiusY: Math.abs(mousePos.y - startMousePos.y) / 2,
						lineType: activeLineType,
						lineWidth: 3,
						color: drawColor,
						fill: false
					})
					break

				case "free":
					if (activeElement && activeElement.name === "free") {
						const newActiveElement: Free = activeElement
						newActiveElement.points.push(mousePos)

						setActiveElement(newActiveElement)
					} else {
						setActiveElement({
							name: 'free',
							lineType: activeLineType,
							lineWidth: 3,
							color: drawColor,
							points: [startMousePos]
						})
					}
					break
			}
		} else {
			setActiveElement(null)
		}
	}, [mousePos])

	// socket io
	useEffect(() => {
		function onConnect() {
			setIsConnected(true)
		}

		function onDisconnect() {
			setIsConnected(false)
		}

		function onMsg(data_: string) {
			const data = JSON.parse(data_)
			console.log(`Received message from "${data.sid}":\n${data.text}`)
		}

		const onAddNewDrawElement = (data: any) => {
			setDrawnElements(prev => [...prev, data as Element])
		}

		socket.on('connect', onConnect)
		socket.on('disconnect', onDisconnect)
		socket.on('msg', onMsg)
		socket.on('add_new_drawn_element', onAddNewDrawElement)

		return () => {
			socket.off('connect', onConnect)
			socket.off('disconnect', onDisconnect)
			socket.off('msg', onMsg)
			socket.off('add_new_drawn_element', onAddNewDrawElement)
		}
	}, [])

	// draw functions
	const drawDrawnElements = (context: CanvasRenderingContext2D) => {
		drawnElements.forEach(drawnElement => {
			switch (drawnElement.name) {
				case "line":
					drawLine(
						context,
						drawnElement.start,
						drawnElement.end,
						drawnElement.color,
						drawnElement.width,
						drawnElement.type
					)
					break

				case "rectangle":
					drawRect(
						context,
						drawnElement.start,
						drawnElement.end,
						drawnElement.color,
						drawnElement.lineWidth,
						drawnElement.lineType
					)

					break

				case "ellipse":
					drawEllipse(
						context,
						drawnElement.centre,
						drawnElement.radiusX,
						drawnElement.radiusY,
						drawnElement.color,
						drawnElement.lineWidth,
						drawnElement.lineType
					)
					break

				case "free":
					const pOiNtS = drawnElement.points

					pOiNtS.forEach((point: Point, i: number) => {
						if (i + 1 === pOiNtS.length) {
							return
						}

						drawLine(
							context,
							point,
							pOiNtS[i + 1],
							drawnElement.color,
							drawnElement.lineWidth,
							drawnElement.lineType
						)
					})
			}
		})
	}

	const drawLine = (context: CanvasRenderingContext2D, start: Point, end: Point, color: string, width: number, type: LineType) => {
		context.beginPath()
		context.moveTo(start.x, start.y)
		context.lineTo(end.x, end.y)
		context.strokeStyle = color
		if (type == 'dashed')
			context.setLineDash([width * 2, width])
		else if (type == 'dotted')
			context.setLineDash([width, width])
		else
			context.setLineDash([])
		context.lineWidth = width
		context.stroke()
	}

	const drawRect = (context: CanvasRenderingContext2D, start: Point, end: Point, color: string, lineWidth: number, lineType: LineType) => {
		drawLine(
			context,
			start,
			{ x: end.x, y: start.y },
			color,
			lineWidth,
			lineType
		)
		drawLine(
			context,
			{ x: end.x, y: start.y },
			end,
			color,
			lineWidth,
			lineType
		)
		drawLine(
			context,
			end,
			{ x: start.x, y: end.y },
			color,
			lineWidth,
			lineType
		)
		drawLine(
			context,
			{ x: start.x, y: end.y },
			start,
			color,
			lineWidth,
			lineType
		)
	}

	const drawEllipse = (context: CanvasRenderingContext2D, centre: Point, radiusX: number, radiusY: number, color: string, lineWidth: number, lineType: LineType) => {
		context.beginPath()
		context.ellipse(centre.x, centre.y, radiusX, radiusY, 0, 0, Math.PI * 2)
		context.strokeStyle = color
		if (lineType == 'dashed')
			context.setLineDash([lineWidth * 2, lineWidth])
		else if (lineType == 'dotted')
			context.setLineDash([lineWidth, lineWidth])
		else
			context.setLineDash([])
		context.lineWidth = lineWidth
		context.stroke()
	}

	// event listeners
	const handleMouseMove = (event: any) => {
		const canvas = canvasRef!.current!
		const canvasRect = canvas.getBoundingClientRect()

		const mouseX = event.clientX - canvasRect.left
		const mouseY = event.clientY - canvasRect.top

		setMousePos({ x: mouseX, y: mouseY })
	}

	// rendering
	return (
		<div className="flex flex-col">
			<Appbar />

			<div className="flex-1 flex flex-row items-center justify-start" >
				<canvas
					ref={canvasRef}
					width={CANVAS_WIDTH_PX}
					height={CANVAS_HEIGHT_PX}
					style={{
						// width: `${CANVAS_WIDTH_PX}px`,
						// height: `${CANVAS_HEIGHT_PX}px`,
						background: '#eaeaea',
						borderWidth: '2px',
						borderColor: 'black',
						cursor: `url(${CanvasCursor}), crosshair`
					}}
					onMouseEnter={() => setMouseOverCanvas(true)}
					onMouseMove={handleMouseMove}
					onMouseDown={() => setMouseDown(true)}
					onMouseUp={() => setMouseDown(false)}
					onMouseLeave={() => setMouseOverCanvas(false)}
				/>
				<div className="flex-1 flex flex-row items-center justify-center" >
					<Button style={{ margin: '10px' }} onClick={() => setDrawnElements([])} >Clear</Button>
					<RadioGroup
						style={{ margin: '10px' }}
						label="Tool"
						value={activeToolType}
						onValueChange={setActiveToolType}
					>
						<Radio value="line">Line</Radio>
						<Radio value="free">Free</Radio>
						<Radio value="rectangle">Rectangle</Radio>
						<Radio value="ellipse">Ellipse</Radio>
					</RadioGroup>
					<RadioGroup
						style={{ margin: '10px' }}
						label="Line type"
						value={activeLineType}
						onValueChange={val => setActiveLineType(val as LineType)}
					>
						<Radio value="simple">Simple</Radio>
						<Radio value="dashed">Dashed</Radio>
						<Radio value="dotted">Dotted</Radio>
					</RadioGroup>
					<ColorPicker initialColorHex={drawColor} onChange={setDrawColor} />
				</div>
			</div>
			<div className="flex-1 flex flex-col items-start justify-center px-2" >
				<h1 className="my-1">Connected to server: {isConnected ? 'True' : 'False'}</h1>
				<Input
					className="my-1"
					value={roomId}
					onValueChange={setRoomId}
					label="Room ID"
				/>
				<Button
					className="my-1"
					variant="flat"
					color="primary"
					onClick={() => socket.emit('join_room', roomId)}
				>
					Join room ^
				</Button><Input
					className="my-1"
					value={msgTxt}
					onValueChange={setMsgTxt}
					label="Message"
				/>
				<Button
					className="my-1"
					variant="flat"
					color="primary"
					onClick={() => socket.emit('send_msg', JSON.stringify({ text: msgTxt, room_id: roomId }))}
				>
					Send message^
				</Button>
			</div>
		</div>
	)
}

export default App
