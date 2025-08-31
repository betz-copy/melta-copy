const COORDINATE_DEFAULT_COLOR = '#FF006B';

export const getColoredLocationIcon = (color: string = COORDINATE_DEFAULT_COLOR) => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"
         viewBox="-12.8 -12.8 89.60 89.60" fill="${color}" stroke="${color}">
      <path d="M32,0C18.746,0,8,10.746,8,24c0,5.219,1.711,10.008,4.555,13.93
               l16,24C29.414,63.332,30.664,64,32,64s2.586-0.668,3.328-1.781l16-24
               C54.289,34.008,56,29.219,56,24C56,10.746,45.254,0,32,0z
               M32,32c-4.418,0-8-3.582-8-8s3.582-8,8-8s8,3.582,8,8S36.418,32,32,32z"/>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
