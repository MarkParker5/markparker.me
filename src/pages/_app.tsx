import { AppPropsType } from 'next/dist/shared/lib/utils'
import '../../styles/globals.css'
import { Footer } from '../components/footer'
import { DesignToggleProvider } from '../design-toggles'

declare global {
  // it's important to have an interface here to append to the global type
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    gtag?: (...args: unknown[]) => void
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
  return (
    <DesignToggleProvider>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 pt-10">
          <Component {...pageProps} />
        </div>
        <Footer />
      </div>
    </DesignToggleProvider>
  )
}
