package com.example;

import net.fabricmc.fabric.api.client.rendering.v1.WorldRenderEvents;
import net.minecraft.block.BlockState;
import net.minecraft.block.Blocks;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.font.TextRenderer;
import net.minecraft.client.render.LightmapTextureManager;
import net.minecraft.client.render.OverlayTexture;
import net.minecraft.client.render.VertexConsumerProvider;
import net.minecraft.client.render.block.BlockRenderManager;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.item.Item;
import net.minecraft.item.ItemDisplayContext;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.text.Text;
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

    // Enum to distinguish between display entity types
    private enum DisplayType {
        ITEM,
        BLOCK,
        TEXT
    }

    // Data class to store properties of each display entity
    private static class DisplayEntityData {
        DisplayType type;
        float x, y, z;
        float scaleX, scaleY, scaleZ;
        float yaw, pitch, roll;
        boolean visible;
        ItemStack itemStack; // For ItemDisplay
        BlockState blockState; // For BlockDisplay
        String text; // For TextDisplay

        // Unified constructor
        DisplayEntityData(DisplayType type, Object data, float x, float y, float z, float scaleX, float scaleY, float scaleZ, float yaw, float pitch, float roll) {
            this.type = type;
            this.x = x;
            this.y = y;
            this.z = z;
            this.scaleX = scaleX;
            this.scaleY = scaleY;
            this.scaleZ = scaleZ;
            this.yaw = yaw;
            this.pitch = pitch;
            this.roll = roll;
            this.visible = true;

            switch (type) {
                case ITEM:
                    if (data instanceof String itemId) {
                        Item item = Registries.ITEM.get(Identifier.tryParse(itemId));
                        this.itemStack = (item == Items.AIR) ? new ItemStack(Items.BARRIER) : new ItemStack(item);
                    } else {
                        this.itemStack = new ItemStack(Items.BARRIER);
                    }
                    break;

                case BLOCK:
                    if (data instanceof BlockState blockState) {
                        this.blockState = (blockState != null) ? blockState : Blocks.STONE.getDefaultState();
                    } else {
                        this.blockState = Blocks.STONE.getDefaultState();
                    }
                    break;

                case TEXT:
                    if (data instanceof String text) {
                        this.text = (text != null) ? text : "Default Text";
                    } else {
                        this.text = "Default Text";
                    }
                    break;
            }
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
     * @param pitch Rotation on X axis
     * @param roll Rotation on Z axis
     */
    public static void renderItemDisplayEntity(String id, String itemId, float x, float y, float z,
                                               float scaleX, float scaleY, float scaleZ, float yaw, float pitch, float roll) {
        if (registeredIds.contains(id)) return;
        registeredIds.add(id);
        entityDataMap.put(id, new DisplayEntityData(DisplayType.ITEM, itemId, x, y, z, scaleX, scaleY, scaleZ, yaw, pitch, roll));
        initializeRendering();
    }

    /**
     * Render a BlockDisplay with a position, scale, and rotation.
     * @param id Unique Identifier
     * @param blockId Minecraft-Block-Id, e.g., "minecraft:stone"
     * @param x World position
     * @param y World position
     * @param z World position
     * @param scaleX Scale
     * @param scaleY Scale
     * @param scaleZ Scale
     * @param yaw Rotation on Y axis
     * @param pitch Rotation on X axis
     * @param roll Rotation on Z axis
     */
    public static void renderBlockDisplayEntity(String id, String blockId, float x, float y, float z,
                                                float scaleX, float scaleY, float scaleZ, float yaw, float pitch, float roll) {
        if (registeredIds.contains(id)) return;
        registeredIds.add(id);
        BlockState blockState = Registries.BLOCK.get(Identifier.tryParse(blockId)).getDefaultState();
        if (blockState == null) {
            System.err.println("Invalid block ID: " + blockId + ", using default stone block.");
            blockState = Blocks.STONE.getDefaultState();
        }
        entityDataMap.put(id, new DisplayEntityData(DisplayType.BLOCK, blockState, x, y, z, scaleX, scaleY, scaleZ, yaw, pitch, roll));
        initializeRendering();
    }

    /**
     * Render a TextDisplay with a position, scale, and rotation.
     * @param id Unique Identifier
     * @param text Text to display
     * @param x World position
     * @param y World position
     * @param z World position
     * @param scaleX Scale
     * @param scaleY Scale
     * @param scaleZ Scale
     * @param yaw Rotation on Y axis
     * @param pitch Rotation on X axis
     * @param roll Rotation on Z axis
     */
    public static void renderTextDisplayEntity(String id, String text, float x, float y, float z,
                                               float scaleX, float scaleY, float scaleZ, float yaw, float pitch, float roll) {
        if (registeredIds.contains(id)) return;
        registeredIds.add(id);
        entityDataMap.put(id, new DisplayEntityData(DisplayType.TEXT, text, x, y, z, scaleX, scaleY, scaleZ, yaw, pitch, roll));
        initializeRendering();
    }

    /**
     * Update the position of a DisplayEntity.
     * @param id Unique Identifier
     * @param x New X position
     * @param y New Y position
     * @param z New Z position
     */
    public static void setPositionDisplayEntity(String id, float x, float y, float z) {
        DisplayEntityData data = entityDataMap.get(id);
        if (data != null) {
            data.x = x;
            data.y = y;
            data.z = z;
        } else {
            System.err.println("DisplayEntity with ID " + id + " not found.");
        }
    }

    /**
     * Update the rotation of a DisplayEntity.
     * @param id Unique Identifier
     * @param yaw New yaw (Y-axis rotation)
     * @param pitch New pitch (X-axis rotation)
     * @param roll New roll (Z-axis rotation)
     */
    public static void setRotationDisplayEntity(String id, float yaw, float pitch, float roll) {
        DisplayEntityData data = entityDataMap.get(id);
        if (data != null) {
            data.yaw = yaw;
            data.pitch = pitch;
            data.roll = roll;
        } else {
            System.err.println("DisplayEntity with ID " + id + " not found.");
        }
    }

    /**
     * Set the visibility of a DisplayEntity.
     * @param id Unique Identifier
     * @param visible Whether the entity should be visible
     */
    public static void setVisibilityDisplayEntity(String id, boolean visible) {
        DisplayEntityData data = entityDataMap.get(id);
        if (data != null) {
            data.visible = visible;
        } else {
            System.err.println("DisplayEntity with ID " + id + " not found.");
        }
    }

    /**
     * Update the scale of a DisplayEntity.
     * @param id Unique Identifier
     * @param scaleX New X scale
     * @param scaleY New Y scale
     * @param scaleZ New Z scale
     */
    public static void setScaleDisplayEntity(String id, float scaleX, float scaleY, float scaleZ) {
        DisplayEntityData data = entityDataMap.get(id);
        if (data != null) {
            data.scaleX = scaleX;
            data.scaleY = scaleY;
            data.scaleZ = scaleZ;
        } else {
            System.err.println("DisplayEntity with ID " + id + " not found.");
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
            if (data.type != DisplayType.ITEM) {
                System.err.println("Entity with ID " + id + " is not an ItemDisplayEntity.");
                return;
            }
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
            System.err.println("DisplayEntity with ID " + id + " not found.");
        }
    }

    /**
     * Update the block of a BlockDisplayEntity.
     * @param id Unique Identifier
     * @param blockId New Minecraft-Block-Id, e.g., "minecraft:stone"
     */
    public static void setBlockBlockDisplayEntity(String id, String blockId) {
        DisplayEntityData data = entityDataMap.get(id);
        if (data != null) {
            if (data.type != DisplayType.BLOCK) {
                System.err.println("Entity with ID " + id + " is not a BlockDisplayEntity.");
                return;
            }
            Identifier identifier = Identifier.tryParse(blockId);
            if (identifier == null) {
                System.err.println("Invalid block ID: " + blockId);
                return;
            }
            BlockState blockState = Registries.BLOCK.get(identifier).getDefaultState();
            if (blockState == null) {
                System.err.println("Block not found: " + blockId);
                return;
            }
            data.blockState = blockState;
        } else {
            System.err.println("DisplayEntity with ID " + id + " not found.");
        }
    }

    /**
     * Update the text of a TextDisplayEntity.
     * @param id Unique Identifier
     * @param text New text to display
     */
    public static void setTextTextDisplayEntity(String id, String text) {
        DisplayEntityData data = entityDataMap.get(id);
        if (data != null) {
            if (data.type != DisplayType.TEXT) {
                System.err.println("Entity with ID " + id + " is not a TextDisplayEntity.");
                return;
            }
            data.text = (text != null) ? text : "Default Text";
        } else {
            System.err.println("DisplayEntity with ID " + id + " not found.");
        }
    }

    /**
     * Delete a DisplayEntity.
     * @param id Unique Identifier
     */
    public static void deleteDisplayEntity(String id) {
        if (entityDataMap.remove(id) != null) {
            registeredIds.remove(id);
        } else {
            System.err.println("DisplayEntity with ID " + id + " not found.");
        }
    }

    // Helper method to initialize rendering
    private static void initializeRendering() {
        if (isRenderingInitialized) return;
        isRenderingInitialized = true;

        WorldRenderEvents.AFTER_ENTITIES.register(ctx -> {
            MinecraftClient client = MinecraftClient.getInstance();
            if (client.world == null || client.player == null) return;

            MatrixStack matrices = ctx.matrixStack();
            Vec3d cameraPos = ctx.camera().getPos();
            VertexConsumerProvider vertexConsumers = ctx.consumers();

            for (Map.Entry<String, DisplayEntityData> entry : entityDataMap.entrySet()) {
                String entityId = entry.getKey();
                DisplayEntityData data = entry.getValue();

                if (!data.visible || !registeredIds.contains(entityId)) continue;

                matrices.push();

                // Apply transformations
                matrices.translate(data.x - cameraPos.x, data.y - cameraPos.y, data.z - cameraPos.z);
                matrices.scale(data.scaleX, data.scaleY, data.scaleZ);
                matrices.multiply(RotationAxis.POSITIVE_Y.rotationDegrees(data.yaw));
                matrices.multiply(RotationAxis.POSITIVE_X.rotationDegrees(data.pitch));
                matrices.multiply(RotationAxis.POSITIVE_Z.rotationDegrees(data.roll));

                // Render based on type
                switch (data.type) {
                    case ITEM:
                        client.getItemRenderer().renderItem(
                                data.itemStack,
                                ItemDisplayContext.GROUND,
                                LightmapTextureManager.MAX_LIGHT_COORDINATE,
                                OverlayTexture.DEFAULT_UV,
                                matrices,
                                vertexConsumers,
                                client.world,
                                0
                        );
                        break;

                    case BLOCK:
                        BlockRenderManager blockRenderManager = client.getBlockRenderManager();
                        blockRenderManager.renderBlockAsEntity(
                                data.blockState,
                                matrices,
                                vertexConsumers,
                                LightmapTextureManager.MAX_LIGHT_COORDINATE,
                                OverlayTexture.DEFAULT_UV
                        );
                        break;

                    case TEXT:
                        TextRenderer textRenderer = client.textRenderer;
                        Text text = Text.literal(data.text);
                        float textWidth = textRenderer.getWidth(text);
                        // Center the text and render it facing the player
                        matrices.push();
                        matrices.multiply(client.getEntityRenderDispatcher().getRotation()); // Face the player
                        matrices.scale(0.025f * data.scaleX, -0.025f * data.scaleY, 0.025f * data.scaleZ); // Small scale for text
                        matrices.translate(-textWidth / 2.0, 0, 0); // Center the text
                        textRenderer.draw(
                                text,
                                0,
                                0,
                                0xFFFFFFFF, // White text with full opacity
                                true, // Drop shadow
                                matrices.peek().getPositionMatrix(),
                                vertexConsumers,
                                TextRenderer.TextLayerType.NORMAL,
                                0, // Background color (none)
                                LightmapTextureManager.MAX_LIGHT_COORDINATE
                        );
                        matrices.pop();
                        break;
                }

                matrices.pop();
            }
        });
    }
}