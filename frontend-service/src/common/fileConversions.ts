const urlToFile = async (imageUrl: string, imageName: string) => {
    const response = await fetch(imageUrl!);
    const blob = await response.blob();
    return new File([blob], `${imageName!}.png`);
};

export default urlToFile;
