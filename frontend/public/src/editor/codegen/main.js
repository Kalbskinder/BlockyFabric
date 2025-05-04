// Used to translate blockly into Java Code

const usedImports = new Set();

// Second class for Minecraft specific blocks
const usedMinecraftImports = new Set();
const usedHelpers = new Set();
const initializeChildren = new Set()

function exportCode() {
    const json = Blockly.serialization.workspaces.save(workspace); // Save the current workspace
    const code = generateJava(json);

    let importSection = Array.from(usedImports).map(i => `import ${i};`).join("\n");
    importSection  ? importSection += "\n\n" : "";
    usedImports.clear(); // Clear used imports for next export

    const blockyFabricApiClass = generateHelperClass(); // Generate and format all helper functions
    const mainClassCode = `package net.blockyfabric;\n\n${'import net.fabricmc.api.ClientModInitializer;\n' + importSection}public class Client implements ClientModInitializer {\n${indent(code)}\n}`; // Put code into the class main
    
    return {
        mainClass: mainClassCode,
        helperClass: blockyFabricApiClass
    }
}

function generateHelperClass() {
    const functions = Array.from(usedHelpers).map(fn => {
        return minecraftFunctions[fn] ? minecraftFunctions[fn]() : "";
    }).join("\n\n");

    let imports = "";

    if (usedMinecraftImports.size) {
        imports = Array.from(usedMinecraftImports)
        .map(i => `import ${i};`)
        .join("\n");

        usedMinecraftImports.clear(); // Clear used imports for next export
    };        

    usedHelpers.clear(); // Clear used helpers for next export

    return `package net.blockyfabric;\n\n${imports ? imports + '\n\n' : ''}public class BlockyFabricAPI {\n\n${indent(functions)}\n}`;
}

// Function to generate Java code
function generateJava(json) {
    const javaCode = [];

    for (const block of json.blocks.blocks) {
        javaCode.push(handleStatementChain(block));
    }

    return javaCode.join('\n');
}

// Function to handle a statement chain
function handleStatementChain(block) {
    let code = handleBlock(block);
    if (block.next?.block) {
        code += '\n' + handleStatementChain(block.next.block);
    }
    return code;
}

// Function to handle a single block
function handleBlock(block) {
    if (!block) return "";

    const translator = translations[block.type];
    if (translator) {
        return translator(block);
    } else {
        console.warn("Unknown block type:", block.type);
        return `// Unknown block type: ${block.type}`;
    }
}

// Function to handle multiple statements
function handleStatements(block) {
    let code = handleBlock(block);
    if (block.next?.block) {
        code += "\n" + handleStatements(block.next.block);
    }
    return code;
}

// Function to add indentation for cleaner code
function indent(str, spaces = 4) {
    const pad = ' '.repeat(spaces);
    return str
        .split('\n')
        .map(line => (line.trim() ? pad + line : line))
        .join('\n');
}


const minecraftFunctions = {}
const translations = {}

/* =====================
    Conditions
   ===================== */

translations["controls_if"] = (block) => {
    let code = "";

    const inputKeys = block.inputs ? Object.keys(block.inputs) : [];
    const conditions = inputKeys.filter(key => key.startsWith("IF"));
    const hasElse = inputKeys.includes("ELSE");

    // Iterate through IF / ELSE IF pairs
    conditions.forEach((condKey, index) => {
        const doKey = "DO" + condKey.slice(2); // IF0 => DO0
        const condBlock = block.inputs?.[condKey]?.block;
        const doBlock = block.inputs?.[doKey]?.block;

        const condition = condBlock ? handleBlock(condBlock) : "true";
        const statements = doBlock ? handleStatements(doBlock) : "";

        if (index === 0) {
            code += `if (${condition}) {\n${indent(statements)}\n}`;
        } else {
            code += ` else if (${condition}) {\n${indent(statements)}\n}`;
        }
    });

    // Handle ELSE block
    if (hasElse) {
        const elseBlock = block.inputs?.ELSE?.block;
        const elseStatements = elseBlock ? handleStatements(elseBlock) : "";
        code += ` else {\n${indent(elseStatements)}\n}`;
    }

    return code;
};

translations["logic_compare"] = (block) => {
    const A = block.inputs?.A?.block ? handleBlock(block.inputs.A.block) : "null";
    const B = block.inputs?.B?.block ? handleBlock(block.inputs.B.block) : "null";
    const op = block.fields?.OP || "EQ";

    const opMap = {
        "EQ": "==",
        "NEQ": "!=",
        "LT": "<",
        "LTE": "<=",
        "GT": ">",
        "GTE": ">="
    };

    return `${A} ${opMap[op] || "=="} ${B}`;
};

translations["logic_operation"] = (block) => {
    const opMap = {
        "AND": "&&",
        "OR": "||"
    };

    const op = opMap[block.fields?.OP] || "&&";
    const A = block.inputs?.A?.block ? handleBlock(block.inputs.A.block) : "true";
    const B = block.inputs?.B?.block ? handleBlock(block.inputs.B.block) : "true";

    return `${A} ${op} ${B}`;
};

translations["logic_negate"] = (block) => {
    const value = block.inputs?.BOOL?.block ? handleBlock(block.inputs.BOOL.block) : "false";
    return `!(${value})`; // Need brackets here
};

translations["logic_boolean"] = (block) => {
    return block.fields?.BOOL ? block.fields.BOOL.toLowerCase() : "false";
};

/* =====================
    Loops
   ===================== */

translations["controls_repeat_ext"] = (block) => {    
    const timesBlock = block.inputs?.TIMES?.block;
    const times = timesBlock ? handleBlock(timesBlock) : "0";
    const doBlock = block.inputs?.DO?.block;
    const body = doBlock ? indent(handleStatements(doBlock)) : "";    
    return `for (int i = 0; i < ${times}; i++) {\n${body}\n}`;
};

translations["controls_whileUntil"] = (block) => {
    const mode = block.fields?.MODE || "WHILE"; // "WHILE" or "UNTIL"
    const conditionBlock = block.inputs?.BOOL?.block;
    const bodyBlock = block.inputs?.DO?.block;
    let condition = conditionBlock ? handleBlock(conditionBlock) : "true";
    const body = bodyBlock ? indent(handleStatements(bodyBlock)) : "";
    if (mode === "UNTIL") {
        condition = `!(${condition})`;
    }
    return `while (${condition}) {\n${body}\n}`;
};

translations["controls_forEach"] = (block) => {
// May need to adjust after adding translation for lists to be able to read them properly
    const varName = block.fields?.VAR || "item";
    const listBlock = block.inputs?.LIST?.block;
    const bodyBlock = block.inputs?.DO?.block;

    const list = listBlock ? handleBlock(listBlock) : "new ArrayList<>()";
    const body = bodyBlock ? indent(handleStatements(bodyBlock)) : "";

    return `for (var ${varName} : ${list}) {\n${body}\n}`;
}

translations["break"] = () => {
    return "break;";
}

translations["return"] = () => {
    return "return;";
}

/* =====================
   Math
   ===================== */

translations["math_number"] = (block) => {
    return block.fields?.NUM || "0";
}

translations["math_arithmetic"] = (block) => {
    const A = block.inputs?.A?.block ? handleBlock(block.inputs.A.block) : "0";
    const B = block.inputs?.B?.block ? handleBlock(block.inputs.B.block) : "0";
    const op = block.fields?.OP || "EQ";
    
    const opMap = {
        "EQ": "+",
        "ADD": "+",
        "MINUS": "-",
        "MULTIPLY": "*",
        "DIVIDE": "/",
    };

    if (op === "POWER") {
        return `Math.pow(${A}, ${B})`;
    }
    return `${A} ${opMap[op]} ${B}`;
}

translations["math_single"] = (block) => {
    const num = block.inputs?.NUM?.block ? handleBlock(block.inputs.NUM.block) : "0";
    const op = block.fields?.OP || "ABS";
        
    switch (op) {
        case "ABS":
            return `Math.abs(${num})`;
        case "ROOT":
            return `Math.sqrt(${num})`;
        case "NEG":
            return `-${num}`;
        case "LN":
            return `Math.log(${num})`;
        case "LOG10":
            return `Math.log10(${num})`;
        case "EXP":
            return `Math.exp(${num})`;
        case "POW10":
            return `Math.pow(10, ${num})`;
        default:
            console.warn(`Unknown math_single-Operator: ${op}`);
            return `/* unknown math_single op: ${op} */`;
    }
}

translations["math_trig"] = (block) => {
    const angle = block.inputs?.NUM?.block ? handleBlock(block.inputs.NUM.block) : "0";
    const op = block.fields?.OP || "SIN";
    
    const opMap = {
        "SIN": "Math.sin",
        "COS": "Math.cos",
        "TAN": "Math.tan",
        "ASIN": "Math.asin",
        "ACOS": "Math.acos",
        "ATAN": "Math.atan"
    };
    
    const func = opMap[op];
    
    if (!func) {
        console.warn(`Unknown math_trig-Operator: ${op}`);
        return `/* unknown math_trig op: ${op} */`;
    }
    
    return `${func}(${angle})`;
}

translations["math_number_property"] = (block) => {
    const number = block.inputs?.NUMBER_TO?.block ? handleBlock(block.inputs.NUMBER_TO.block) : "0";
    const property = block.fields?.PROPERTY || "EVEN";
    
    // Missing prime. Remove from block or add here
    switch (property) {
        case "EVEN":
            return `(${number} % 2 == 0)`;
        case "ODD":
            return `(${number} % 2 != 0)`;
        case "WHOLE":
            return `(${number} == Math.floor(${number}))`;
        case "POSITIVE":
            return `(${number} > 0)`;
        case "NEGATIVE":
            return `(${number} < 0)`;
        case "DIVISIBLE_BY": {
            const divisor = block.inputs?.DIVISOR?.block ? handleBlock(block.inputs.DIVISOR.block) : "1";
            return `(${number} % ${divisor} == 0)`;
        }
        default:
            return "/* unsupported math_number_property */";
    }
}

translations["math_round"] = (block) => {
    const num = block.inputs?.NUM?.block ? handleBlock(block.inputs.NUM.block) : "0";
    const op = block.fields?.OP || "ROUND";
    
    switch (op) {
        case "ROUND":
            return `Math.round(${num})`;
        case "ROUNDUP":
            return `Math.ceil(${num})`;
        case "ROUNDDOWN":
            return `Math.floor(${num})`;
        default:
            return "/* unknown round op */";
    }
}

translations["math_on_list"] = (block) => {
    const list = block.inputs?.LIST?.block ? handleBlock(block.inputs.LIST.block) : "new ArrayList<>()";
    const op = block.fields?.OP || "SUM";
    
    switch (op) {
        case "SUM":
            return `${list}.stream().mapToDouble(x -> x).sum()`;
        case "MIN":
            return `${list}.stream().mapToDouble(x -> x).min().orElse(0)`;
        case "MAX":
            return `${list}.stream().mapToDouble(x -> x).max().orElse(0)`;
        case "AVERAGE":
            return `${list}.stream().mapToDouble(x -> x).average().orElse(0)`;
        case "LENGTH":
            return `${list}.size()`;
        case "STD_DEV":
            return `/* Berechne Standardabweichung hier, optional */`;
        case "MEDIAN":
            return `/* Median-Berechnung kann manuell erfolgen */`;
        default:
            return "/* unknown math_on_list op */";
    }
}

translations["math_modulo"] = (block) => {
    const dividend = block.inputs?.DIVIDEND?.block ? handleBlock(block.inputs.DIVIDEND.block) : "0";
    const divisor = block.inputs?.DIVISOR?.block ? handleBlock(block.inputs.DIVISOR.block) : "1";
    return `(${dividend} % ${divisor})`;
}

translations["math_random_int"] = (block) => {
    const from = block.inputs?.FROM?.block ? handleBlock(block.inputs.FROM.block) : "0";
    const to = block.inputs?.TO?.block ? handleBlock(block.inputs.TO.block) : "100";

    usedImports.add("java.util.Random");
    
    return `(int)(Math.floor(Math.random() * (${to} - ${from} + 1)) + ${from})`;
}

translations["parse_int"] = (block) => {
    const input = block.inputs?.VALUE?.block ? handleBlock(block.inputs.VALUE.block) : `"0"`;
    return `Integer.parseInt(${input})`;
}

/* =====================
   Strings
   ===================== */

translations["text"] = (block) => {
    return `"${block.fields?.TEXT || ''}"`;
}

translations["text_join"] = (block) => {
    const items = [];

    const inputs = block.inputs || {};

    Object.keys(inputs).forEach(inputKey => {
        const inputBlock = inputs[inputKey]?.block;
        if (inputBlock) {
            const itemValue = handleBlock(inputBlock);
            items.push(itemValue);
        }
    });

    if (items.length === 0) {
        return '""';
    }

    return `(${items.join(" + ")})`;
},


translations["to_string"] = (block) => {
    const input = block.inputs?.VALUE?.block ? handleBlock(block.inputs.VALUE.block) : '""';
    return `String.valueOf(${input})`;    
}

translations["text_length"] = (block) => {
    const text = block.inputs?.VALUE?.block ? handleBlock(block.inputs.VALUE.block) : '""';
    return `${text}.length()`;
}

translations["text_getSubstring"] = (block) => {
    const text = block.inputs?.STRING?.block ? handleBlock(block.inputs.STRING.block) : '""';
    let start = block.inputs?.AT1?.block ? handleBlock(block.inputs.AT1.block) : "1";
    let end = block.inputs?.AT2?.block ? handleBlock(block.inputs.AT2.block) : "1";
    
    // Wrap start in `Math.max(${start}, 1)` to make sure it’s never < 1 before subtracting 1
    start = `Math.max(${start}, 1) - 1`;
    
    return `${text}.substring(${start}, ${end})`;
}

translations["text_changeCase"] = (block) => {
    const text = block.inputs?.TEXT?.block ? handleBlock(block.inputs.TEXT.block) : '""';
    const mode = block.fields?.CASE || "UPPERCASE";    
    switch (mode) {
        case "UPPERCASE":
            return `${text}.toUpperCase()`;
        case "LOWERCASE":
            return `${text}.toLowerCase()`;
        case "TITLECASE":
            return `${text}.substring(0, 1).toUpperCase() + ${text}.substring(1).toLowerCase()`;
        default:
            return text;
    }
}

translations["text_trim"] = (block) => {
    const text = block.inputs?.TEXT?.block ? handleBlock(block.inputs.TEXT.block) : '""';
    const mode = block.fields?.MODE || "BOTH";
    
    switch (mode) {
        case "LEFT":
            return `${text}.replaceAll("^\\\\s+", "")`;
        case "RIGHT":
            return `${text}.replaceAll("\\\\s+$", "")`;
        case "BOTH":
        default:
            return `${text}.trim()`;
    }
}

translations["text_count"] = (block) => {
    const haystack = block.inputs?.TEXT?.block ? handleBlock(block.inputs.TEXT.block) : '""';
    const needle = block.inputs?.SUB?.block ? handleBlock(block.inputs.SUB.block) : '""';
    return `(${haystack}.split(${needle}, -1).length - 1)`;
}

translations["text_replace"] = (block) => {
    const text = block.inputs?.TEXT?.block ? handleBlock(block.inputs.TEXT.block) : '""';
    const from = block.inputs?.FROM?.block ? handleBlock(block.inputs.FROM.block) : '""';
    const to = block.inputs?.TO?.block ? handleBlock(block.inputs.TO.block) : '""';
    return `${text}.replaceAll(${from}, ${to})`;
}

translations["text_reverse"] = (block) => {
    const text = block.inputs?.TEXT?.block ? handleBlock(block.inputs.TEXT.block) : '""';

    usedImports.add("java.lang.StringBuilder"); // Add StringBuilder import if not already added
    return `new StringBuilder(${text}).reverse().toString()`;   
}

translations["string_contains"] = (block) => {
    const text = block.inputs?.MAIN_STRING?.block ? handleBlock(block.inputs.MAIN_STRING.block) : '""';
    const search = block.inputs?.SECONDARYS_STRING?.block ? handleBlock(block.inputs.SECONDARYS_STRING.block) : '""';
    return `${text}.contains(${search})`;
}

/* =====================
   Lists
   ===================== */

translations["lists_create_with"] = (block) => {
    const itemCount = block.extraState.itemCount || 0;
    const items = [];    

    for (let i = 0; i < itemCount; i++) {
        const input = block.inputs?.[`ADD${i}`]?.block;
        items.push(input ? handleBlock(input) : "null");
    }

    usedImports.add("java.util.Arrays");

    return `Arrays.asList(${items.join(", ")})`;
}

translations["lists_repeat"] = (block) => {
    const item = block.inputs?.ITEM?.block ? handleBlock(block.inputs.ITEM.block) : "null";
    const times = block.inputs?.NUM?.block ? handleBlock(block.inputs.NUM.block) : "0";

    usedImports.add("java.util.Collections");

    return `Collections.nCopies(${times}, ${item})`;
}

translations["lists_length"] = (block) => {
    const list = block.inputs?.VALUE?.block ? handleBlock(block.inputs.VALUE.block) : "new ArrayList<>()";

    usedImports.add("java.util.ArrayList");

    return `${list}.size()`;
}

translations["lists_isEmpty"] = (block) => {
    const list = block.inputs?.VALUE?.block ? handleBlock(block.inputs.VALUE.block) : "new ArrayList<>()";

    usedImports.add("java.util.ArrayList");

    return `${list}.isEmpty()`;
}

translations["lists_indexOf"] = (block) => {
    const list = block.inputs?.VALUE?.block ? handleBlock(block.inputs.VALUE.block) : "new ArrayList<>()";
    const item = block.inputs?.FIND?.block ? handleBlock(block.inputs.FIND.block) : "null";
    const mode = block.fields?.END || "FIRST"; // FIRST or LAST

    usedImports.add("java.util.ArrayList");

    return mode === "FIRST"
        ? `${list}.indexOf(${item})`
        : `${list}.lastIndexOf(${item})`;
}

translations["lists_getIndex"] = (block) => {
    const list = block.inputs?.VALUE?.block ? handleBlock(block.inputs.VALUE.block) : "new ArrayList<>()";
    const indexBlock = block.inputs?.AT?.block ? handleBlock(block.inputs.AT.block) : "0";

    const mode = block.fields?.MODE || "GET";           // GET, GET_REMOVE, REMOVE
    const where = block.fields?.WHERE || "FROM_START";  // FROM_START, FROM_END, FIRST, LAST, RANDOM

    let code = "";

    switch (where) {
        case "FROM_START":
            code = `${list}.get(${indexBlock})`;
            break;
        case "FROM_END":
            code = `${list}.get(${list}.size() - 1 - ${indexBlock})`;
            break;
        case "FIRST":
            code = `${list}.get(0)`;
            break;
        case "LAST":
            code = `${list}.get(${list}.size() - 1)`;
            break;
        case "RANDOM":
            code = `${list}.get(new Random().nextInt(${list}.size()))`;
            break;
    }

    if (mode === "GET") {
        return code;
    } else if (mode === "GET_REMOVE") {
        return `${list}.remove(${code.match(/\((.*?)\)/)?.[1] || "0"})`;
    } else if (mode === "REMOVE") {
        return `${list}.remove(${code.match(/\((.*?)\)/)?.[1] || "0"});`;
    }

    usedImports.add("java.util.Random");
    usedImports.add("java.util.ArrayList");

    return code;
}

translations["lists_setIndex"] = (block) => {
    const listCode = block.inputs?.LIST?.block ? handleBlock(block.inputs.LIST.block) : "new ArrayList<>()";
    const indexCode = block.inputs?.AT?.block ? handleBlock(block.inputs.AT.block) : "0";
    const valueCode = block.inputs?.TO?.block ? handleBlock(block.inputs.TO.block) : "null";
    const mode = block.fields?.MODE || "SET"; // SET or INSERT
    const where = block.fields?.WHERE || "FROM_START";

    const listExpr = `new ArrayList<>(${listCode})`;
    let indexExpr;

    switch (where) {
        case "FROM_START":
            indexExpr = indexCode;
            break;
        case "FROM_END":
            indexExpr = `${listExpr}.size() - 1 - ${indexCode}`;
            break;
        case "FIRST":
            indexExpr = `0`;
            break;
        case "LAST":
            indexExpr = `${listExpr}.size() - 1`;
            break;
        case "RANDOM":
            indexExpr = `new Random().nextInt(${listExpr}.size())`;
            break;
        default:
            indexExpr = indexCode;
    }

    if (mode === "SET") {
        return `${listExpr}.set(${indexExpr}, ${valueCode});`;
    } else if (mode === "INSERT") {
        return `${listExpr}.add(${indexExpr}, ${valueCode});`;
    }

    usedImports.add("java.util.ArrayList");
    usedImports.add("java.util.Random");

    return `// Unknown mode`; 
}

translations["lists_sort"] = (block) => {
    const list = block.inputs?.LIST?.block ? handleBlock(block.inputs.LIST.block) : "new ArrayList<>()";
    const type = block.fields?.TYPE || "NUMERIC"; // TEXT, NUMERIC, IGNORE_CASE
    const direction = block.fields?.DIRECTION || "1"; // 1 = ASCENDING, -1 = DESCENDING

    const sortCode = {
        "NUMERIC": `${list}.sort(Comparator.naturalOrder());`,
        "TEXT": `${list}.sort(Comparator.comparing(Object::toString));`,
        "IGNORE_CASE": `${list}.sort((a, b) -> a.toString().compareToIgnoreCase(b.toString()));`
    }[type];

    usedImports.add("java.util.Collections");
    usedImports.add("java.util.Comparator");

    return direction === "-1"
        ? `(Collections.sort(${list}, Collections.reverseOrder());)`
        : `(${sortCode})`;
}

translations["lists_reverse"] = (block) => {
    const list = block.inputs?.LIST?.block ? handleBlock(block.inputs.LIST.block) : "new ArrayList<>()";

    usedImports.add("java.util.Collections");
    usedImports.add("java.util.ArrayList");

    return `(Collections.reverse(${list}))`;
}

/* =====================
   Variables
   ===================== */

translations["variables_declare"] = (block) => {
    const type = block.fields?.TYPE || "int";
    const name = block.fields?.VAR || "x";
    const value = block.inputs?.VALUE?.block ? handleBlock(block.inputs.VALUE.block) : "";

    return `${type} ${name}${value !== "" ? " = " + value : ""};`;
}

translations["variables_set"] = (block) => {
    const name = block.fields?.VAR || "x";
            const value = block.inputs?.VALUE?.block ? handleBlock(block.inputs.VALUE.block) : "0";
        
            return `${name} = ${value};`;
}

translations["variables_get"] = (block) => {
    return block.fields?.VAR || "x";
}

/* =====================
   Functions
   ===================== */

translations["default_function_main"] = (block) => {
    const body = block.inputs?.BODY.block ? handleStatements(block.inputs.BODY.block) : "";
    return `public static void main(String[] args) {\n${indent(body)}\n}`;
}

translations["def_function"] = (block) => {
    const name = block.fields?.NAME || "myFunction";
    const retType = block.fields?.RET_TYPE || "void";
    const body = block.inputs?.BODY.block ? handleStatements(block.inputs.BODY.block) : "";
    return `static ${retType} ${name}() {\n${indent(body)}\n}`;
}

translations["call_function"] = (block) => {
    const name = block.fields?.NAME || "myFunction";
    return `${name}()`;
}

translations["call_function_silent"] = (block) => {
    const name = block.fields?.NAME || "myFunction";
    return `${name}()`;
}

translations["return_of_function"] = (block) => {
    const returnValue = block.inputs?.VALUE?.block ? handleBlock(block.inputs.VALUE.block) : "";
    return `return ${returnValue};`;
}

/* =====================
   Other
   ===================== */

translations["print"] = (block) => {
    const value = block.inputs?.MESSAGE?.block ? handleBlock(block.inputs.MESSAGE.block) : '""';
    return `System.out.println(${value});`;
}

/* -----------------------------------------------------------------------------------------------------------------------
Notice: The section for default operational blocks stops here.
From here on, the blocks are custom blocks that are not part of the default blockly library.
Most of these are special blocks related to Minecraft and are not part of the default blockly library.

Important: Block definitions are split into two parts:
1. Function Definition: Each block has its own function that executes its operation like playing a sound. All necessary information is passed to the function. (Like the type of sound, the volume, etc.)
2. Block Translation: Each block calls its corresponding function with the necessary parameters.
-----------------------------------------------------------------------------------------------------------------------
*/

/* =====================
   Minecraft
   ===================== */

/* TODO: Redo ain't working
// Play sound
translations["play_sound"] = (block) => {
    const sound = `"${block.fields?.SOUND || "block.anvil.land"}"`;
    const volume = parseFloat(block.fields?.VOLUME || "1");
    const pitch = parseFloat(block.fields?.PITCH || "1");

    usedImports.add("net.blockyfabric.BlockyFabricAPI");
    usedHelpers.add("playSound");

    return `BlockyFabricAPI.playSound(${sound}, ${volume}f, ${pitch}f);`;
}

minecraftFunctions["playSound"] = () => {
    const method = `public static void playSound(String sound, float volume, float pitch) {
    MinecraftClient.getInstance().player.playSound(
        SoundEvent.of(new Identifier(sound)), SoundCategory.MASTER, volume, pitch
    );
}`

    usedMinecraftImports.add("net.minecraft.client.MinecraftClient");
    usedMinecraftImports.add("net.minecraft.sound.SoundCategory");
    usedMinecraftImports.add("net.minecraft.util.Identifier");
    usedMinecraftImports.add("net.minecraft.sound.SoundEvent");

    return method;
}
*/

// Display title
translations["display_title"] = (block) => {
    const text = handleBlock(block.inputs?.TEXT?.block) || '"Title"';
    const fadeIn = parseInt(block.fields?.FADEIN || "1");
    const stay = parseInt(block.fields?.STAY || "1");
    const fadeOut = parseInt(block.fields?.FADEOUT || "1");

    usedImports.add("net.blockyfabric.BlockyFabricAPI");
    usedHelpers.add("displayTitle");

    return `BlockyFabricAPI.displayTitle(${text}, ${fadeIn}, ${stay}, ${fadeOut});`;
};

minecraftFunctions["displayTitle"] = () => {
    const method = `public static void displayTitle(String title, int fadeIn, int stay, int fadeOut) {
    MinecraftClient client = MinecraftClient.getInstance();
    if (client.player != null && client.inGameHud != null) {
        client.inGameHud.setTitle(Text.literal(title));
        client.inGameHud.setTitleTicks(fadeIn * 20, stay * 20, fadeOut * 20);
    }
}`;

    usedMinecraftImports.add("net.minecraft.client.MinecraftClient");
    usedMinecraftImports.add("net.minecraft.text.Text");


    return method;
};


translations["display_subtitle"] = (block) => {
    const text = handleBlock(block.inputs?.TEXT?.block) || '"Subtitle"';
    const fadeIn = parseInt(block.fields?.FADEIN || "1");
    const stay = parseInt(block.fields?.STAY || "1");
    const fadeOut = parseInt(block.fields?.FADEOUT || "1");

    usedImports.add("net.blockyfabric.BlockyFabricAPI");
    usedHelpers.add("displaySubtitle");

    return `BlockyFabricAPI.displaySubtitle(${text}, ${fadeIn}, ${stay}, ${fadeOut});`;
};

minecraftFunctions["displaySubtitle"] = () => {
    const method = `public static void displaySubtitle(String subtitle, int fadeIn, int stay, int fadeOut) {
    MinecraftClient client = MinecraftClient.getInstance();
    if (client.player != null && client.inGameHud != null) {
        client.inGameHud.setSubtitle(Text.literal(subtitle));
        client.inGameHud.setTitleTicks(fadeIn * 20, stay * 20, fadeOut * 20);
    }
}`;

    usedMinecraftImports.add("net.minecraft.client.MinecraftClient");
    usedMinecraftImports.add("net.minecraft.text.Text");

    return method;
};
