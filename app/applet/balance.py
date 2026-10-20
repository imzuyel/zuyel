import sys

def check_balance(filename, start_line, end_line):
    with open(filename, 'r') as f:
        lines = f.readlines()[start_line-1:end_line]
    
    stack = []
    for i, line in enumerate(lines):
        line_num = i + start_line
        for j, char in enumerate(line):
            if char == '(':
                stack.append((line_num, j + 1))
            elif char == ')':
                if stack:
                    stack.pop()
                else:
                    print(f"Extra closing parenthesis at line {line_num}, col {j + 1}")
    
    if stack:
        print(f"Unclosed parentheses starting at lines: {[s[0] for s in stack]}")
    else:
        print("Parentheses are balanced in this range (considering internal only)")

if __name__ == "__main__":
    check_balance(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]))
