import { useEffect, useRef, useState } from "react"
import { Point, LineType, Element, Free } from "./types/Elemenet"

import Logo from './assets/icon.svg'
import CanvasCursor from './assets/cursor.cur'

import { socket } from "./socket"
import chaikinSmooth from "./algorithms/ChaikinSmooth"
import douglasPeucker from "./algorithms/DouglasPeucker"
import { drawLine, drawRect, drawEllipse } from "./utils/CanvasUtils"
import { Layout, Image, Radio, Space, ColorPicker, Button } from "antd"
import { Header, Content, Footer } from "antd/es/layout/layout"
import Input from "antd/es/input/Input"
import Title from "antd/es/typography/Title"

const CANVAS_WIDTH_PX = 750
const CANVAS_HEIGHT_PX = 450


function App() {
	// socket.io vars
	const [isIoServerConnected, setIsIoServerConnected] = useState<boolean>(false)
	const [isConnectedToRoom, setIsConnectedToRoom] = useState<boolean>(false)
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
			setIsIoServerConnected(true)
		}

		function onDisconnect() {
			setIsIoServerConnected(false)
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

	// draw function
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
		<Layout className="layout">
			<Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Image
					width={50}
					src={Logo}
					preview={false}
				/>
				<Title style={{ color: "#fff", margin: 0, marginLeft: 12 }}>Live Whiteboard Demo</Title>
			</Header>
			<Content style={{ padding: '20px 30px' }}>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center'
					}}
				>
					<canvas
						ref={canvasRef}
						width={CANVAS_WIDTH_PX}
						height={CANVAS_HEIGHT_PX}
						style={{
							width: `${CANVAS_WIDTH_PX}px`,
							height: `${CANVAS_HEIGHT_PX}px`,
							background: '#eaeaea',
							borderWidth: '2px',
							borderColor: 'black',
							cursor: `url(${CanvasCursor}), crosshair`,
							marginBottom: '20px'
						}}
						onMouseEnter={() => setMouseOverCanvas(true)}
						onMouseMove={handleMouseMove}
						onMouseDown={() => setMouseDown(true)}
						onMouseUp={() => setMouseDown(false)}
						onMouseLeave={() => setMouseOverCanvas(false)}
					/>
					<Space direction="horizontal">
						<Radio.Group value={activeToolType} onChange={e => setActiveToolType(e.target.value)}>
							<Space direction="vertical">
								<Radio value="line">Line</Radio>
								<Radio value="free">Free</Radio>
								<Radio value="rectangle">Rectangle</Radio>
								<Radio value="ellipse">Ellipse</Radio>
								<Radio value="eraser" disabled>Eraser</Radio>
							</Space>
						</Radio.Group>
						<Radio.Group value={activeLineType} onChange={e => setActiveLineType(e.target.value)}>
							<Space direction="vertical">
								<Radio value="simple">Simple</Radio>
								<Radio value="dashed">Dashed</Radio>
								<Radio value="dotted">Dotted</Radio>
							</Space>
						</Radio.Group>
						<ColorPicker value={drawColor} onChange={(_color, hex) => setDrawColor(hex)} />
					</Space>
					<div>
						<p>Connected to server: <span style={{ fontWeight: 'bold', color: isIoServerConnected ? 'green' : 'red' }}>{isIoServerConnected ? 'True' : 'False'}</span></p>
						<Space>
							<Space size={0}>
								<Input
									value={roomId}
									onChange={e => setRoomId(e.target.value)}
									title="Room ID"
									disabled={!isIoServerConnected}
								/>
								<Button disabled={!isIoServerConnected} onClick={() => { socket.emit('join_room', roomId); setIsConnectedToRoom(true) }}>Join room</Button>
							</Space>
							<Space size={0}>
								<Input
									value={msgTxt}
									onChange={e => setMsgTxt(e.target.value)}
									title="Message"
									disabled={!isConnectedToRoom}
								/>
								<Button disabled={!isConnectedToRoom} onClick={() => { socket.emit('send_msg', JSON.stringify({ text: msgTxt, room_id: roomId })); setMsgTxt('') }} > Send message </Button>
							</Space>
						</Space>
					</div>
				</div>
			</Content>
			<Footer style={{ textAlign: 'center' }}>Create with ❤️ by Manbir Singh Judge</Footer>
		</Layout>
	)
}

export default App
