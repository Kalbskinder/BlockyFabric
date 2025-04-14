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
        

        case "math_number":
            return block.fields?.NUM || "0";

        case "text":
            return `"${block.fields?.TEXT || ''}"`;

        case "print":
            const textBlock = block.inputs?.MESSAGE?.block?.fields?.TEXT;
            console.log("TextBlock:", textBlock); 
            const value = textBlock ? `"${textBlock}"` : '""';  // If undefined replace with empty string
            return `System.out.println(${value});`;

        default:
            return `// Unhandled block: ${block.type}`;
    }
}


function handleStatements(block) {
    let code = handleBlock(block) + '\n';
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