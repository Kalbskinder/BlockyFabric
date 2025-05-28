// Used to translate blockly into Java Code

const usedImports = new Set();

// Second class for Minecraft specific blocks
const usedMinecraftImports = new Set();
const usedHelpers = new Set();
const initializeChildren = new Set()

usedImports.add("org.slf4j.LoggerFactory")

function exportCode() {
    const json = Blockly.serialization.workspaces.save(workspace); // Save the current workspace
    const code = generateJava(json);

    let importSection = Array.from(usedImports).map(i => `import ${i};`).join("\n");
    importSection  ? importSection += "\n\n" : "";
    usedImports.clear(); // Clear used imports for next export

    const mainClassCode = `package net.modwizard;\n\n${'import net.fabricmc.api.ClientModInitializer;\n' + importSection}public class Client implements ClientModInitializer {${indent(`\npublic static final String MOD_ID = "ModWizardLogger";\npublic static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(MOD_ID);\n`, 4)}\n${indent(code)}\n}`; // Put code into the class main
    
    return mainClassCode
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
    if (!block || block.disabledReasons) return "";

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

// Function to convert Minecraft color codes to Java color codes
function convertColorCodes(text) {
    return text.replace(/&([0-9a-fk-or])/gi, "§$1");
}

// Remove "/" from the beginning of the command name
function sanitizeCommandName(name) {
    return name.replace(/^\/+/, "");
}

// Special function to handle command statements, similar to handleStatements but with subcommands support
function handleCommandStatements(block) {
    let statements = "";
    let subcommands = "";

    while (block) {
        const translation = translations[block.type];
        const code = translation ? translation(block) : `// Unknown block: ${block.type}`;

        if (block.type === "new_sub_command") {
            subcommands += code + "\n";
        } else {
            statements += code + "\n";
        }

        block = block.next?.block;
    }

    return { statements: statements.trim(), subcommands: subcommands.trim() };
}

function getChainedBlocks(startBlock) {
    const blocks = [];
    let current = startBlock;

    while (current) {
        blocks.push(current);
        current = current.next?.block;
    }

    return blocks;
}

function buildArgumentChain(args, finalExecutesBlockLines) {
    if (args.length === 0) return finalExecutesBlockLines.join("\n");

    const current = args[0];
    const rest = args.slice(1);

    const name = current.fields.ARG_NAME;
    const type = current.fields.ARG_TYPE;

    let typeExpr;
    switch (type) {
        case "int":
            typeExpr = "IntegerArgumentType.integer()";
            usedImports.add("com.mojang.brigadier.arguments.IntegerArgumentType");
            break;
        case "float":
            typeExpr = "FloatArgumentType.floatArg()";
            usedImports.add("com.mojang.brigadier.arguments.FloatArgumentType");
            break;
        case "string":
            typeExpr = "StringArgumentType.string()";
            usedImports.add("com.mojang.brigadier.arguments.StringArgumentType");
            break;
        case "boolean":
            typeExpr = "BoolArgumentType.bool()";
            usedImports.add("com.mojang.brigadier.arguments.BoolArgumentType");
            break;
        default:
            typeExpr = "StringArgumentType.word()";
            usedImports.add("com.mojang.brigadier.arguments.StringArgumentType");
            break;
    }

    const argumentLine = `ClientCommandManager.argument("${name}", ${typeExpr})`;

    if (rest.length === 0) {
        return `${argumentLine}\n${indent(finalExecutesBlockLines.join("\n"), 4)}`;
    }

    return `${argumentLine}\n.then(${buildArgumentChain(rest, finalExecutesBlockLines)})`;
}



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

    const isString = (val) => /^".*"$/.test(val) || val.includes('String.class');

    if (isString(A) || isString(B)) {
        if (op === "EQ") {
            return `${A}.equals(${B})`;
        } else if (op === "NEQ") {
            return `!${A}.equals(${B})`;
        }
    }

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

translations["try_catch"] = (block) => {
    const tryBlock = block.inputs?.TRY?.block ? handleStatements(block.inputs.TRY.block) : "";
    const catchBlock = block.inputs?.CATCH?.block ? handleStatements(block.inputs.CATCH.block) : "";
    const finallyBlock = block.inputs?.FINALLY?.block ? handleStatements(block.inputs.FINALLY.block) : "";

    if (finallyBlock) {
        return `try {\n${indent(tryBlock)}\n} catch (Exception e) {\n${indent(catchBlock)}\n} finally {\n${indent(finallyBlock)}\n}`;
    } else {
        return `try {\n${indent(tryBlock)}\n} catch (Exception e) {\n${indent(catchBlock)}\n}`;
    }
}

translations["error"] = (block) => {
    return "e";
}

translations["throw_error"] = (block) => {
    const message = block.inputs?.ERROR?.block ? handleBlock(block.inputs.ERROR.block) : "";
    return `throw new Exception(${message});`;
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

translations["parse_double"] = (block) => {
    const input = block.inputs?.VALUE?.block ? handleBlock(block.inputs.VALUE.block) : `"0"`;
    return `Double.parseDouble(${input})`;
}

translations["math_pi"] = () => {
    return "Math.PI";
}

translations["evaluate"] = (block) => {
    usedImports.add("net.modwizard.utils.Eval");
    const expression = block.inputs?.EXPRESSION?.block ? handleBlock(block.inputs.EXPRESSION.block) : '"0"';
    return `String.valueOf(Eval.eval(${expression})`;
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

    if (type === "String") {
        return `String ${name} = ${convertColorCodes(value)};`;
    }

    return `${type} ${name}${value !== "" ? " = " + value : ""};`;
}

translations["variables_set"] = (block) => {
    const name = block.fields?.VAR || "x";
    const value = block.inputs?.VALUE?.block ? handleBlock(block.inputs.VALUE.block) : "0";

    if (typeof value === "string") {
        return `${name} = ${convertColorCodes(value)};`;
    }
        
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
    return `@Override\npublic void onInitializeClient() {\n${indent(body)}\n}`;
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

translations["log"] = (block) => {
    const value = block.inputs?.MESSAGE?.block ? handleBlock(block.inputs.MESSAGE.block) : '""';
    const type = block.fields?.TYPE || "info";
    return `LOGGER.${type}(${value});`;
}

translations["comment"] = (block) => {
    console.log(block)
    return `\n// ${block.inputs?.COMMENT?.block?.fields?.TEXT || "Comment"}`;
}

translations["regex"] = (block) => {
    const pattern = handleBlock(block.inputs?.REGEX?.block) || '""';
    const string = handleBlock(block.inputs?.STRING?.block) || '""';
    const caseSensitive = block.fields?.CASE_SENSITIVE === "TRUE";

    usedImports.add("java.util.regex.Pattern");
    usedImports.add("java.util.regex.Matcher");
    usedImports.add("java.util.function.Supplier");

    return `((Supplier<String>) () -> { Matcher m = Pattern.compile(${pattern}${caseSensitive ? "" : ", Pattern.CASE_INSENSITIVE"}).matcher(${string}); return m.find() ? m.group(1) : ""; }).get()`;
};

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
   General
   ===================== */

// Play sound
translations["play_sound"] = (block) => {
    const sound = `"${block.fields?.SOUND || "block.anvil.land"}"`;
    const volume = parseFloat(block.fields?.VOLUME || "1");
    const pitch = parseFloat(block.fields?.PITCH || "1");

    usedImports.add("net.modwizard.ModWizardAPI");

    return `ModWizardAPI.playSound(${sound}, ${volume}f, ${pitch}f);`;
}

// Display title
translations["display_title"] = (block) => {
    const text = handleBlock(block.inputs?.TEXT?.block) || '"Title"';
    const fadeIn = parseInt(block.fields?.FADEIN || "1");
    const stay = parseInt(block.fields?.STAY || "1");
    const fadeOut = parseInt(block.fields?.FADEOUT || "1");

    usedImports.add("net.modwizard.ModWizardAPI");

    return `ModWizardAPI.displayTitle(${convertColorCodes(text)}, ${fadeIn}, ${stay}, ${fadeOut});`;
};

// Display subtitle
translations["display_subtitle"] = (block) => {
    const text = handleBlock(block.inputs?.TEXT?.block) || '"Subtitle"';
    const fadeIn = parseInt(block.fields?.FADEIN || "1");
    const stay = parseInt(block.fields?.STAY || "1");
    const fadeOut = parseInt(block.fields?.FADEOUT || "1");

    usedImports.add("net.modwizard.ModWizardAPI");

    return `ModWizardAPI.displaySubtitle(${convertColorCodes(text)}, ${fadeIn}, ${stay}, ${fadeOut});`;
};

// Display actionbar
translations["display_actionbar"] = (block) => {
    let text = handleBlock(block.inputs?.TEXT?.block) || '"Actionbar"';

    usedImports.add("net.modwizard.ModWizardAPI");

    return `ModWizardAPI.displayActionbar(${convertColorCodes(text)});`;
};

// Send messages
translations["send_message"] = (block) => {
    const message = handleBlock(block.inputs?.MESSAGE?.block) || '"Hello World!"';
    const isGlobal = block.fields?.GLOBAL === true;

    usedImports.add("net.modwizard.ModWizardAPI");

    return `ModWizardAPI.sendMessage(${convertColorCodes(message)}, ${isGlobal});`;
};

/* =====================
   Events
   ===================== */

translations["event_triggered"] = (block) => {
    const eventType = block.fields?.KEY || "";

    if (!eventType) {
        console.warn("No event type specified.");
        return "// Unkown EVENT_TYPE.";
    }

    const children = block.inputs?.DO?.block ? handleStatements(block.inputs.DO.block) : "";

    switch (eventType) {

        /*
        * Chat Events
        */
        case "ClientMessageEvents.CHAT_MESSAGE":
            usedImports.add("net.fabricmc.fabric.api.client.message.v1.ClientReceiveMessageEvents");

            return `ClientReceiveMessageEvents.CHAT.register((message, signed_message, sender, params, timestamp) -> {
    String eventMessage = message.getString(); 
    if (sender == null || sender.getId() == null) return;
    String eventSender = sender.toString();

${indent(children, 4)}
});`;
        case "ClientMessageEvents.GAME_MESSAGE":
            usedImports.add("net.fabricmc.fabric.api.client.message.v1.ClientReceiveMessageEvents");
            
            return `ClientReceiveMessageEvents.GAME.register((message, overlay) -> {
	String eventMessage = message.getString();
	if (!overlay) {
${indent(children, 8)}			
    }
});`;

        /*
        * Block Events
        */
        case "ClientPlayerBlockBreakEvents.AFTER":
            usedImports.add("net.fabricmc.fabric.api.event.client.player.ClientPlayerBlockBreakEvents");

            return `ClientPlayerBlockBreakEvents.AFTER.register((world, player, pos, state) -> {
	String eventBlock = state.getBlock().getName().getString();
${indent(children, 4)}		
});`;

        case "UseBlockCallback.EVENT":
            usedImports.add("net.fabricmc.fabric.api.event.player.UseBlockCallback");
            usedImports.add("net.minecraft.util.ActionResult");

            return `UseBlockCallback.EVENT.register((playerEntity, world, hand, blockHitResult) -> {
    BlockPos p = hitResult.getBlockPos();
	BlockState state = world.getBlockState(p);
	Block b = state.getBlock();
	Identifier block = Registries.BLOCK.getId(b);
	String pos = p.getX() + ", " + p.getY() + ", " + p.getZ();

${indent(children, 4)}	
    return ActionResult.PASS;
});`;

        case "AttackBlockCallback.EVENT":
            usedImports.add("net.fabricmc.fabric.api.event.player.AttackBlockCallback");
            usedImports.add("net.minecraft.util.ActionResult");
            usedImports.add("net.minecraft.block.BlockState");
            usedImports.add("net.minecraft.block.Block");
            usedImports.add("net.minecraft.util.Identifier");
            usedImports.add("net.minecraft.registry.Registries");

            return `AttackBlockCallback.EVENT.register((playerEntity, world, hand, blockPos, direction) -> {
    String pos = blockPos.getX() + ", " + blockPos.getY() + ", " + blockPos.getZ();
	BlockState state = world.getBlockState(blockPos);
	Block b = state.getBlock();
	Identifier block = Registries.BLOCK.getId(b);
    
${indent(children, 4)}	
    return ActionResult.PASS;
});`;

        /*
        * Entity Events
        */
        case "AttackEntityCallback.EVENT":
            usedImports.add("net.fabricmc.fabric.api.event.player.AttackEntityCallback");
            usedImports.add("net.minecraft.util.ActionResult");

        return `AttackEntityCallback.EVENT.register((playerEntity, world, hand, entity, entityHitResult) -> {
	String eventEntity = entity.getName().getString();
${indent(children, 4)}
	return ActionResult.PASS;
});`

        case "UseEntityCallback.EVENT":
            usedImports.add("net.fabricmc.fabric.api.event.player.UseEntityCallback;");
            usedImports.add("net.minecraft.util.ActionResult;");

            return `UseEntityCallback.EVENT.register((playerEntity, world, hand, entity, entityHitResult) -> {
	String eventEntity = entity.getName().getString();
${indent(children, 4)}
	return ActionResult.PASS;
});`;

        /*
        * Item Events
        */

        // Returns item as String minecraft:item_name
        case "UseItemCallback.EVENT":
            usedImports.add("net.fabricmc.fabric.api.event.player.UseItemCallback;");
            usedImports.add("net.minecraft.util.ActionResult;");

            return `UseItemCallback.EVENT.register((playerEntity, world, hand) -> {
	String eventItem = playerEntity.getMainHandStack().getItem().toString();
${indent(children, 4)}
	return ActionResult.PASS;
});`;

        /*
        * Server Events
        */

        case "ConnectCallback.EVENT":
            usedImports.add("net.fabricmc.fabric.api.client.networking.v1.ClientPlayConnectionEvents")
            return `ClientPlayConnectionEvents.JOIN.register((clientPlayNetworkHandler, packetSender, minecraftClient) -> {
	String serverAddress = clientPlayNetworkHandler.getServerInfo().address.toString();
${indent(children, 4)}
});`;

        case "DisconnectCallback.EVENT":
            usedImports.add("net.fabricmc.fabric.api.client.networking.v1.ClientPlayConnectionEvents")
            return `ClientPlayConnectionEvents.DISCONNECT.register((clientPlayNetworkHandler, minecraftClient) -> {
	String serverAddress = clientPlayNetworkHandler.getServerInfo().address.toString();
${indent(children, 4)}
});`;


        /*
        * Other Events
        */   

        default:
            return "// Unkown EVENT_TYPE.";
    }
};

translations["repeat_ticks"] = (block) => {
    const interval = block.fields?.TICKS || 20;
    const doBlock = block.inputs?.DO?.block;

    const statements = doBlock ? handleCommandStatements(doBlock).statements : "";

    usedImports.add("net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents");
    usedImports.add("net.minecraft.client.MinecraftClient");

    const counterName = `__tickCounter${Math.floor(Math.random() * 10000)}`;

    return `
int[] ${counterName} = new int[]{0};
ClientTickEvents.END_CLIENT_TICK.register(client -> {
    if (!client.isPaused()) {
        ${counterName}[0]++;
        if (${counterName}[0] >= ${interval}) {
            ${counterName}[0] = 0;
${indent(statements, 12)}
        }
    }
});`.trim();
};


// Returns the message from the event
translations["event_message"] = () => {
    return "eventMessage";
};

translations["event_block"] = (block) => {
    return `${block.fields?.OPTIONS || "block" }`;
};

translations["event_entity"] = () => {
    return "eventEntity";
};

translations["event_sender"] = () => {
    return "eventSender";
};

translations["event_item"] = () => {
    return "eventItem";
};

translations["event_server"] = () => {
    return "serverAddress";
};


/* =====================
   Commands
   ===================== */

// Register a new command
translations["new_command"] = (block) => {
    const command = sanitizeCommandName(block.inputs?.COMMAND?.block?.fields?.TEXT || "myCommand");

    const doBlock = block.inputs?.DO?.block;
    const subcommandsBlock = block.inputs?.SUBCOMMANDS?.block;
    const argsBlock = block.inputs?.ARGS?.block;

    // Get args as list
    const argBlocks = argsBlock ? getChainedBlocks(argsBlock) : [];

    // Blocks in the doBlock (when exeuted)
    const execBodyLines = doBlock ? handleCommandStatements(doBlock).statements.split('\n') : [];

    // Variables defined based on the argument names/types
    const variableLines = argBlocks.map(arg => {
        const name = arg.fields.ARG_NAME;
        const type = arg.fields.ARG_TYPE;

        const javaType = {
            "int": "Integer",
            "float": "Float",
            "string": "String",
            "boolean": "Boolean"
        }[type] || "String";

        return `${javaType} ${name} = context.getArgument("${name}", ${javaType}.class);`;
    });

    const fullExecBody = [...variableLines, "", ...execBodyLines].join('\n');
    const finalExecutes = `\n.executes(context -> {\n${indent(fullExecBody, 4)}\nreturn 1;\n    })`;

    const argumentChain = argBlocks.length > 0
    ? `\n    .then(${buildArgumentChain(argBlocks, [finalExecutes])})`
    : `${finalExecutes}`;

    const subcommands = subcommandsBlock ? handleCommandStatements(subcommandsBlock).subcommands : "";

    usedImports.add("net.fabricmc.fabric.api.client.command.v2.ClientCommandRegistrationCallback");
    usedImports.add("net.fabricmc.fabric.api.client.command.v2.ClientCommandManager");

    const root = `ClientCommandManager.literal("${command}")`;
    const fullChain = argumentChain
    ? `${root}\n${indent(argumentChain, 4)}`
    : `${root}${finalExecutes}`;


    return `
ClientCommandRegistrationCallback.EVENT.register((dispatcher, registryAccess) -> {
    dispatcher.register(
        ${fullChain}
${subcommands ? indent(subcommands, 8) : ""}
    );
});`.trim();
};


// Command subcommand (command argument: /myCommand)
translations["new_sub_command"] = (block) => {
    const subCommandName = sanitizeCommandName(block.inputs?.ARGUMENT_NAME?.block?.fields?.TEXT || "subCommand");

    const argStartBlock = block.inputs?.ARGS?.block;
    const argBlocks = argStartBlock ? getChainedBlocks(argStartBlock) : [];

    const doBlock = block.inputs?.DO?.block;
    const statements = doBlock ? handleCommandStatements(doBlock).statements : "";

    // Generiere Variablen aus Argumenten
    const variableLines = argBlocks.map(arg => {
        const name = arg.fields.ARG_NAME;
        const type = arg.fields.ARG_TYPE;

        const javaType = {
            "int": "Integer",
            "float": "Float",
            "string": "String",
            "boolean": "Boolean"
        }[type] || "String";

        return `${javaType} ${name} = context.getArgument("${name}", ${javaType}.class);`;
    });

    const fullExecBody = [...variableLines, "", ...statements.split('\n')].join('\n');

    const finalExecutes = `
.executes(context -> {
${indent(fullExecBody, 4)}
    return 1;
})`;

    const argumentChain = argBlocks.length > 0
        ? `.then(${buildArgumentChain(argBlocks, [finalExecutes])})`
        : `${finalExecutes}`;

    return `
.then(ClientCommandManager.literal("${subCommandName}")
    ${indent(argumentChain, 4).trim()}
)`.trim();
};


translations["command_argument_get"] = (block) => {
    const argName = block.fields?.VAR || "arg";
    return `${argName}`;
};


/* =====================
   Player info
   ===================== */

// Player position X
translations["player_position_x"] = () => {
    usedImports.add("net.modwizard.ModWizardAPI");
    return `ModWizardAPI.getPlayerX()`;
};

// Player position Y
translations["player_position_y"] = () => {
    usedImports.add("net.modwizard.ModWizardAPI");
    return `ModWizardAPI.getPlayerY()`;
};

// Player position Z
translations["player_position_z"] = () => {
    usedImports.add("net.modwizard.ModWizardAPI");
    return `ModWizardAPI.getPlayerZ()`;
};

translations["player_yaw_pitch"] = (block) => {
    usedImports.add("net.modwizard.ModWizardAPI");
    return `ModWizardAPI.getPlayerRotation(${block.fields?.OPTIONS || "true"})`;
};

// Player xp
translations["player_xp"] = () => {
    usedImports.add("net.modwizard.ModWizardAPI");
    return `ModWizardAPI.getPlayerXP()`;
};

// Player Biome
/*
translations["player_biome"] = () => {
    usedImports.add("net.modwizard.ModWizardAPI");
    usedHelpers.add("getPlayerBiome");
    return `ModWizardAPI.getPlayerBiome()`;
};
*/

// Player username
translations["player_username"] = () => {
    usedImports.add("net.modwizard.ModWizardAPI");
    return `ModWizardAPI.getPlayerName()`;
}

// Player uuid
translations["player_uuid"] = () => {
    usedImports.add("net.modwizard.ModWizardAPI");
    return `ModWizardAPI.getPlayerUUID()`;
}

// Player game mode
translations["player_gamemode"] = () => {
    usedImports.add("net.modwizard.ModWizardAPI");
    return `ModWizardAPI.getPlayerGameMode()`;
};

// Copy to clipboard and get clipboard
translations["player_clipboard_get"] = () => {
    usedImports.add("net.modwizard.ModWizardAPI");
    return `ModWizardAPI.playerClipboard("", "get")`;
}

translations["player_clipboard_set"] = (block) => {
    usedImports.add("net.modwizard.ModWizardAPI");
    return `ModWizardAPI.playerClipboard(${handleBlock(block.inputs?.TEXT?.block) || '"Hello World!"'}, "copy");`;
}

// Player drop held item
translations["player_item_drop"] = (block) => {
    usedImports.add("net.modwizard.ModWizardAPI");
    return `ModWizardAPI.dropHeldItem(${block.fields?.ENTIRE_STACK || "false"})`;
}


/* =====================
   Display Entitys
   ===================== */

translations["create_display_entity"] = (block) => {
    const entityId = block.fields?.ID;
    const entityType = block.fields?.TYPE;

    switch (entityType) {
        case "item_display":
            return `CustomEntityRenderer.renderItemDisplayEntity("${entityId}", "minecraft:diamond", 0, 0, 0, 0.5f, 0.5f, 0.5f, 0, 0, 0 );`;
        case "block_display":
            return `CustomEntityRenderer.renderBlockDisplayEntity("${entityId}", "minecraft:diamond_ore", 0, 0, 0.5f, 0.5f, 0.5f, 0.5f, 0, 0, 0);`
        case "text_display":
            return `CustomEntityRenderer.renderTextDisplayEntity("${entityId}", "Hello, World!", 0, 0, 0, 0.5f, 0.5f, 0.5f, 0, 0, 0);`
    }
}

translations["set_display_position"] = (block) => {
    const entityId = block.fields?.ID;

    const x = block.inputs?.X?.block ? handleBlock(block.inputs.X.block) : "0";
    const y = block.inputs?.Y?.block ? handleBlock(block.inputs.Y.block) : "0";
    const z = block.inputs?.Z?.block ? handleBlock(block.inputs.Z.block) : "0";

    return `CustomEntityRenderer.setPositionDisplayEntity("${entityId}", ${x}f, ${y}f, ${z}f);`;
}

translations["set_display_rotation"] = (block) => {
    const entityId = block.fields?.ID;
    const yaw = block.inputs?.YAW?.block ? handleBlock(block.inputs.YAW.block) : "0";
    const pitch = block.inputs?.PITCH?.block ? handleBlock(block.inputs.PITCH.block) : "0";
    const roll = block.inputs?.ROLL?.block ? handleBlock(block.inputs.ROLL.block) : "0";

    return `CustomEntityRenderer.setRotationDisplayEntity("${entityId}", ${yaw}f, ${pitch}f, ${roll}f);`;
}

translations["set_display_scale"] = (block) => {
    const entityId = block.fields?.ID;

    const x = block.inputs?.X?.block ? handleBlock(block.inputs.X.block) : "0";
    const y = block.inputs?.Y?.block ? handleBlock(block.inputs.Y.block) : "0";
    const z = block.inputs?.Z?.block ? handleBlock(block.inputs.Z.block) : "0";

    return `CustomEntityRenderer.setScaleDisplayEntity("${entityId}", ${x}f, ${y}f, ${z}f);`;
}

translations["set_display_block"] = (block) => {
    entityId = block.fields?.ID;
    block = block.fields?.BLOCK || "minecraft:diamond_ore";

    return `CustomEntityRenderer.setBlockBlockDisplayEntity("${entityId}", "${block}");`;
}

translations["set_display_item"] = (block) => {
    const entityId = block.fields?.ID;
    const item = block.fields?.ITEM || "minecraft:diamond";

    return `CustomEntityRenderer.setItemItemDisplayEntity("${entityId}", "${item}");`;
}

translations["set_display_text"] = (block) => {
    const entityId = block.fields?.ID;
    const text = block.inputs?.TEXT.block ? handleBlock(block.inputs.TEXT.block) : "Hello, World!";

    return `CustomEntityRenderer.setTextTextDisplayEntity("${entityId}", ${text});`;
}

translations["set_display_visibility"] = (block) => {
    const entityId = block.fields?.ID;
    const visible = block.fields?.VISIBLE || "true";

    return `CustomEntityRenderer.setVisibilityDisplayEntity("${entityId}", ${visible});`;
}

translations["delete_display_entity"] = (block) => {
    const entityId = block.fields?.ID;  

    return `CustomEntityRenderer.deleteDisplayEntity("${entityId}");`;
}


/* =====================
   Extras
   ===================== */

// Player glow effect
translations["player_glow"] = (block) => {
    const glow = block.fields?.GLOW || "false";
    usedImports.add("net.modwizard.extras.glowingplayer.GlowingPlayer")
    return `GlowingPlayer.setPlayerGlow(${glow});`;
}