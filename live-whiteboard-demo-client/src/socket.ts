import { io } from 'socket.io-client'

const PROD_URL = 'http://192.168.0.105:8000'  // TODO: update
const DEV_URL = 'http://localhost:8000'

const URL = process.env.NODE_ENV === 'production' ? PROD_URL : DEV_URL

export const socket = io(URL)