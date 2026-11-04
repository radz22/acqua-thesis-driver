import { useCssElement } from "react-native-css";
import React from "react";
import { StyleSheet } from "react-native";
import { Image as RNImage } from "expo-image";

type FlatStyle = Record<string, unknown>;

function CSSImage(props: React.ComponentProps<typeof RNImage>) {
  const flat = (StyleSheet.flatten(props.style) ?? {}) as FlatStyle;
  const { objectFit, objectPosition, ...style } = flat;

  return (
    <RNImage
      contentFit={objectFit as React.ComponentProps<typeof RNImage>["contentFit"]}
      contentPosition={objectPosition as React.ComponentProps<typeof RNImage>["contentPosition"]}
      {...props}
      source={typeof props.source === "string" ? { uri: props.source } : props.source}
      style={style}
    />
  );
}

export type ImageProps = React.ComponentProps<typeof CSSImage> & { className?: string };

export const Image = (props: ImageProps) => {
  return useCssElement(CSSImage, props, { className: "style" });
};

Image.displayName = "CSS(Image)";
