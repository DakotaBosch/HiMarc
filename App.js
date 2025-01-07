import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const App = () => {
  // State to manage the text content
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Basic React Native App</Text>
      <Text style={styles.text}>You pressed the button {count} times</Text>
      <Button
        title="Press me"
        onPress={() => setCount(count + 1)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
  },
});

export default App;

