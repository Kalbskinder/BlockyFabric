package net.modwizard;

import net.fabricmc.fabric.api.client.rendering.v1.WorldRenderEvents;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.render.LightmapTextureManager;
import net.minecraft.client.render.OverlayTexture;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.item.*;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.RotationAxis;
import net.minecraft.util.math.Vec3d;
import net.minecraft.registry.Registries;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class CustomEntityRenderer {
    private static final Set<String> registeredIds = new HashSet<>();
    private static final Map<String, DisplayEntityData> entityDataMap = new HashMap<>();
    private static boolean isRenderingInitialized = false;

    // Data class to store properties of each display entity
    private static class DisplayEntityData {
        float x, y, z;
        float scaleX, scaleY, scaleZ;
        float yaw, pitch;
        boolean visible;
        ItemStack itemStack;

        DisplayEntityData(String itemId, float x, float y, float z, float scaleX, float scaleY, float scaleZ, float yaw, float pitch) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.scaleX = scaleX;
            this.scaleY = scaleY;
            this.scaleZ = scaleZ;
            this.yaw = yaw;
            this.pitch = pitch;
            this.visible = true; // Default visibility
            Item item = Registries.ITEM.get(Identifier.tryParse(itemId));
            this.itemStack = (item == Items.AIR) ? new ItemStack(Items.BARRIER) : new ItemStack(item); // Fallback to barrier if invalid
        }
    }

    /**
     * Render an ItemEntityDisplay with a position, scale, and rotation.
     * @param id Unique Identifier
     * @param itemId Minecraft-Item-Id, e.g., "minecraft:diamond_block"
     * @param x World position
     * @param y World position
     * @param z World position
     * @param scaleX Scale
     * @param scaleY Scale
     * @param scaleZ Scale
     * @param yaw Rotation on Y axis
     */
    public static void renderItemDisplayEntity(String id, String itemId, float x, float y, float z,
                                               float scaleX, float scaleY, float scaleZ, float yaw, float pitch) {
        if (registeredIds.contains(id)) return; // Prevent duplicate registration
        registeredIds.add(id);

        // Store the entity's initial data
        entityDataMap.put(id, new DisplayEntityData(itemId, x, y, z, scaleX, scaleY, scaleZ, yaw, pitch));

        // Register the rendering event (only once)
        if (!isRenderingInitialized) {
            isRenderingInitialized = true;
            WorldRenderEvents.AFTER_ENTITIES.register(ctx -> {
                MinecraftClient client = MinecraftClient.getInstance();
                if (client.world == null || client.player == null) return;

                MatrixStack matrices = ctx.matrixStack();
                Vec3d cameraPos = ctx.camera().getPos();

                // Render all registered entities
                for (Map.Entry<String, DisplayEntityData> entry : entityDataMap.entrySet()) {
                    String entityId = entry.getKey();
                    DisplayEntityData data = entry.getValue();

                    // Skip rendering if not visible or not registered
                    if (!data.visible || !registeredIds.contains(entityId)) continue;

                    matrices.push();

                    // Apply transformations
                    matrices.translate(data.x - cameraPos.x, data.y - cameraPos.y, data.z - cameraPos.z);
                    matrices.scale(data.scaleX, data.scaleY, data.scaleZ);
                    matrices.multiply(RotationAxis.POSITIVE_Y.rotationDegrees(data.yaw));
                    matrices.multiply(RotationAxis.POSITIVE_X.rotationDegrees(data.pitch));

                    // Render the item
                    client.getItemRenderer().renderItem(
                            data.itemStack,
                            ItemDisplayContext.GROUND,
                            LightmapTextureManager.MAX_LIGHT_COORDINATE,
                            OverlayTexture.DEFAULT_UV,
                            matrices,
                            ctx.consumers(),
                            client.world,
                            0
                    );

                    matrices.pop();
                }
            });
        }
    }

    /**
     * Update the position of an ItemDisplayEntity.
     * @param id Unique Identifier
     * @param x New X position
     * @param y New Y position
     * @param z New Z position
     */
    public static void setPositionItemDisplayEntity(String id, float x, float y, float z) {
        DisplayEntityData data = entityDataMap.get(id);
        if (data != null) {
            data.x = x;
            data.y = y;
            data.z = z;
        } else {
            System.err.println("ItemDisplayEntity with ID " + id + " not found.");
        }
    }

    /**
     * Update the rotation of an ItemDisplayEntity.
     * @param id Unique Identifier
     * @param yaw New yaw (Y-axis rotation)
     * @param pitch New pitch (X-axis rotation)
     */
    public static void setRotationItemDisplayEntity(String id, float yaw, float pitch) {
        DisplayEntityData data = entityDataMap.get(id);
        if (data != null) {
            data.yaw = yaw;
            data.pitch = pitch;
        } else {
            System.err.println("ItemDisplayEntity with ID " + id + " not found.");
        }
    }

    /**
     * Set the visibility of an ItemDisplayEntity.
     * @param id Unique Identifier
     * @param visible Whether the entity should be visible
     */
    public static void setVisibilityItemDisplayEntity(String id, boolean visible) {
        DisplayEntityData data = entityDataMap.get(id);
        if (data != null) {
            data.visible = visible;
        } else {
            System.err.println("ItemDisplayEntity with ID " + id + " not found.");
        }
    }

    /**
     * Update the scale of an ItemDisplayEntity.
     * @param id Unique Identifier
     * @param scaleX New X scale
     * @param scaleY New Y scale
     * @param scaleZ New Z scale
     */
    public static void setScaleItemDisplayEntity(String id, float scaleX, float scaleY, float scaleZ) {
        DisplayEntityData data = entityDataMap.get(id);
        if (data != null) {
            data.scaleX = scaleX;
            data.scaleY = scaleY;
            data.scaleZ = scaleZ;
        } else {
            System.err.println("ItemDisplayEntity with ID " + id + " not found.");
        }
    }

    /**
     * Update the item of an ItemDisplayEntity.
     * @param id Unique Identifier
     * @param itemId New Minecraft-Item-Id, e.g., "minecraft:emerald"
     */
    public static void setItemItemDisplayEntity(String id, String itemId) {
        DisplayEntityData data = entityDataMap.get(id);
        if (data != null) {
            Identifier identifier = Identifier.tryParse(itemId);
            if (identifier == null) {
                System.err.println("Invalid item ID: " + itemId);
                return;
            }
            Item item = Registries.ITEM.get(identifier);
            if (item == Items.AIR) {
                System.err.println("Item not found or is air: " + itemId);
                return;
            }
            data.itemStack = new ItemStack(item);
        } else {
            System.err.println("ItemDisplayEntity with ID " + id + " not found.");
        }
    }

    /**
     * Delete an ItemDisplayEntity.
     * @param id Unique Identifier
     */
    public static void deleteItemDisplayEntity(String id) {
        if (entityDataMap.remove(id) != null) {
            registeredIds.remove(id);
        } else {
            System.err.println("ItemDisplayEntity with ID " + id + " not found.");
        }
    }
}