import React, { CSSProperties } from 'react';
import { useQuery } from 'react-query';
import { environment } from '../globals';
import { ApiUrl, apiUrlToImageSource } from '../services/storageService';
import { useDarkModeStore } from '../stores/darkMode';

interface CustomImageProps {
    imageUrl: ApiUrl | string;
    width: CSSProperties['width'];
    height: CSSProperties['height'];
    color?: CSSProperties['color'];
    preserveColor?: boolean;
    style?: CSSProperties;
}

export const CustomImage: React.FC<CustomImageProps> = ({ imageUrl, width, height, color, preserveColor, style }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const { data: imgSrc } = useQuery({
        queryKey: ['getCustomImage', imageUrl],
        queryFn: async () => {
            if (!imageUrl.startsWith('/api/files')) return imageUrl;
            return apiUrlToImageSource(imageUrl as ApiUrl);
        },
    });

    const customProps: React.ComponentProps<'img'> = preserveColor
        ? { src: imgSrc, style }
        : {
              style: {
                  ...style,
                  backgroundColor: color || (darkMode ? '#FFFFFF' : '#000000'),
                  WebkitMaskImage: `url(${imgSrc})`,
                  WebkitMaskSize: 'contain',
              },
          };

    return <img height={height} width={width} {...customProps} />;
};

interface CustomIconProps extends Omit<CustomImageProps, 'imageUrl'> {
    iconUrl: string;
}

export const CustomIcon: React.FC<CustomIconProps> = ({ iconUrl, width, height, color, preserveColor = false, style }) => {
    return (
        <CustomImage
            imageUrl={`/api${environment.api.storage}/${iconUrl}`}
            width={width}
            height={height}
            color={color}
            preserveColor={preserveColor}
            style={style}
        />
    );
};
