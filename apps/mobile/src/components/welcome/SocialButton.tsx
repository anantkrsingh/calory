import { Brand } from "@/app/auth/welcome";
import { Spacing } from "@/constants/theme";
import React from "react";
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type SocialButtonPros = {
  onClick: (event: GestureResponderEvent) => void | null;
  icon: React.ReactElement;
};
const SocialButton = ({ onClick, icon }: SocialButtonPros) => {
  return (
    <Pressable
      onPress={onClick}
      style={({ pressed }) => [styles.frame, pressed && styles.pressed]}
    >
      <View style={styles.fill}>{icon && icon}</View>
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
