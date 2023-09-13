import { CSSProperties, createContext, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Layout, Image, Radio, Space, ColorPicker, Button, Slider, notification, Card, Dropdown, MenuProps, InputNumber } from "antd"
import { Header, Content, Footer } from "antd/es/layout/layout"
import Input from "antd/es/input/Input"
import Title from "antd/es/typography/Title"
import { GithubFilled, DeleteFilled, CopyFilled, DownOutlined } from '@ant-design/icons'
import { v4 as uuid } from "uuid"

import Logo from './assets/icon.svg'
import CanvasCursor from './assets/cursor.cur'

import { Point, LineType, Element, Free } from "./types/Element"
import { drawRect, drawElement } from "./utils/CanvasUtils"
import chaikinSmooth from "./algorithms/ChaikinSmooth"
import douglasPeucker from "./algorithms/DouglasPeucker"
import { socket } from "./socket"
import BoundingBox from "./types/BoundingBox"
import { pointInsideBox, pointInsideCircle, throttle } from "./utils/Utils"
import { calcBoundingBox, pointInsideBoundingBox } from "./utils/BoundingBoxUtils"
import { translateElement } from "./utils/ShapeUtils"

// const CANVAS_WIDTH_PX = 1400
// const CANVAS_HEIGHT_PX = 800
const CANVAS_WIDTH_PX = 800
const CANVAS_HEIGHT_PX = 600

const OUTPUT_STROKE_DATA = false
const COPY_STROKE_DATA = false

const DEBUG_COLOR = '#4287f5'

const Context = createContext({})

const elementSelectPopupLineTypeMenuItems: MenuProps['items'] = [
	{
		label: 'Simple',
		key: 'simple',
	},
	{
		label: 'Dashed',
		key: 'dashed',
	},
	{
		label: 'Dotted',
		key: 'dotted',
	},
]


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

	const [canvasCursor, setCanvasCursor] = useState<CSSProperties['cursor']>(`url(${CanvasCursor}), crosshair`)
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

		setActiveEle(newActiveEle)

		// selected ele things
		let actualBoundingRect = newSelectedBoundingRect !== null ? newSelectedBoundingRect : selectedBoundingRect

		if (selectedId !== null) {
			const selectedEle = drawnEles.find(ele => ele.id === selectedId)!

			// drawing the bounding box
			drawRect(
				frontContext,
				actualBoundingRect.start,
				actualBoundingRect.end,
				DEBUG_COLOR,
				1.5,
				'dashed'
			)
			// drawBoundingBox(frontContext, actualBoundingRect, drawnEles.find(ele => ele.id === selectedId)!)

			// mouse cursor
			if (pointInsideBox(mousePos, actualBoundingRect)) {
				let newCursor: CSSProperties['cursor'] = 'move'

				switch (selectedEle.name) {
					case 'line':
						if (pointInsideCircle(mousePos, selectedEle.start, 10)) {
							newCursor = 'crosshair'
						}
						if (pointInsideCircle(mousePos, selectedEle.end, 10)) {
							newCursor = 'crosshair'
						}

						break
				}

				setCanvasCursor(newCursor)
			} else {
				switch (activeToolType) {
					case "select":
						setCanvasCursor('pointer')
						break

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

		// active ele
		if (newActiveEle !== null && mouseDown) {
			// drawing
			drawElement(frontContext, newActiveEle)
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
		// drawBoundingBox(frontContext, selectedBoundingRect, drawnEles.find(ele => ele.id === selectedId)!)
	}, [selectedId])

	useLayoutEffect(() => {
		console.log('[DEBUG] Drawn elements updated.')

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
				drawnEles.forEach(ele => {
					const bbox = calcBoundingBox(ele)

					if (pointInsideBoundingBox(mousePos, bbox)) {
						setSelectedId(ele.id)
						setSelectedBoundingRect(bbox)

						return // TODO: toggle between overlapping objects if mouse button is pressed on that overlapping area
					}
				})

				return
			}
		} else {
			if (selectedId) {
				const trans = {
					x: mousePos.x - startMousePos.x,
					y: mousePos.y - startMousePos.y
				}

				const selectedEleI = drawnEles.findIndex(ele => ele.id === selectedId)
				const selectedEle = drawnEles[selectedEleI]
				const updatedEle = translateElement(selectedEle, trans)


				setDrawnEles([updatedEle, ...drawnEles])
				setSelectedBoundingRect(prev => ({
					start: {
						x: prev.start.x + trans.x,
						y: prev.start.y + trans.y,
					}, end: {
						x: prev.end.x + trans.x,
						y: prev.end.y + trans.y,
					},
				}))

				socket.emit('update_drawn_element', {
					element: updatedEle,
					room_id: roomId
				})
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
					socket.emit('new_drawn_element', { element: newEle, room_id: roomId })
			}
		}
	}, [mouseDown])

	useEffect(() => {
		switch (activeToolType) {
			case "select":
				setCanvasCursor(`pointer`)
				break

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

			case "default":
				setCanvasCursor('default')
				break
		}
	}, [activeToolType])

	// socket io
	const onDrawnElementAdded = (data: Element) => {
		console.log('[DEBUG] Someone drew new element.')

		setDrawnEles(prev => [...prev, data])
		drawDrawnEles(frontCanvasContext())
	}
	const onDrawnElementUpdated = (updatedEle: Element) => {
		const updatedEleId = updatedEle.id

		const updatedDrawnEles = drawnEles.map(ele => {
			if (ele.id === updatedEleId) {
				return updatedEle
			} else {
				return ele
			}
		})

		console.log(drawnEles)
		console.log(updatedDrawnEles)

		setDrawnEles(updatedDrawnEles)
		drawDrawnEles(frontCanvasContext())

		console.log('[DEBUG] Someone updated drawn element.')
	}

	useEffect(() => {
		function onConnect() {
			setIsIoServerConnected(true)

			socket.emit('join_room', roomId)
			setIsConnectedToRoom(true)
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

		socket.on('connect', onConnect)
		socket.on('disconnect', onDisconnect)
		socket.on('msg', onMsg)

		socket.on('drawn_element_added', onDrawnElementAdded)
		socket.on('drawn_element_updated', onDrawnElementUpdated)
		socket.on('drawn_element_deleted', (ele_id: string) => console.log(`[DEBUG] Element deleted: ${ele_id}`))

		return () => {
			socket.off('connect', onConnect)
			socket.off('disconnect', onDisconnect)
			socket.off('msg', onMsg)
			socket.off('drawn_element_added', onDrawnElementAdded)
			socket.off('drawn_element_updated', onDrawnElementUpdated)
			socket.off('drawn_element_deleted', (ele_id: string) => console.log(`[DEBUG] Element deleted: ${ele_id}`))
		}
	}, [])

	// shortcuts
	useEffect(() => {
		document.addEventListener('keydown', handleKeyDown);
	}, [])

	// utits
	const frontCanvasContext = () => {
		return canvasRef!.current!.getContext('2d')!
	}


	// draw function
	const drawDrawnEles = (context: CanvasRenderingContext2D) => {
		context.lineCap = 'round'
		context.lineJoin = 'round'

		context.save()

		drawnEles.forEach(drawnEle => {
			drawElement(context, drawnEle)
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

	const handleKeyDown = (event: KeyboardEvent) => {
		// event.preventDefault()

		console.log(`[DEBUG]Some key is down:\nKey code (ASCII Code): ${event.keyCode}\nCharacter code (Unicode): ${event.charCode}\nCode (all info): ${event.code}\nKey (final expected result): ${event.key}`)

		if (event.code == 'Delete') {
			if (selectedId !== null) {
				const selectedEleI = drawnEles.findIndex(ele => ele.id === selectedId)

				const updatedDrawnEles = drawnEles
				updatedDrawnEles.splice(selectedEleI, 1)
			}
		}
	}

	// rendering
	return (
		<Context.Provider value={{}}>
			{notificationContextHolder}
			<Layout className="layout">
				<Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<Space><div></div></Space>
					<Space direction="horizontal" size='middle'>
						<Image
							width={50}
							src={Logo}
							preview={false}
						/>
						<Title style={{ color: "#fff", margin: 0 }}>Live Whiteboard Demo</Title>
					</Space>
					<Space direction="horizontal" size='middle'>
						<Button icon={<GithubFilled />} href="https://github.com/ManbirJudge/live-whiteboard-demo" target="blank_" >
							Github
						</Button>
					</Space>
				</Header>
				<Content style={{ padding: '20px 30px' }}>
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center'
						}}
					>
						<div
							className='canvas_container'
							style={{
								position: 'relative',
								borderWidth: '2px',
								borderColor: 'black',
								cursor: canvasCursor,
								marginBottom: '20px'
							}}
						>
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
								onMouseDown={() => setMouseDown(true)}
								onMouseUp={() => setMouseDown(false)}
							/>
							{selectedId !== null ?
								<Card
									style={{
										width: 280,
										position: 'absolute',
										top: selectedBoundingRect.start.y - 60,
										left: selectedBoundingRect.start.x,
										pointerEvents: mouseDown ? 'none' : 'auto'
									}}
									bodyStyle={{
										display: 'flex',
										flexDirection: 'row',
										justifyContent: 'space-between'
									}}
									size='small'
								>
									<ColorPicker size='small'
									/>
									<Dropdown menu={{ items: elementSelectPopupLineTypeMenuItems }} trigger={['click']}>
										<Button size='small' icon={<DownOutlined />}>Simple</Button>
									</Dropdown>
									<InputNumber size='small' min={0.5} max={10} step={0.5} defaultValue={1.5} />
									<Button size='small' icon={<CopyFilled />} />
									<Button size='small' icon={<DeleteFilled />} />
								</Card>
								:
								<></>
							}
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
							<ColorPicker value={drawColor} showText={true} onChange={(_color, hex) => { setDrawColor(hex); console.log(`[DEBUG] New selected draw color: ${hex}`) }} />
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
