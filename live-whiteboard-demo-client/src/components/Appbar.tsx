import { GithubFilled } from "@ant-design/icons"
import { Space, Button, Image } from "antd"
import { Header } from "antd/es/layout/layout"
import Title from "antd/es/typography/Title"

import Logo from '../assets/icon.svg'

function Appbar() {
    return (
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
    )
}

export default Appbar