# WEB3 Images

## Description

An simple api to upload images and resize them using web3.storage and sharp.

## Example (React)

```tsx
import { Center, Image } from '@mantine/core'
import { useEffect, useState } from 'react'

interface ImgProps {
  src: string
  alt: string
  width: number
  height: number
  quality?: number
  format?: 'webp' | 'png' | 'jpg'
}

interface ResShape {
  status: number
  message: string
  data?: {
    url?: string
  }
}

const ImgComp = ({ src, alt, width, height, quality = 100, format = 'webp' }: ImgProps) => {
  const loadingGif = 'https://media.giphy.com/media/PkoBC2GlkLJ5yFIWtf/giphy.gif'

  const errGif = 'https://media.giphy.com/media/3oEduVhPTUAzqm03NS/giphy.gif'

  const FetchUrl = async (cuid: string) => {
    try {
      const res = await fetch(
        `http://localhost:3333/api/get?cuid=${cuid}&width=${width}&height=${height}&quality=${quality}&format=${format}`
      )

      const data: ResShape = await res.json()

      if (data.status === 200) {
        return data.data?.url || errGif
      }

      return errGif
    } catch (error) {
      return errGif
    }
  }

  const [RealSrc, setRealSrc] = useState(loadingGif)

  useEffect(() => {
    FetchUrl(src).then((url) => {
      setRealSrc(url)
    })
  }, [src, width, height, quality, format])

  return (
    <Image
      src={RealSrc}
      alt={alt}
      width={width}
      height={height}
      radius="xl"
      placeholder={<Image src={loadingGif} alt={alt} />}
    />
  )
}

export default function Test() {
  return (
    <Center h="100vh">
      <ImgComp
        src="clll23op8000201mx2jscdyhx" // cuid got from upload
        alt="test"
        width={1000}
        height={1000}
        quality={70}
        format="png"
      />
    </Center>
  )
}
```

## TODO

- Add option to add multiple web3.storage api keys and balance storage between them
- React image component to call service and display image
- Admin page to manage web3.storage api keys and api keys
- Improve docker file to use multi-stage build and reduce image size
- Auto clean up images last used more than 30 days ago
