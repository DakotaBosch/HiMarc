import React from 'react';
import { View, Text } from 'react-native';

export default function Explore() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
      }}
    >
      <Text style={{ color: 'white' }}>Explore New Features!</Text>
    </View>
  );
}

