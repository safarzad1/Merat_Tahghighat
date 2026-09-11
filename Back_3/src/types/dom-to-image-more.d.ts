declare module 'dom-to-image-more' {
    const toPng: (node: HTMLElement, options?: any) => Promise<string>;
    export { toPng };
    const toJpeg: (node: HTMLElement, options?: any) => Promise<string>;
    export { toJpeg };
    const toSvg: (node: HTMLElement, options?: any) => Promise<string>;
    export { toSvg };
    const toBlob: (node: HTMLElement, options?: any) => Promise<Blob>;
    export { toBlob };
    const toPixelData: (node: HTMLElement, options?: any) => Promise<Uint8ClampedArray>;
    export { toPixelData };
    export default { toPng, toJpeg, toSvg, toBlob, toPixelData };
}
