import sys

def check(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    stack = []
    lines = content.split('\n')
    
    for i, line in enumerate(lines):
        for j, char in enumerate(line):
            if char in '({[':
                stack.append((char, i + 1, j + 1))
            elif char in ')}]':
                if not stack:
                    print(f"Extra {char} at {i+1}:{j+1}")
                    continue
                last_char, last_line, last_col = stack[-1]
                if (char == ')' and last_char == '(') or \
                   (char == '}' and last_char == '{') or \
                   (char == ']' and last_char == '['):
                    stack.pop()
                else:
                    print(f"Mismatched {char} at {i+1}:{j+1}, expected closer for {last_char} from {last_line}:{last_col}")
                    # Try to recover by popping if it matches an earlier one
                    found = False
                    for k in range(len(stack)-2, -1, -1):
                        lc, ll, lc_col = stack[k]
                        if (char == ')' and lc == '(') or (char == '}' and lc == '{') or (char == ']' and lc == '['):
                            # Pop everything up to here
                            for _ in range(len(stack)-1, k-1, -1):
                                item = stack.pop()
                                if item[0] != lc:
                                    print(f"Abandoned {item[0]} from {item[1]}:{item[2]}")
                            found = True
                            break
                    if not found:
                        print(f"Could not find matching opener for {char}")

    for char, line, col in stack:
        print(f"Still open: {char} from {line}:{col}")

if __name__ == "__main__":
    check(sys.argv[1])
