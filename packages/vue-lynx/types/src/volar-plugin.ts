const nativeTags = ["block", "component", "template", "slot"];
export default () => ({
  version: 2,
  resolveTemplateCompilerOptions(options: Record<string, unknown>): Record<string, unknown> {
    options.isNativeTag = (tag: string) => nativeTags.includes(tag);
    return options;
  },
});
