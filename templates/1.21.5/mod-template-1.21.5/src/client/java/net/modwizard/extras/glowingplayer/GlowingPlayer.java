package com.example.extras.glowingplayer;

public class GlowingPlayer {
    private static boolean shouldGlow = false;

    public static boolean shouldPlayerGlow() {
        return shouldGlow;
    }

    public static void setPlayerGlow(boolean glow) {
        shouldGlow = glow;
    }
}