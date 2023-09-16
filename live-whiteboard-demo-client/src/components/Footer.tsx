import { Footer as AntDFooter } from "antd/es/layout/layout"

const Footer = () => {
    return (
        <AntDFooter
            style={{ textAlign: 'center' }}
        >
            Made with ❤️ by <a style={{ cursor: 'link' }} href="https://github.com/ManbirJudge" target="_blank">Manbir Judge</a>
        </AntDFooter>
    )
}

export default Footer