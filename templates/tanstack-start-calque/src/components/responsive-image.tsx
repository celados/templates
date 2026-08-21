import type { ImgHTMLAttributes } from 'react'

import image from '@/assets/ssg-demo.png?w=960&format=webp&as=metadata'
import avifSrcset from '@/assets/ssg-demo.png?w=480;960&format=avif&as=srcset'
import webpSrcset from '@/assets/ssg-demo.png?w=480;960&format=webp&as=srcset'

type ResponsiveImageProps = Omit<
	ImgHTMLAttributes<HTMLImageElement>,
	'alt' | 'height' | 'src' | 'srcSet' | 'width'
> & {
	alt: string
	sizes?: string
}

export function ResponsiveImage(props: ResponsiveImageProps) {
	const {
		alt,
		sizes = '(min-width: 48rem) 42rem, 100vw',
		...imageProps
	} = props
	const { height, src, width } = image
	return (
		<picture>
			<source sizes={sizes} srcSet={avifSrcset} type="image/avif" />
			<source sizes={sizes} srcSet={webpSrcset} type="image/webp" />
			<img
				{...imageProps}
				alt={alt}
				decoding="async"
				height={height}
				loading="lazy"
				sizes={sizes}
				src={src}
				width={width}
			/>
		</picture>
	)
}
