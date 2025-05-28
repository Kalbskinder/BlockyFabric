package net.modwizard.utils;

import java.util.ArrayList;
import java.util.List;
import java.util.Stack;
import java.util.StringTokenizer;

public class Eval {

    public static double eval(String expr) {
        return evaluatePostfix(toPostfix(expr));
    }

    private static List<String> toPostfix(String expr) {
        List<String> output = new ArrayList<>();
        Stack<String> ops = new Stack<>();
        StringTokenizer tokens = new StringTokenizer(expr, "+-*/() ", true);

        while (tokens.hasMoreTokens()) {
            String token = tokens.nextToken().trim();
            if (token.isEmpty()) continue;

            if (isNumber(token)) {
                output.add(token);
            } else if ("(".equals(token)) {
                ops.push(token);
            } else if (")".equals(token)) {
                while (!ops.isEmpty() && !"(".equals(ops.peek())) {
                    output.add(ops.pop());
                }
                ops.pop(); // Remove '('
            } else if (isOperator(token)) {
                while (!ops.isEmpty() && precedence(ops.peek()) >= precedence(token)) {
                    output.add(ops.pop());
                }
                ops.push(token);
            }
        }

        while (!ops.isEmpty()) {
            output.add(ops.pop());
        }

        return output;
    }

    private static double evaluatePostfix(List<String> postfix) {
        Stack<Double> stack = new Stack<>();
        for (String token : postfix) {
            if (isNumber(token)) {
                stack.push(Double.parseDouble(token));
            } else if (isOperator(token)) {
                double b = stack.pop();
                double a = stack.pop();
                switch (token) {
                    case "+": stack.push(a + b); break;
                    case "-": stack.push(a - b); break;
                    case "*": stack.push(a * b); break;
                    case "/": stack.push(a / b); break;
                }
            }
        }
        return stack.pop();
    }

    private static boolean isNumber(String s) {
        return s.matches("\\d+(\\.\\d+)?");
    }

    private static boolean isOperator(String s) {
        return "+-*/".contains(s);
    }

    private static int precedence(String op) {
        if ("+".equals(op) || "-".equals(op)) return 1;
        if ("*".equals(op) || "/".equals(op)) return 2;
        return 0;
    }
    
}
