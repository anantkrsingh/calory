import { NativeTabs } from "expo-router/unstable-native-tabs";

import { Brand } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export default function TabLayout() {
  const theme = useTheme();

  return (
    <NativeTabs
      backgroundColor={theme.background}
      tintColor={Brand.accent}
      iconColor={{ default: theme.textSecondary, selected: Brand.accent }}
      labelStyle={{
        default: { color: theme.textSecondary, fontFamily: "Ubuntu_500Medium" },
        selected: { color: Brand.accent, fontFamily: "Ubuntu_700Bold" },
      }}
      badgeBackgroundColor={Brand.accent}
      shadowColor={theme.backgroundElement}
      indicatorColor={theme.backgroundSelected}
      rippleColor={theme.backgroundElement}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md={{ default: "home", selected: "home_filled" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="build">
        <NativeTabs.Trigger.Label>Build</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require("@/assets/images/tabIcons/dumbbell.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>Chat</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{
            default: "message",
            selected: "message.fill",
          }}
          md="chat_bubble"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="diets">
        <NativeTabs.Trigger.Label>Diets</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="fork.knife" md="restaurant" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{
            default: "person.crop.circle",
            selected: "person.crop.circle.fill",
          }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
