import type { AppProps } from 'next/app'
import '@/styles/globals.css'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Load Lumi H5P resizer script
    const script = document.createElement('script')
    script.src = 'https://app.lumi.education/api/v1/h5p/core/js/h5p-resizer.js'
    script.charset = 'UTF-8'
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return <Component {...pageProps} />
}
