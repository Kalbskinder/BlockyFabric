package net.modwizard;

import net.minecraft.client.MinecraftClient;
import net.minecraft.sound.SoundEvent;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;

public class ModWizardAPI {
    public static void playSound(String sound, float volume, float pitch) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.player == null) return;

        Identifier id = Identifier.tryParse(sound);
        if (id == null) {
            client.player.sendMessage(Text.literal("Invalid sound identifier: " + sound), false);
            return;
        }

        SoundEvent event = SoundEvent.of(id);
        client.player.playSound(event, volume, pitch);
    }

    public static void displayTitle(String title, int fadeIn, int stay, int fadeOut) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.player != null && client.inGameHud != null) {
            client.inGameHud.setTitle(Text.literal(title));
            client.inGameHud.setTitleTicks(fadeIn * 20, stay * 20, fadeOut * 20);
        }
    }

    public static void displaySubtitle(String subtitle, int fadeIn, int stay, int fadeOut) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.player != null && client.inGameHud != null) {
            client.inGameHud.setSubtitle(Text.literal(subtitle));
            client.inGameHud.setTitleTicks(fadeIn * 20, stay * 20, fadeOut * 20);
        }
    }

    public static void displayActionbar(String message) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.player != null) {
            client.player.sendMessage(Text.literal(message), true);
        }
    }

    public static void sendMessage(String message, boolean sendGlobally) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (sendGlobally) {
            String plainMessage = message.replaceAll("§.", "");
            client.player.networkHandler.sendChatMessage(plainMessage);
        } else {
            client.inGameHud.getChatHud().addMessage(Text.literal(message));
        }
    }


    public static double getPlayerX() {
        return MinecraftClient.getInstance().player.getX();
    }

    public static double getPlayerY() {
        return MinecraftClient.getInstance().player.getY();
    }

    public static double getPlayerZ() {
        return MinecraftClient.getInstance().player.getZ();
    }

    public static float getPlayerRotation(boolean yaw) {
        return yaw ? MinecraftClient.getInstance().player.lastYaw : MinecraftClient.getInstance().player.lastPitch;
    }

    public static int getPlayerXP() {
        return MinecraftClient.getInstance().player.experienceLevel;
    }

    public static String getPlayerUsername() {
        return MinecraftClient.getInstance().player.getDisplayName().getString();
    }

    public static String getPlayerUUID() {
        return MinecraftClient.getInstance().player.getUuid().toString();
    }

    public static String getPlayerGameMode () {
        return MinecraftClient.getInstance().player.getGameMode().getId();
    }

    public static String playerClipboard (String text, String method) {
        if (method == "copy") {
            MinecraftClient.getInstance().keyboard.setClipboard(text);
            return text;
        } else if (method == "get") {
            return MinecraftClient.getInstance().keyboard.getClipboard();
        } else{
            return text;
        }
    }

    public static boolean dropHeldItem (boolean entireStack) {
        return MinecraftClient.getInstance().player.dropSelectedItem(entireStack);
    }
}