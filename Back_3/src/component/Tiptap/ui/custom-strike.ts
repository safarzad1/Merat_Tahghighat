import Strike from "@tiptap/extension-strike";

export const CustomStrike = Strike.extend({
    addAttributes() {
        return {
            style: {
                default: "background-color: #ff4d4d; color: white; padding: 2px; border-radius: 3px;",
            },
        };
    },
});
