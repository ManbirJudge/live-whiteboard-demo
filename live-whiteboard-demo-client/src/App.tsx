import { createContext, useEffect, useRef, useState } from "react"
import { Layout, Image, Radio, Space, ColorPicker, Button, Slider, notification } from "antd"
import { Header, Content, Footer } from "antd/es/layout/layout"
import Input from "antd/es/input/Input"
import Title from "antd/es/typography/Title"
import { v4 as uuid } from "uuid"

import Logo from './assets/icon.svg'
import CanvasCursor from './assets/cursor.cur'

import { Point, LineType, Element, Free } from "./types/Element"
import { drawLine, drawRect, drawEllipse, drawStorke } from "./utils/CanvasUtils"
import chaikinSmooth from "./algorithms/ChaikinSmooth"
import douglasPeucker from "./algorithms/DouglasPeucker"
import { socket } from "./socket"
import BoundingBox from "./types/BoundingBox"
import { pointInsideBox, throttle } from "./utils/Utils"

// const CANVAS_WIDTH_PX = 400
// const CANVAS_HEIGHT_PX = 300
const CANVAS_WIDTH_PX = 1400
const CANVAS_HEIGHT_PX = 800

const OUTPUT_STROKE_DATA = false
const COPY_STROKE_DATA = false

const DEBUG_COLOR = '#d2d2d298'

const Context = createContext({})

function App() {
	// vars
	const [notificationsApi, notificationContextHolder] = notification.useNotification()

	// socket.io vars
	const [isIoServerConnected, setIsIoServerConnected] = useState<boolean>(false)
	const [isConnectedToRoom, setIsConnectedToRoom] = useState<boolean>(false)
	const [roomId, setRoomId] = useState<string>("1000")
	const [msgTxt, setMsgTxt] = useState<string>("")

	// canvas mouse vars
	// const [mouseOverCanvas, setMouseOverCanvas] = useState<boolean>(false)
	const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 })
	const [startMousePos, setStartMousePos] = useState<Point>({ x: 0, y: 0 })

	const [mouseDown, setMouseDown] = useState<boolean>(false)

	// canavas vars
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const frontCanvasRef = useRef<HTMLCanvasElement | null>(null)

	const [canvasCursor, setCanvasCursor] = useState<string>(`url(${CanvasCursor}), crosshair`)
	const [drawColor, setDrawColor] = useState<string>('black')
	const [drawWidth, setDrawWidth] = useState<number>(1.5)

	const [activeToolType, setActiveToolType] = useState<string>('free')
	const [activeLineType, setActiveLineType] = useState<LineType>('simple')

	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [selectedBoundingRect, setSelectedBoundingRect] = useState<BoundingBox>({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 } })

	const [activeEle, setActiveEle] = useState<Element | null>(null)
	const [drawnEles, setDrawnEles] = useState<Array<Element>>([])

	// use effects
	useEffect(() => {
		const throttledHandleMouseMove = throttle((event) => {
			handleMouseMove(event)
		}, 10)

		frontCanvasRef!.current!.addEventListener('mousemove', throttledHandleMouseMove)

		return () => {
			frontCanvasRef!.current!.removeEventListener('mousemove', throttledHandleMouseMove)
		}
	}, [])

	useEffect(() => {
		const frontCanvas = frontCanvasRef!.current!
		const frontRect = frontCanvas.getBoundingClientRect()
		const frontContext = frontCanvas.getContext('2d')!

		// clearing the front canvas
		frontContext.clearRect(0, 0, frontRect.width, frontRect.height)
		frontContext.fillStyle = 'transparent'
		frontContext.fillRect(0, 0, frontRect.width, frontRect.height)

		// calculating active Ele
		let newActiveEle: Element | null = activeEle
		let newSelectedBoundingRect: BoundingBox | null = null


		if (mouseDown) {
			if (selectedId !== null) {
				newActiveEle = null

				const transX = mousePos.x - startMousePos.x
				const transY = mousePos.y - startMousePos.y


				newSelectedBoundingRect = {
					start: {
						x: selectedBoundingRect.start.x + transX,
						y: selectedBoundingRect.start.y + transY
					}, end: {
						x: selectedBoundingRect.end.x + transX,
						y: selectedBoundingRect.end.y + transY
					},
				}
			} else {
				const newActiveEleId = uuid()

				switch (activeToolType) {
					case "line":
						newActiveEle = {
							id: newActiveEleId,
							name: 'line',
							start: startMousePos,
							end: mousePos,
							type: activeLineType,
							width: drawWidth,
							color: drawColor,
							arrows: "no"
						}
						break

					case "rectangle":
						newActiveEle = {
							id: newActiveEleId,
							name: 'rectangle',
							start: startMousePos,
							end: mousePos,
							lineType: activeLineType,
							lineWidth: drawWidth,
							color: drawColor,
							fill: false
						}
						break

					case "ellipse":
						const centre: Point = {
							x: (startMousePos.x + mousePos.x) / 2,
							y: (startMousePos.y + mousePos.y) / 2
						}

						newActiveEle = {
							id: newActiveEleId,
							name: 'ellipse',
							centre: centre,
							radiusX: Math.abs(mousePos.x - startMousePos.x) / 2,
							radiusY: Math.abs(mousePos.y - startMousePos.y) / 2,
							lineType: activeLineType,
							lineWidth: drawWidth,
							color: drawColor,
							fill: false
						}
						break

					case "free":
						if (activeEle !== null && activeEle.name === 'free') {
							const newActiveFreeEle: Free = activeEle
							newActiveFreeEle.points.push(mousePos)

							newActiveEle = newActiveFreeEle
						} else {
							newActiveEle = {
								id: newActiveEleId,
								name: 'free',
								lineType: activeLineType,
								lineWidth: drawWidth,
								color: drawColor,
								points: [startMousePos]
							}
						}
						break

					case 'eraser':
						break

					default:
						newActiveEle = null
						break
				}
			}
		}

		// if (newSelectedBoundingRect !== null) { setSelectedBoundingRect(newSelectedBoundingRect) }
		setActiveEle(newActiveEle)

		// selected ele things
		let actualBoundingRect = newSelectedBoundingRect !== null ? newSelectedBoundingRect : selectedBoundingRect

		if (selectedId !== null) {
			// drawing the bounding box
			drawRect(
				frontContext,
				actualBoundingRect.start,
				actualBoundingRect.end,
				DEBUG_COLOR,
				1.5,
				'dashed'
			)

			// mouse cursor
			if (pointInsideBox(mousePos, actualBoundingRect)) {
				setCanvasCursor('move')
			} else {
				switch (activeToolType) {
					case "line":
						setCanvasCursor(`url(${CanvasCursor}), crosshair`)
						break

					case "free":
						setCanvasCursor(`url(${CanvasCursor}), crosshair`)
						break

					case "rectangle":
						setCanvasCursor('crosshair')
						break

					case "ellipse":
						setCanvasCursor('crosshair')
						break

					case "eraser":
						setCanvasCursor('pointer')
						break
				}
			}

			return
		}

		// TODO: eraser
		// if (activeToolType === 'eraser') {
		// 	drawEllipse(frontContext, mousePos, drawWidth * 2, drawWidth * 2, 'black', 1, 'simple')
		// }

		// active ele
		if (newActiveEle !== null && mouseDown) {
			// drawing
			switch (newActiveEle.name) {
				case 'line':
					drawLine(
						frontContext,
						newActiveEle.start,
						newActiveEle.end,
						newActiveEle.color,
						newActiveEle.width,
						newActiveEle.type
					)
					break

				case 'rectangle':
					drawRect(
						frontContext,
						newActiveEle.start,
						newActiveEle.end,
						newActiveEle.color,
						newActiveEle.lineWidth,
						newActiveEle.lineType
					)

					break

				case 'ellipse':
					drawEllipse(
						frontContext,
						newActiveEle.centre,
						newActiveEle.radiusX,
						newActiveEle.radiusY,
						newActiveEle.color,
						newActiveEle.lineWidth,
						newActiveEle.lineType
					)
					break

				case 'free':
					drawStorke(
						frontContext,
						newActiveEle.points,
						DEBUG_COLOR,
						// newActiveEle.color,
						newActiveEle.lineWidth,
						newActiveEle.lineType
					)
					break
			}
		}
	}, [mousePos])

	useEffect(() => {
		const frontCanvas = frontCanvasRef!.current!
		const frontRect = frontCanvas.getBoundingClientRect()
		const frontContext = frontCanvas.getContext('2d')!

		// clearing the front canvas
		frontContext.clearRect(0, 0, frontRect.width, frontRect.height)
		frontContext.fillStyle = 'transparent'
		frontContext.fillRect(0, 0, frontRect.width, frontRect.height)

		if (selectedId === null)
			return

		drawRect(
			frontContext,
			selectedBoundingRect.start,
			selectedBoundingRect.end,
			DEBUG_COLOR,
			1.5,
			'dashed'
		)
	}, [selectedId])

	useEffect(() => {
		console.log('[DEBUG] Drawn Eles updated.')

		const canvas = canvasRef!.current!
		const rect = canvas.getBoundingClientRect()
		const context = canvas.getContext('2d')!

		// background
		context.fillStyle = 'white'
		context.fillRect(0, 0, rect.width, rect.height)

		// drawn Eles
		drawDrawnEles(context)
	}, [drawnEles])

	useEffect(() => {
		if (mouseDown) {
			setStartMousePos(mousePos)

			if (!(selectedId && pointInsideBox(mousePos, selectedBoundingRect))) {
				setSelectedId(null)
			}

			if (activeToolType === 'select') {
				console.log('[DEBUG] Canvas clicked.')

				drawnEles.forEach(Ele => {
					switch (Ele.name) {
						case 'free':
							let sx: number, sy: number, ex: number, ey: number
							sx = CANVAS_WIDTH_PX
							sy = CANVAS_HEIGHT_PX
							ex = ey = 0

							Ele.points.forEach(point => {
								if (point.x < sx)
									sx = point.x
								if (point.y < sy)
									sy = point.y
								if (point.x > ex)
									ex = point.x
								if (point.y > ey)
									ey = point.y
							})

							if (sx < mousePos.x && sy < mousePos.y && mousePos.x < ex && mousePos.y < ey) {
								setSelectedId(Ele.id)
								setSelectedBoundingRect({
									start: { x: sx, y: sy },
									end: { x: ex, y: ey }
								})
							}

							break
					}
				})

				return
			}
		} else {

			if (selectedId) {
				console.log('[DEBUG] Mouse button up and there is a selected element.')
				const transX = mousePos.x - startMousePos.x
				const transY = mousePos.y - startMousePos.y

				const selectedEleI = drawnEles.findIndex(ele => ele.id === selectedId)
				const selectedEle = drawnEles[selectedEleI]

				switch (selectedEle.name) {
					case 'free':
						selectedEle.points = selectedEle.points.map(p => ({ x: p.x + transX, y: p.y + transY }))
						break
				}

				// const newDrawnEles = drawnEles
				// newDrawnEles.splice(selectedEleI, 1)
				// newDrawnEles.push(updatedEle)

				setDrawnEles([selectedEle, ...drawnEles])
				setSelectedBoundingRect(prev => ({
					start: {
						x: prev.start.x + transX,
						y: prev.start.y + transY,
					}, end: {
						x: prev.end.x + transX,
						y: prev.end.y + transY,
					},
				}))
			} else {
				let newEle: Element | null = null
				let newEleId = uuid()

				switch (activeToolType) {
					case 'line':
						newEle = {
							id: newEleId,
							name: 'line',
							start: startMousePos,
							end: mousePos,
							type: activeLineType,
							width: drawWidth,
							color: drawColor,
							arrows: "no"
						}
						break

					case 'rectangle':
						newEle = {
							id: newEleId,
							name: 'rectangle',
							start: startMousePos,
							end: mousePos,
							lineType: activeLineType,
							lineWidth: drawWidth,
							color: drawColor,
							fill: false
						}
						break

					case 'ellipse':
						const centre: Point = {
							x: (startMousePos.x + mousePos.x) / 2,
							y: (startMousePos.y + mousePos.y) / 2
						}

						newEle = {
							id: newEleId,
							name: 'ellipse',
							centre: centre,
							radiusX: Math.abs(mousePos.x - startMousePos.x) / 2,
							radiusY: Math.abs(mousePos.y - startMousePos.y) / 2,
							lineType: activeLineType,
							lineWidth: drawWidth,
							color: drawColor,
							fill: false
						}
						break

					case 'free':
						newEle = activeEle!
						break
				}

				// happens when the apps is loaded for the first time
				if (newEle === undefined || newEle === null) {
					return
				}

				if (newEle.name == 'free') {
					if (newEle.points.length <= 1)
						return

					const first_point = newEle.points[0]

					const a_ = newEle.points.length
					newEle.points = chaikinSmooth(newEle.points, 4)
					const b_ = newEle.points.length
					newEle.points = [first_point, ...douglasPeucker(newEle.points, 0.75)]
					const c_ = newEle.points.length

					console.log(`Original: ${a_} \nAfter Chaikin: ${b_} \nAfter Douglas-Peucker: ${c_}`)

					if (OUTPUT_STROKE_DATA)
						console.log(JSON.stringify(newEle.points))
					if (COPY_STROKE_DATA)
						navigator.clipboard.writeText(JSON.stringify(newEle.points))
				}

				setDrawnEles([...drawnEles, newEle])
				setActiveEle(null)

				if (isConnectedToRoom)
					socket.emit('new_drawn_Ele', { Ele: newEle, room_id: roomId })
			}
		}
	}, [mouseDown])

	useEffect(() => {
		console.log(`[DEBUG] Active tool type: ${activeToolType}`)

		switch (activeToolType) {
			case "line":
				setCanvasCursor(`url(${CanvasCursor}), crosshair`)
				break

			case "free":
				setCanvasCursor(`url(${CanvasCursor}), crosshair`)
				break

			case "rectangle":
				setCanvasCursor('crosshair')
				break

			case "ellipse":
				setCanvasCursor('crosshair')
				break

			case "eraser":
				setCanvasCursor('pointer')
				break
		}
	}, [activeToolType])

	// socket io
	useEffect(() => {
		console.log('[DEBUG] Socket.io use effect called.')

		function onConnect() {
			setIsIoServerConnected(true)
		}

		function onDisconnect() {
			setIsIoServerConnected(false)
		}

		function onMsg(data_: string) {
			const data = JSON.parse(data_)
			notificationsApi.info({
				message: `Message from ${data.sid}`,
				description: data.text
			})
		}

		const onAddNewDrawEle = (data: any) => {
			setDrawnEles(prev => [...prev, data as Element])
		}

		socket.on('connect', onConnect)
		socket.on('disconnect', onDisconnect)
		socket.on('msg', onMsg)
		socket.on('add_new_drawn_Ele', onAddNewDrawEle)

		return () => {
			socket.off('connect', onConnect)
			socket.off('disconnect', onDisconnect)
			socket.off('msg', onMsg)
			socket.off('add_new_drawn_Ele', onAddNewDrawEle)
		}
	}, [])

	// draw function
	const drawDrawnEles = (context: CanvasRenderingContext2D) => {
		console.log('[DEBUG] Drawing drawn Eles.')

		context.lineCap = 'round'
		context.lineJoin = 'round'

		context.save()

		drawnEles.forEach(drawnEle => {
			switch (drawnEle.name) {
				case "line":
					drawLine(
						context,
						drawnEle.start,
						drawnEle.end,
						drawnEle.color,
						drawnEle.width,
						drawnEle.type
					)
					break

				case "rectangle":
					drawRect(
						context,
						drawnEle.start,
						drawnEle.end,
						drawnEle.color,
						drawnEle.lineWidth,
						drawnEle.lineType
					)

					break

				case "ellipse":
					drawEllipse(
						context,
						drawnEle.centre,
						drawnEle.radiusX,
						drawnEle.radiusY,
						drawnEle.color,
						drawnEle.lineWidth,
						drawnEle.lineType
					)
					break

				case "free":
					drawStorke(
						context,
						drawnEle.points,
						drawnEle.color,
						drawnEle.lineWidth,
						drawnEle.lineType
					)
			}
		})
	}

	// event listeners
	const handleMouseMove = (event: MouseEvent) => {
		const canvas = canvasRef!.current!
		const canvasRect = canvas.getBoundingClientRect()

		const mouseX = Math.round(event.clientX - canvasRect.left)
		const mouseY = Math.round(event.clientY - canvasRect.top)

		setMousePos({ x: mouseX, y: mouseY })
	}

	const onCanvasClick = (_event: any) => {
		// console.log('[DEBUG] HTML canvas click event (generally ignored as we have a custom implementation).')
	}

	// rendering
	return (
		<Context.Provider value={{}}>
			{notificationContextHolder}
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
						<div style={{
							position: 'relative',
							borderWidth: '2px',
							borderColor: 'black',
							cursor: canvasCursor,
							marginBottom: '20px'
						}}>
							<canvas
								ref={canvasRef}
								width={CANVAS_WIDTH_PX}
								height={CANVAS_HEIGHT_PX}
								style={{
									width: `${CANVAS_WIDTH_PX} px`,
									height: `${CANVAS_HEIGHT_PX} px`,
									backgroundColor: 'red',
									pointerEvents: 'none'
								}}
							/>

							<canvas
								ref={frontCanvasRef}
								width={CANVAS_WIDTH_PX}
								height={CANVAS_HEIGHT_PX}
								style={{
									width: `${CANVAS_WIDTH_PX} px`,
									height: `${CANVAS_HEIGHT_PX} px`,
									backgroundColor: 'transparent',
									position: 'absolute',
									top: 0,
									left: 0
								}}
								// onMouseMove={handleMouseMove}  NOTE: implemented
								onMouseDown={() => setMouseDown(true)}
								onMouseUp={() => setMouseDown(false)}
								onClick={onCanvasClick}
							/>
						</div>
						<Space direction="horizontal">
							<Radio.Group value={activeToolType} onChange={e => setActiveToolType(e.target.value)}>
								<Space direction="vertical">
									<Radio value="select">Select</Radio>
									<Radio value="line">Line</Radio>
									<Radio value="free">Free</Radio>
									<Radio value="rectangle">Rectangle</Radio>
									<Radio value="ellipse">Ellipse</Radio>
									<Radio value="eraser">Eraser</Radio>
								</Space>
							</Radio.Group>
							<Radio.Group value={activeLineType} onChange={e => setActiveLineType(e.target.value)}>
								<Space direction="vertical">
									<Radio value="simple">Simple</Radio>
									<Radio value="dashed">Dashed</Radio>
									<Radio value="dotted">Dotted</Radio>
								</Space>
							</Radio.Group>
							<Slider style={{ height: '100px' }} value={drawWidth} onChange={setDrawWidth} vertical max={10} min={0.5} step={0.5} />
							<ColorPicker value={drawColor} onChange={(_color, hex) => { setDrawColor(hex); console.log(`[DEBUG] New selected draw color: ${hex}`) }} />
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
				<Footer style={{ textAlign: 'center' }}>Made with ❤️ by <a href="https://github.com/ManbirJudge" target="_blank">Manbir Judge</a></Footer>
			</Layout>
		</Context.Provider>
	)
}

export default App
