import { Extension } from '@tiptap/core';

export const FontSize = Extension.create({
    name: 'fontSize',

    addGlobalAttributes() {
        return [
            {
                types: ['textStyle'] as string[],
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: (element: HTMLElement) => element.style.fontSize || null,
                        renderHTML: (attributes: { fontSize?: string }) => {
                            if (!attributes.fontSize) return {};
                            return { style: `font-size: ${attributes.fontSize}` };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setFontSize:
                (fontSize: string) =>
                    ({ chain }) => {
                        return chain().setMark('textStyle', { fontSize }).run();
                    },
        };
    },
});
