import { CSSProperties, createContext, useEffect, useRef, useState } from "react"
import { Layout, Radio, Space, ColorPicker, Button, Slider, notification, Card, Dropdown, InputNumber } from "antd"
import { Content } from "antd/es/layout/layout"
import Input from "antd/es/input/Input"
import { DeleteFilled, CopyFilled, DownOutlined } from '@ant-design/icons'
import { v4 as uuid } from "uuid"

import PencilCursor from './assets/pencil.cur'
import EraserCursor from './assets/eraser.cur'

import { Point, LineType, Element, Stroke } from "./types/Element"
import BoundingBox from "./types/BoundingBox"
import { drawRect, drawElement, drawCircle } from "./utils/CanvasUtils"
import { calcBoundingBox, pointInsideBoundingBox } from "./utils/BoundingBoxUtils"
import { circleInteresectsBox, circleIntersectsEllipse, circleIntersectsStroke, lineSegmentIntersectsCircle, pointInsideBox, pointInsideCircle, throttle } from "./utils/Utils"
import { translateElement } from "./utils/ShapeUtils"
import { randomColorHex } from "./utils/ColorUtils"
import chaikinSmooth from "./algorithms/ChaikinSmooth"
import douglasPeucker from "./algorithms/DouglasPeucker"
import { socket } from "./socket"
import Appbar from "./components/Appbar"
import Footer from "./components/Footer"

const CANVAS_WIDTH_PX = 1400
const CANVAS_HEIGHT_PX = 800
// const CANVAS_WIDTH_PX = 800
// const CANVAS_HEIGHT_PX = 600

const OUTPUT_STROKE_DATA = false
const COPY_STROKE_DATA = true

const DEBUG_COLOR = '#4287f5'

const Context = createContext({})

const selectPopupLineTypeMenuItems = [
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
	const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 })
	const [startMousePos, setStartMousePos] = useState<Point>({ x: 0, y: 0 })

	const [mouseDown, setMouseDown] = useState<boolean>(false)

	// canavas vars
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const frontCanvasRef = useRef<HTMLCanvasElement | null>(null)

	const [canvasCursor, setCanvasCursor] = useState<CSSProperties['cursor']>(`url(${PencilCursor}), crosshair`)
	const [drawColor, setDrawColor] = useState<string>(randomColorHex())
	const [drawWidth, setDrawWidth] = useState<number>(3)

	const [activeToolType, setActiveToolType] = useState<string>('stroke')
	const [activeLineType, setActiveLineType] = useState<LineType>('simple')

	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [selectedBoundingRect, setSelectedBoundingRect] = useState<BoundingBox>({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 } })

	const [activeEle, setActiveEle] = useState<Element | null>(null)
	const [drawnEles, setDrawnEles] = useState<Array<Element>>([])

	// canvas selection tooltip container vars
	const [selectionPopupColor, setSelectionPopupColor] = useState<string>(randomColorHex())
	const [selectionPopupActiveLineType, setSelectionPopupActiveLineType] = useState<string>('simple')
	const [selectionPopupLineWidth, setSelectionPopupLineWidth] = useState<number>(3)

	// use effects
	useEffect(() => {
		const throttledHandleMouseMove = throttle((event) => {
			handleMouseMove(event)
		}, 10)

		frontCanvasRef!.current!.addEventListener('mousemove', throttledHandleMouseMove)

		return () => {
			frontCanvasRef!.current!.removeEventListener('mousemove', throttledHandleMouseMove)
		}
	})

	useEffect(() => {
		const frontCanvas = frontCanvasRef!.current!
		const frontRect = frontCanvas.getBoundingClientRect()
		const frontContext = frontCanvas.getContext('2d')!

		// clearing the front canvas
		frontContext.clearRect(0, 0, frontRect.width, frontRect.height)
		frontContext.fillStyle = 'transparent'
		frontContext.fillRect(0, 0, frontRect.width, frontRect.height)

		// calculating somethings
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
			} else if (activeToolType === 'eraser') {
				const erasedElesI: number[] = []
				const erasedElesIds: string[] = []

				drawnEles.forEach((ele, i) => {
					switch (ele.name) {
						case "line":
							if (lineSegmentIntersectsCircle(ele.start, ele.end, mousePos, drawWidth)) {
								erasedElesI.push(i)
								erasedElesIds.push(ele.id)
							}

							break

						case "rectangle":
							if (circleInteresectsBox(ele.start, ele.end, mousePos, drawWidth) || pointInsideBox(mousePos, { start: ele.start, end: ele.end })) {
								erasedElesI.push(i)
								erasedElesIds.push(ele.id)
							}

							break

						case "ellipse":
							if (circleIntersectsEllipse(mousePos, drawWidth, ele.center, ele.radiusX, ele.radiusY)) {
								erasedElesI.push(i)
								erasedElesIds.push(ele.id)
							}

							break

						case "stroke":
							if (circleIntersectsStroke(mousePos, drawWidth, ele.points)) {
								erasedElesI.push(i)
								erasedElesIds.push(ele.id)
							}

							break
					}
				})

				if (erasedElesI.length > 0) {
					deleteDrawnElements(erasedElesIds)
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
							lineType: activeLineType,
							lineWidth: drawWidth,
							color: drawColor,
							arrows: false
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
						const center: Point = {
							x: (startMousePos.x + mousePos.x) / 2,
							y: (startMousePos.y + mousePos.y) / 2
						}

						newActiveEle = {
							id: newActiveEleId,
							name: 'ellipse',
							center: center,
							radiusX: Math.abs(mousePos.x - startMousePos.x) / 2,
							radiusY: Math.abs(mousePos.y - startMousePos.y) / 2,
							lineType: activeLineType,
							lineWidth: drawWidth,
							color: drawColor,
							fill: false
						}
						break

					case "stroke":
						if (activeEle !== null && activeEle.name === 'stroke') {
							const newActiveStrokeEle: Stroke = activeEle
							newActiveStrokeEle.points.push(mousePos)

							newActiveEle = newActiveStrokeEle
						} else {
							newActiveEle = {
								id: newActiveEleId,
								name: 'stroke',
								lineType: activeLineType,
								lineWidth: drawWidth,
								color: drawColor,
								points: [startMousePos]
							}
						}
						break

					default:
						newActiveEle = null
						break
				}
			}
		}

		setActiveEle(newActiveEle)

		// drawing eraser
		if (activeToolType === 'eraser')
			drawCircle(frontContext, mousePos, drawWidth, '#BFBFBFA3', 1.5, 'dashed')

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
						setCanvasCursor(`url(${PencilCursor}), crosshair`)
						break

					case "stroke":
						setCanvasCursor(`url(${PencilCursor}), crosshair`)
						break

					case "rectangle":
						setCanvasCursor('crosshair')
						break

					case "ellipse":
						setCanvasCursor('crosshair')
						break

					case "eraser":
						setCanvasCursor(`URL(${EraserCursor}), crosshair`)
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
		if (mouseDown) {
			setStartMousePos(mousePos)

			if (!(selectedId && pointInsideBox(mousePos, selectedBoundingRect))) {
				setSelectedId(null)
			}

			if (activeToolType === 'select') {
				drawnEles.forEach(ele => {
					const bbox = calcBoundingBox(ele)

					if (pointInsideBoundingBox(mousePos, bbox)) {
						console.log(`[DEBUG] Element selected: ${ele.id}`)

						setSelectedId(ele.id)
						setSelectedBoundingRect(bbox)

						return
					}
				})
			}
		} else {
			if (selectedId) {
				const trans = {
					x: mousePos.x - startMousePos.x,
					y: mousePos.y - startMousePos.y
				}

				updateDrawnElement(translateElement({ ...drawnEles.find(ele => ele.id === selectedId)! }, trans))

				setSelectedBoundingRect(prev => ({
					start: {
						x: prev.start.x + trans.x,
						y: prev.start.y + trans.y,
					},
					end: {
						x: prev.end.x + trans.x,
						y: prev.end.y + trans.y,
					},
				}))

				return
			}

			let newEle: Element | null = null
			let newEleId = uuid()

			switch (activeToolType) {
				case 'line':
					newEle = {
						id: newEleId,
						name: 'line',
						start: startMousePos,
						end: mousePos,
						lineType: activeLineType,
						lineWidth: drawWidth,
						color: drawColor,
						arrows: false
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
					const center: Point = {
						x: (startMousePos.x + mousePos.x) / 2,
						y: (startMousePos.y + mousePos.y) / 2
					}

					newEle = {
						id: newEleId,
						name: 'ellipse',
						center: center,
						radiusX: Math.abs(mousePos.x - startMousePos.x) / 2,
						radiusY: Math.abs(mousePos.y - startMousePos.y) / 2,
						lineType: activeLineType,
						lineWidth: drawWidth,
						color: drawColor,
						fill: false
					}
					break

				case 'stroke':
					newEle = activeEle!
					break
			}

			// happens when the apps is loaded for the first time
			if (newEle === undefined || newEle === null) {
				return
			}

			if (newEle.name == 'stroke') {
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

			addDrawnElement(newEle)
			setActiveEle(null)

			if (isConnectedToRoom)
				socket.emit('new_drawn_element', { element: newEle, room_id: roomId })
		}
	}, [mouseDown])

	useEffect(() => {
		const frontCanvas = frontCanvasRef!.current!
		const frontRect = frontCanvas.getBoundingClientRect()
		const frontContext = frontCanvas.getContext('2d')!


		// clearing the front canvas
		frontContext.clearRect(0, 0, frontRect.width, frontRect.height)
		frontContext.fillStyle = 'transparent'
		frontContext.fillRect(0, 0, frontRect.width, frontRect.height)

		// if something was un-selected, skip the following steps
		if (selectedId === null)
			return

		const selectedEle = drawnEles.find(ele => ele.id === selectedId)!

		// drawing the bounding box
		drawRect(
			frontContext,
			selectedBoundingRect.start,
			selectedBoundingRect.end,
			DEBUG_COLOR,
			1.5,
			'dashed'
		)
		// drawBoundingBox(frontContext, selectedBoundingRect, drawnEles.find(ele => ele.id === selectedId)!)

		// setting up selection popup info
		setSelectionPopupColor(selectedEle.color)
		setSelectionPopupActiveLineType(selectedEle.lineType)
		setSelectionPopupLineWidth(selectedEle.lineWidth)
	}, [selectedId])

	useEffect(() => {
		if (selectedId === null)
			return

		const selectedEle = { ...drawnEles.find(val => val.id === selectedId)! }

		selectedEle.color = selectionPopupColor
		selectedEle.lineType = selectionPopupActiveLineType as LineType
		selectedEle.lineWidth = selectionPopupLineWidth

		updateDrawnElement(selectedEle)
	}, [selectionPopupColor, selectionPopupActiveLineType, selectionPopupLineWidth])

	useEffect(() => {
		// console.log(`[DEBUG] Drawn elements updated:\n${JSON.stringify(drawnEles)}`)
		console.log(`[DEBUG] Drawn elements updated.`)

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
		switch (activeToolType) {
			case "select":
				setCanvasCursor(`pointer`)
				break

			case "line":
				setCanvasCursor(`url(${PencilCursor}), crosshair`)
				break

			case "stroke":
				setCanvasCursor(`url(${PencilCursor}), crosshair`)
				break

			case "rectangle":
				setCanvasCursor('crosshair')
				break

			case "ellipse":
				setCanvasCursor('crosshair')
				break

			case "eraser":
				setCanvasCursor(`URL(${EraserCursor}), crosshair`)
				break

			case "default":
				setCanvasCursor('default')
				break
		}
	}, [activeToolType])

	// socket io
	const onDrawnElementAdded = (data: any) => {
		console.log('[DEBUG] Someone drew new element.')
		addDrawnElement(data.element, false)
	}
	const onDrawnElementUpdated = (data: any) => {
		console.log('[DEBUG] Someone updated drawn element.')
		updateDrawnElement(data.element, false)
	}
	const onDrawnElementsDeleted = (data: any) => {
		console.log('[DEBUG] Someone deleted drawn element(s).')
		deleteDrawnElements(data.element_ids, false)
	}

	useEffect(() => {
		function onConnect() {
			setIsIoServerConnected(true)
		}

		function onDisconnect() {
			setIsIoServerConnected(false)
		}

		function onMsg(data: any) {
			notificationsApi.info({
				message: `Message from ${data.sid}`,
				description: data.text
			})
		}

		socket.on('connect', onConnect)
		socket.on('disconnect', onDisconnect)
		socket.on('msg', onMsg)

		socket.on('connected_to_room', ({ room_id }) => setRoomId(room_id))
		socket.on('drawn_element_added', onDrawnElementAdded)
		socket.on('drawn_element_updated', onDrawnElementUpdated)
		socket.on('drawn_elements_deleted', onDrawnElementsDeleted)

		return () => {
			socket.off('connect', onConnect)
			socket.off('disconnect', onDisconnect)
			socket.off('msg', onMsg)
			socket.off('drawn_element_added', onDrawnElementAdded)
			socket.off('drawn_element_updated', onDrawnElementUpdated)
			socket.off('drawn_element_deleted', (ele_id: string) => console.log(`[DEBUG] Element deleted: ${ele_id}`))
		}
	})

	// drawn element(s) functions
	const addDrawnElement = (ele: Element, emit: boolean = true) => {
		setDrawnEles([ele, ...drawnEles])
		drawDrawnEles(frontCanvasContext())

		if (emit && isIoServerConnected && isConnectedToRoom) {
			socket.emit('add_drawn_element', {
				element: ele,
				room_id: roomId
			})
		}
	}

	const updateDrawnElement = (ele: Element, emit: boolean = true) => {
		setDrawnEles(drawnEles.map(ele_ => ele_.id === ele.id ? ele : ele_))
		drawDrawnEles(frontCanvasContext())

		if (emit && isIoServerConnected && isConnectedToRoom) {
			socket.emit('update_drawn_element', {
				element: ele,
				room_id: roomId
			})
		}
	}

	const deleteDrawnElements = (eleIds: Array<string>, emit: boolean = true) => {
		setDrawnEles(drawnEles.filter(ele => !eleIds.includes(ele.id)))
		drawDrawnEles(frontCanvasContext())

		if (emit && isIoServerConnected && isConnectedToRoom) {
			socket.emit('delete_drawn_elements', {
				element_ids: eleIds,
				room_id: roomId
			})
		}
	}

	// shortcuts
	useEffect(() => {
		document.addEventListener('keydown', handleKeyDown)

		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	})

	// utits
	const frontCanvasContext = () => {
		return canvasRef!.current!.getContext('2d')!
	}

	// draw function
	const drawDrawnEles = (context: CanvasRenderingContext2D) => {
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
		let handled = false

		// console.log(`[DEBUG]Some key is down:\nKey code (ASCII Code): ${event.keyCode}\nCharacter code (Unicode): ${event.charCode}\nCode (all info): ${event.code}\nKey (final expected result): ${event.key}`)

		if (event.code === 'Delete') {
			if (selectedId !== null) {
				const selectedEleI = drawnEles.findIndex(ele => ele.id === selectedId)

				const updatedDrawnEles = drawnEles
				updatedDrawnEles.splice(selectedEleI, 1)

				handled = true
			}
		}
		else if (event.code === 'KeyD') {
			console.log(drawnEles)

			handled = true
		}

		if (handled)
			event.preventDefault()
	}

	const onMouseLeaveFrontCanvas = () => {
		const frontCanvas = frontCanvasRef!.current!
		const frontRect = frontCanvas.getBoundingClientRect()
		const frontContext = frontCanvas.getContext('2d')!

		// clearing the front canvas
		frontContext.clearRect(0, 0, frontRect.width, frontRect.height)
		frontContext.fillStyle = 'transparent'
		frontContext.fillRect(0, 0, frontRect.width, frontRect.height)

		// select element bounding box
		if (selectedId !== null) {
			drawRect(
				frontContext,
				selectedBoundingRect.start,
				selectedBoundingRect.end,
				DEBUG_COLOR,
				1.5,
				'dashed'
			)
		}
	}

	const onSelectionPopupDeleteBtnClick = () => {
		deleteDrawnElements([selectedId!])
		setSelectedId(null)
	}

	const onSaveAsImageClicked = () => {
		const canvas = canvasRef!.current!
		const link = document.createElement('a')

		const imageDataURL = canvas.toDataURL('image/png')

		link.href = imageDataURL
		link.download = 'canvas.png'

		link.click()
	}

	// rendering
	return (
		<Context.Provider value={{}}>
			{notificationContextHolder}
			<Layout className="layout">
				<Appbar />
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
								onMouseLeave={onMouseLeaveFrontCanvas}
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
									<ColorPicker value={selectionPopupColor} onChangeComplete={color => { setSelectionPopupColor(color.toHexString()) }} size='small' />
									<Dropdown menu={{ items: selectPopupLineTypeMenuItems, onClick: info => { setSelectionPopupActiveLineType(info.key) } }} trigger={['click']} arrow>
										<Button
											size='small'
											icon={<DownOutlined />}
										>
											{`${selectPopupLineTypeMenuItems!.find(val => val!.key === selectionPopupActiveLineType)!.label}`}
										</Button>
									</Dropdown>
									<InputNumber size='small' min={0.5} max={10} step={0.5} value={selectionPopupLineWidth} onChange={val => val ? setSelectionPopupLineWidth(val) : null} />
									<Button size='small' icon={<CopyFilled />} />
									<Button size='small' icon={<DeleteFilled />} onClick={onSelectionPopupDeleteBtnClick} type="primary" />
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
									<Radio value="stroke">Stroke</Radio>
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
							<Slider style={{ height: '100px' }} value={drawWidth} onChange={setDrawWidth} vertical max={activeToolType !== 'eraser' ? 10 : 40} min={0.5} step={0.5} />
							<ColorPicker value={drawColor} showText={true} onChangeComplete={color => { setDrawColor(color.toHexString()); console.log(`[DEBUG] New selected draw color: ${color}`) }} />
							<Button type="primary" onClick={onSaveAsImageClicked}>Save as Image</Button>
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
				<Footer />
			</Layout>
		</Context.Provider>
	)
}

export default App
