import Image from 'next/image'
import styles from './page.module.css'

import { Button, ButtonGroup } from "@nextui-org/button";

export default function Home() {
  return (

    <div>
      <a href="/home">To Homepage</a>
      <Button color="primary">Test</Button>
    </div>
  )
}
