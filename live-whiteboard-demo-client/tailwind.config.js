import { nextui } from "@nextui-org/react"

export const content = [
	"./index.html",
	"./src/**/*.{html,js}",
	"./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
]
export const theme = {
	extend: {},
}
export const darkMode = "class"
export const plugins = [nextui()]

