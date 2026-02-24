import React, {useEffect, useState} from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {TGC_COLORS} from '../../../theme/tgcTheme';

interface TribeCoverAvatarProps {
  name: string;
  coverImageUrl?: string | null;
  size?: number;
  borderRadius?: number;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  initialsTextStyle?: StyleProp<TextStyle>;
}

export default function TribeCoverAvatar({
  name,
  coverImageUrl,
  size = 48,
  borderRadius = size / 2,
  containerStyle,
  imageStyle,
  initialsTextStyle,
}: TribeCoverAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [coverImageUrl]);

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius,
        },
        containerStyle,
      ]}>
      {coverImageUrl && !imageFailed ? (
        <Image
          source={{uri: coverImageUrl}}
          style={[
            styles.image,
            {
              borderRadius,
            },
            imageStyle,
          ]}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {fontSize: size * 0.4},
            initialsTextStyle,
          ]}>
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(200,182,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(200,182,255,0.35)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: TGC_COLORS.lavender,
    fontWeight: '900',
  },
});
