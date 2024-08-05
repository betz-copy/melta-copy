import React, { CSSProperties } from 'react';
import { useQuery } from 'react-query';
import axios from '../axios';
import { environment } from '../globals';
import { useDarkModeStore } from '../stores/darkMode';

interface CustomImageProps {
    imageUrl: string;
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
            if (!imageUrl.startsWith('/api')) return imageUrl;

            const { data } = await axios.get(imageUrl, { baseURL: '', responseType: 'blob' });
            return URL.createObjectURL(data);
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
