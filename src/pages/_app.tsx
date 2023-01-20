import { AppPropsType } from 'next/dist/shared/lib/utils'
import '../../styles/globals.css'

declare global {
  // it's important to have an interface here to append to the global type
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    gtag: (a: string, b: string, c: Record<string, string>) => void
  }
}

if (process.env.NODE_ENV === 'development') {
  import('@impulse.dev/runtime')
    .then((impulse) => impulse.run())
    .catch((e) => {
      console.error('could not load impulse', e)
    })
}

export default function App({ Component, pageProps }: AppPropsType) {
  return <Component {...pageProps} />
}
