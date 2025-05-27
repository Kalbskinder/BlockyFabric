package net.modwizard;

import net.fabricmc.api.ModInitializer;
import org.slf4j.LoggerFactory;

import java.util.logging.Logger;

public class Main implements ModInitializer {
	public static final String MOD_ID = "modwizard";
	public static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(MOD_ID);


	@Override
	public void onInitialize() {
		LOGGER.info("Initializing your mod built with ModWizard!");
	}
}
