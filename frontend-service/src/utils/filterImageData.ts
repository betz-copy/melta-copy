export const filterImageData = (context, croppedCanvas, filteredCanvas) => {
    context.filter = 'grayscale(100%) contrast(150%) brightness(120%)';
    context.drawImage(croppedCanvas, 0, 0);

    const imageData = context.getImageData(0, 0, filteredCanvas.width, filteredCanvas.height);
    const { data } = imageData;

    // from https://github.com/giacomocerquone/react-perspective-cropper/blob/master/src/lib/imgManipulation.js
    for (let i = 0; i < data.length; i += 4) {
        // Calculate the brightness of the pixel (using the average of RGB values)
        const brightness = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];

        // Threshold: If brightness is above the threshold, make it white, otherwise black
        const threshold = 150;
        const color = brightness > threshold ? 255 : 0;

        // Set the new pixel color (RGB)
        data[i] = color; // Red
        data[i + 1] = color; // Green
        data[i + 2] = color; // Blue
    }

    context.putImageData(imageData, 0, 0);
};
