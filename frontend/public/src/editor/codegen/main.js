// Used to translate blockly into Java Code

function exportCode() {
    const json = Blockly.serialization.workspaces.save(workspace); // Get the current state of the workspace

    generateJava(json);
}

    // Run each block trough a switch statement. Each switch statement outputs a java string and appends it to the array.
    // We need to validate some code. Some parts need to be turned into a String or integer. (This is only for some blocks tho where the input is a number but gets then treated as a string)


function generateJava(json) {
    const javaCode = [];

    for (const block of json.blocks.blocks) {
        const code = handleBlock(block);
        javaCode.push(code);
    }

    console.log(javaCode.join('\n'));
}

function handleBlock(block) {
    switch (block.type) {
        /* =====================
           Conditions
           ===================== */
        
        case "controls_if": {
            const conditionBlock = block.inputs?.IF0?.block;
            const doBlock = block.inputs?.DO0?.block;

            const condition = conditionBlock ? handleBlock(conditionBlock) : "true";
            const statements = doBlock ? handleStatements(doBlock) : "";

            return `if (${condition}) {\n${indent(statements)}\n}`;
        }

        case "logic_compare": {
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
        }

        case "logic_operation": {
            const opMap = {
                "AND": "&&",
                "OR": "||"
            };
        
            const op = opMap[block.fields?.OP] || "&&";
            const A = block.inputs?.A?.block ? handleBlock(block.inputs.A.block) : "true";
            const B = block.inputs?.B?.block ? handleBlock(block.inputs.B.block) : "true";
        
            return `${A} ${op} ${B}`;
        }

        case "logic_negate": {
            const value = block.inputs?.BOOL?.block ? handleBlock(block.inputs.BOOL.block) : "false";
            return `!(${value})`; // Need brackets here
        }
        
        case "logic_boolean": {
            return block.fields?.BOOL ? block.fields.BOOL.toLowerCase() : "false";
        }


        /* =====================
           Loops
           ===================== */

        case "controls_repeat_ext": {
            const timesBlock = block.inputs?.TIMES?.block;
            const times = timesBlock ? handleBlock(timesBlock) : "0";
        
            const doBlock = block.inputs?.DO?.block;
            const body = doBlock ? indent(handleStatements(doBlock)) : "";
        
            return `for (int i = 0; i < ${times}; i++) {\n${body}\n}`;
        }
        
        case "controls_whileUntil": {
            const mode = block.fields?.MODE || "WHILE"; // "WHILE" or "UNTIL"
            const conditionBlock = block.inputs?.BOOL?.block;
            const bodyBlock = block.inputs?.DO?.block;
        
            let condition = conditionBlock ? handleBlock(conditionBlock) : "true";
            const body = bodyBlock ? indent(handleStatements(bodyBlock)) : "";
        
            if (mode === "UNTIL") {
                condition = `!(${condition})`;
            }
        
            return `while (${condition}) {\n${body}\n}`;
        }
        
        // May need to adjust after adding translation for lists to be able to read them properly
        case "controls_forEach": {
            const varName = block.fields?.VAR || "item";
            const listBlock = block.inputs?.LIST?.block;
            const bodyBlock = block.inputs?.DO?.block;
        
            const list = listBlock ? handleBlock(listBlock) : "new ArrayList<>()";
            const body = bodyBlock ? indent(handleStatements(bodyBlock)) : "";
        
            return `for (var ${varName} : ${list}) {\n${body}\n}`;
        }

        /* =====================
           Math
           ===================== */

        case "math_arithmetic": {
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

        case "math_single": {
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
                    console.warn(`Unbekannter math_single-Operator: ${op}`);
                    return `/* unknown math_single op: ${op} */`;
            }
        }

        case "math_trig": {
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
                console.warn(`Unbekannter math_trig-Operator: ${op}`);
                return `/* unknown math_trig op: ${op} */`;
            }
        
            return `${func}(${angle})`;
        }

        case "custom_math_number_property": {
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

        case "math_round": {
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

        case "math_on_list": {
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

        case "math_modulo": {
            const dividend = block.inputs?.DIVIDEND?.block ? handleBlock(block.inputs.DIVIDEND.block) : "0";
            const divisor = block.inputs?.DIVISOR?.block ? handleBlock(block.inputs.DIVISOR.block) : "1";
            return `(${dividend} % ${divisor})`;
        }
        
        case "math_random_int": {
            const from = block.inputs?.FROM?.block ? handleBlock(block.inputs.FROM.block) : "0";
            const to = block.inputs?.TO?.block ? handleBlock(block.inputs.TO.block) : "100";
        
            return `(int)(Math.floor(Math.random() * (${to} - ${from} + 1)) + ${from})`;
        }

        // Might need to adjust some blocks in the future for all strings being able to be parsed
        case "parse_int": {
            const input = block.inputs?.VALUE?.block ? handleBlock(block.inputs.VALUE.block) : `"0"`;
            return `Integer.parseInt(${input})`;
        }
        
        /* =====================
           Strings
           ===================== */
        
        case "text":
            return `"${block.fields?.TEXT || ''}"`;

        case "text_join": {
            const items = [];
            
            
            Object.keys(block.inputs).forEach(inputKey => {
                const inputBlock = block.inputs[inputKey]?.block;
                if (inputBlock) {
                    const itemValue = handleBlock(inputBlock);  // Process each connected block
                    items.push(itemValue);
                }
            });
            
            if (items.length === 0) {
                return '""';
            }
            
            return `(${items.join(" + ")})`;
        }

        case "text_length": {
            const text = block.inputs?.VALUE?.block ? handleBlock(block.inputs.VALUE.block) : '""';
            return `${text}.length()`;
        }        
            
        case "text_getSubstring": {
            const text = block.inputs?.STRING?.block ? handleBlock(block.inputs.STRING.block) : '""';
            let start = block.inputs?.AT1?.block ? handleBlock(block.inputs.AT1.block) : "1";
            let end = block.inputs?.AT2?.block ? handleBlock(block.inputs.AT2.block) : "1";
        
            // Wrap start in `Math.max(${start}, 1)` to make su re it’s never < 1 before subtracting 1
            start = `Math.max(${start}, 1) - 1`;
        
            return `${text}.substring(${start}, ${end})`;
        }
        
        case "text_changeCase": {
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

        case "text_trim": {
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

        case "text_count": {
            const haystack = block.inputs?.TEXT?.block ? handleBlock(block.inputs.TEXT.block) : '""';
            const needle = block.inputs?.SUBSTRING?.block ? handleBlock(block.inputs.SUBSTRING.block) : '""';
            return `${haystack}.split(${needle}, -1).length - 1`;
        }
        
        
        
        
        


        case "break":
            return "break;"

        case "return":
            return "return;"
        

        case "math_number":
            return block.fields?.NUM || "0";


        case "print": {
            const value = block.inputs?.TEXT?.block ? handleBlock(block.inputs.TEXT.block) : '""';
            return `System.out.println(${value});`;
        }
            
        default:
            return `// Unhandled block: ${block.type}`;
    }
}


function handleStatements(block) {
    let code = handleBlock(block);
    if (block.next?.block) {
        code += handleStatements(block.next.block);
    }
    return code;
}

function indent(str, spaces = 4) {
    const pad = ' '.repeat(spaces);
    return str
        .split('\n')
        .map(line => (line.trim() ? pad + line : line))
        .join('\n');
}