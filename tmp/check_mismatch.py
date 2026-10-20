import sys

def check_mismatch(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    stack = []
    for i, line in enumerate(lines):
        for j, char in enumerate(line):
            if char == '(':
                stack.append(('(', i + 1, j + 1))
            elif char == ')':
                if not stack:
                    print(f"Extra ')' at line {i+1}, col {j+1}")
                else:
                    stack.pop()
    
    for char, line, col in stack:
        print(f"Unclosed '{char}' at line {line}, col {col}")

if __name__ == "__main__":
    check_mismatch(sys.argv[1])
