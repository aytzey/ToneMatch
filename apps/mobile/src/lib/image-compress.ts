import * as ImageManipulator from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";

/**
 * Compress and resize an image for storage-efficient upload.
 * Wardrobe/clothing thumbnails are kept small (max 800px, quality 0.6).
 */
export async function compressForWardrobe(
  asset: ImagePickerAsset,
): Promise<ImagePickerAsset> {
  const maxDimension = 800;
  const quality = 0.6;

  const needsResize =
    (asset.width && asset.width > maxDimension) ||
    (asset.height && asset.height > maxDimension);

  const actions: ImageManipulator.Action[] = needsResize
    ? [
        asset.width && asset.height && asset.width >= asset.height
          ? { resize: { width: maxDimension } }
          : { resize: { height: maxDimension } },
      ]
    : [];

  const result = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return {
    ...asset,
    uri: result.uri,
    width: result.width,
    height: result.height,
    mimeType: "image/jpeg",
  };
}

/**
 * Compress selfie for upload — moderate quality since it's deleted after analysis.
 * AI analysis doesn't need full resolution.
 */
export async function compressForAnalysis(
  asset: ImagePickerAsset,
): Promise<ImagePickerAsset> {
  const maxDimension = 1024;
  const quality = 0.7;
  const width = asset.width ?? 0;
  const height = asset.height ?? 0;

  const needsResize =
    (width && width > maxDimension) ||
    (height && height > maxDimension);

  const canCrop = width >= 640 && height >= 640;
  const isPortrait = width > 0 && height > width;
  const cropWidthRatio = isPortrait ? 0.84 : 0.74;
  const cropHeightRatio = isPortrait ? 0.9 : 0.82;
  const cropWidth = canCrop ? Math.round(width * cropWidthRatio) : width;
  const cropHeight = canCrop ? Math.round(height * cropHeightRatio) : height;
  const originX = canCrop ? Math.max(0, Math.round((width - cropWidth) / 2)) : 0;
  const originY = canCrop ? Math.max(0, Math.round((height - cropHeight) / 2)) : 0;
  const targetWidth = canCrop ? cropWidth : width;
  const targetHeight = canCrop ? cropHeight : height;

  const actions: ImageManipulator.Action[] = [];

  if (canCrop) {
    actions.push({
      crop: {
        originX,
        originY,
        width: cropWidth,
        height: cropHeight,
      },
    });
  }

  if (needsResize) {
    actions.push(
      targetWidth >= targetHeight
        ? { resize: { width: maxDimension } }
        : { resize: { height: maxDimension } },
    );
  }

  const result = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return {
    ...asset,
    uri: result.uri,
    width: result.width,
    height: result.height,
    mimeType: "image/jpeg",
  };
}
