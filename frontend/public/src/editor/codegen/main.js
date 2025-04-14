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
        
        


        case "break":
            return "break;"

        case "return":
            return "return;"
        

        case "math_number":
            return block.fields?.NUM || "0";

        case "text":
            return `"${block.fields?.TEXT || ''}"`;

        case "print":
            const textBlock = block.inputs?.MESSAGE?.block?.fields?.TEXT;
            const value = textBlock ? `"${textBlock}"` : '""';  // If undefined replace with empty string
            return `System.out.println(${value});`;

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