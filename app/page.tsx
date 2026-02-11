import ImageConverter from '@/components/ImageConverter'

export const metadata = {
  title: 'Image Converter',
  description: 'Convert images privately, entirely in your browser',
}

export default function Home() {
  return (
    <main>
      <ImageConverter />
    </main>
  )
}
