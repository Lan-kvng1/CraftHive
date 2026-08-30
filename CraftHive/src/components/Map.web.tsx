import React from 'react';
import { View, Text } from 'react-native';

export const Marker = ({ children, ...props }: any) => <View {...props}>{children}</View>;
export const Polyline = ({ children, ...props }: any) => <View {...props}>{children}</View>;
export const PROVIDER_GOOGLE = 'google';

export default function MapView({ children, style }: any) {
  return (
    <View style={[style, { backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#CBD5E1' }]}>
      <Text style={{ fontSize: 24, marginBottom: 4 }}>🗺️</Text>
      <Text style={{ color: '#475569', fontSize: 13, fontWeight: '600' }}>Live Map (Mobile Only)</Text>
      <Text style={{ color: '#64748B', fontSize: 11, marginTop: 4, textAlign: 'center', paddingHorizontal: 10 }}>
        Maps are fully functional on the Android and iOS apps.
      </Text>
      <View style={{ display: 'none' }}>
          {children}
      </View>
    </View>
  );
}
