declare const SystemInfo: { pixelWidth: number; pixelRatio: number };

export const calculateEstimatedSize = (
  pictureWidth: number,
  pictureHeight: number,
): number => {
  const galleryPadding = 20;
  const galleryMainAxisGap = 10;
  const gallerySpanCount = 2;
  const galleryWidth = SystemInfo.pixelWidth / SystemInfo.pixelRatio;
  const itemWidth = (galleryWidth - galleryPadding * 2 - galleryMainAxisGap)
    / gallerySpanCount;
  return (itemWidth / pictureWidth) * pictureHeight;
};
