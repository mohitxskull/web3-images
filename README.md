# WEB3 Images

## Description

An simple api to upload images and resize them using web3.storage and sharp.

- Resize, convert, and optimize images on the fly, using the Sharp module.

- Generate tokens to upload images without giving up your api key.

```typescript
const options = { method: 'GET' }

fetch('http://127.0.0.1:3333/api/token?key=<api key>&use=2', options)
  .then((response) => response.json())
  .then((response) => console.log(response))
  .catch((err) => console.error(err))
```

```typescript
const form = new FormData()

form.append('token', 'cllpynxpr0001wpmhgmpvgjos')
form.append('image', 'image')

const options = {
  method: 'POST',
  headers: { 'content-type': 'multipart/form-data; boundary=---011000010111000001101001' },
}

options.body = form

fetch('http://127.0.0.1:3333/api/upload/token', options)
  .then((response) => response.json())
  .then((response) => console.log(response))
  .catch((err) => console.error(err))
```

## Example (React)

```tsx
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
        `/ser/image/get?cuid=${cuid}&width=${width}&height=${height}&quality=${quality}&format=${format}`
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
    <img src={RealSrc} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
  )
}

export default function Test() {
  return (
    <ImgComp
      src="cllpg2u1s00028emhgukrc23w"
      alt="test"
      width={1000}
      height={500}
      quality={100}
      format="webp"
    />
  )
}
```

## TODO

- Add option to add multiple web3.storage api keys and balance storage between them
- React image component to call service and display image
- Admin page to manage web3.storage api keys and api keys
- Improve docker file to use multi-stage build and reduce image size
- Auto clean up images last used more than 30 days ago
