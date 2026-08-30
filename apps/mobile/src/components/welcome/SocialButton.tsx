import { Spacing } from "@/constants/theme";
import React from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

type SocialButtonPros = {
  onClick: (event: GestureResponderEvent) => void | null;
  icon: React.ReactElement;
  loading?: boolean;
};
const SocialButton = ({ onClick, icon, loading }: SocialButtonPros) => {
  return (
    <Pressable
      onPress={onClick}
      disabled={loading}
      style={({ pressed }) => [styles.frame, pressed && styles.pressed]}
    >
      <View style={styles.fill}>
        {loading ? <ActivityIndicator color="#000" /> : icon}
      </View>
    </Pressable>
  );
};

export default SocialButton;

const styles = StyleSheet.create({
  frame: {
    borderRadius: 21,
    backgroundColor: "lightgrey",
    padding: 2,
    paddingBottom: 5,
    paddingHorizontal: 3,
    marginTop: Spacing.four,
    flex:1,
    maxWidth:78
  },
  fill: {
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
